import 'reflect-metadata';

import * as dotenv from 'dotenv';
import {Logger} from './service/logger/Logger';
import {BlockchainNodeLocal} from './blockchain/blockchain_nodes/BlockchainNodeLocal';
import {HealthMonitor} from './service/health_monitor/HealthMonitor';
import {BlockchainNodeHealthMonitor} from './service/health_monitor/BlockchainNodeHealthMonitor';
import {SignalAWSHeartbeat} from './service/health_monitor/signal/SignalAWSHeartbeat';
import {SignalAWSCriticalFailure} from './service/health_monitor/signal/SignalAWSCriticalFailure';
import {HostNameProvider} from './service/health_monitor/HostNameProvider';
import {RuleEngine} from './rule_engine/RuleEngine';
import {ConfigServiceAWS} from './service/config/ConfigServiceAWS';
import {TransactionQueuer} from './tx_queue/TransactionQueuer';
import PostgreTxQueue from './tx_queue/PostgreTxQueue';
import DBService from './service/db/dbService';
import {namespace} from './constants/constants';
import {AbiRepo} from './rule_engine/tool/abi_repository/AbiRepo';
import {BlockchainReader} from './blockchain/blockchain_reader/BlockchainReader';
import {FactoryRule} from './rule_engine/FactoryRule';
import {AbiStorageDynamoDB} from './rule_engine/tool/abi_repository/AbiStorageDynamoDB';
import {AbiFetcherEtherscan} from './rule_engine/tool/abi_repository/AbiFetcherEtherscan';
import {ModulesParams} from './types/ModulesParams';
import LeverageDataSourceDB from './rule_engine/tool/data_source/LeverageDataSourceDB';
import LeverageDataSourceNode from './rule_engine/tool/data_source/LeverageDataSourceNode';

dotenv.config();

export class Groot {
  private modulesParams: ModulesParams = {};

  constructor(
      configService: ConfigServiceAWS,
      logger: Logger,
      dbService: DBService,
  ) {
    this.modulesParams.configService = configService;
    this.modulesParams.logger = logger;
    this.modulesParams.dbService = dbService;

    this.initializeNodes();
    this.initializeHealthMonitor();

    this.initializeDataSources();

    this.modulesParams.blockchainReader = new BlockchainReader(
        this.modulesParams,
    );

    this.initializeAbiRepo();

    this.initializeRuleEngine();

    this.initializeTxQueuer();
  }

  private initializeNodes() {
    this.modulesParams.mainNode = new BlockchainNodeLocal(
        this.modulesParams,
        `http://localhost:${process.env.MAIN_LOCAL_NODE_PORT || 8545}`,
        'AlchemyNodeLabel',
    );
    this.modulesParams.altNode = new BlockchainNodeLocal(
        this.modulesParams,
        `http://localhost:${process.env.ALT_LOCAL_NODE_PORT || 18545}`,
        'InfuraNodeLabel',
    );
  }

  private initializeHealthMonitor() {
    this.modulesParams.blockchainNodeHealthMonitor = new BlockchainNodeHealthMonitor(
        this.modulesParams,
    );
    this.modulesParams.hostnameProvider = new HostNameProvider(this.modulesParams);
    this.modulesParams.signalCriticalFailure = new SignalAWSCriticalFailure(
        this.modulesParams,
        namespace,
    );
    this.modulesParams.signalHeartbeat = new SignalAWSHeartbeat(
        this.modulesParams,
        namespace,
    );
    this.modulesParams.healthMonitor = new HealthMonitor(
        this.modulesParams,
    );
  }

  private initializeDataSources() {
    this.modulesParams.leverageDataSource = {
      leverageDataSourceDB: new LeverageDataSourceDB(this.modulesParams),
      leverageDataSourceNode: new LeverageDataSourceNode(
          this.modulesParams,
      ),
    };
  }

  private initializeAbiRepo() {
    const abiStorage = new AbiStorageDynamoDB(this.modulesParams);
    const abiFetcher = new AbiFetcherEtherscan(this.modulesParams);
    this.modulesParams.abiRepo = new AbiRepo(this.modulesParams, abiStorage, abiFetcher);
  }

  private initializeRuleEngine() {
    const ruleFactory = new FactoryRule(
        this.modulesParams,
    );
    this.modulesParams.ruleEngine = new RuleEngine(this.modulesParams, ruleFactory);
  }

  private initializeTxQueuer() {
    const txQueue = new PostgreTxQueue(this.modulesParams);
    this.modulesParams.transactionsQueuer = new TransactionQueuer(this.modulesParams, txQueue);
  }

  public async initalizeGroot() {
    this.modulesParams.logger!.info('Initializing Groot...');
    await this.modulesParams.configService!.refreshConfig();
    this.modulesParams.logger!.info('Groot initialized successfully.');
  }

  public async shutdownGroot() {
    this.modulesParams.logger!.warn('Shutting down Groot...');

    await Promise.all([
      this.shutdownReadOnlyLocalNodes(),
      this.modulesParams.dbService!.end(),
    ]);

    this.modulesParams.logger!.warn('Groot shutdown successfully.');
  }

  private async shutdownReadOnlyLocalNodes() {
    await Promise.all([
      this.modulesParams.mainNode!.stopNode(),
      this.modulesParams.altNode!.stopNode(),
    ]);
  }

  public async prepareForAnotherCycle() {
    this.modulesParams.logger!.info('Preparing Groot for cycle...');
    await this.modulesParams.healthMonitor!.startOfCycleSequence();

    await this.modulesParams.configService!.refreshConfig();
    await this.setLocalNodesToNewestBlock();

    this.modulesParams.healthMonitor!.endOfCycleSequence();
    this.modulesParams.logger!.info('Groot is ready for cycle.');
  }

  private async setLocalNodesToNewestBlock() {
    await Promise.all([
      this.modulesParams.mainNode!.resetNode(this.modulesParams.configService!.getMainRPCURL()),
      this.modulesParams.altNode!.resetNode(this.modulesParams.configService!.getAlternativeRPCURL()),
    ]);
  }

  public async runOneGrootCycle(): Promise<void> {
    this.modulesParams.logger!.info('Running Groot cycle...');

    try {
      await this.modulesParams.ruleEngine!.loadRulesFromJSONConfig(this.modulesParams.configService!.getRules());
      try {
        await this.modulesParams.ruleEngine!.evaluateRulesAndCreateOutboundTransactions();
      } catch (err) {
        if (err instanceof Error) {
          console.error(err.message);
        }
      }
      const txs = this.modulesParams.ruleEngine!.getOutboundTransactions();
      await this.modulesParams.transactionsQueuer!.queueTransactions(txs);
    } catch (ex) {
      if (ex instanceof Error) {
        this.modulesParams.logger!.error(ex.message);
      }
    } finally {
      this.modulesParams.logger!.info('Groot cycle ran successfully.');
      await this.modulesParams.logger!.flush();
    }
  }

  public async sleepBetweenCycles(): Promise<void> {
    const sleepTime = this.modulesParams.configService!.getSleepMillisecondsBetweenCycles();
    this.modulesParams.logger!.debug(`Sleeping for ${sleepTime} seconds...`);
    await new Promise((resolve) => setTimeout(resolve, sleepTime));
  }
}
