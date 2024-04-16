import 'reflect-metadata';

import * as dotenv from 'dotenv';
import {ILogger} from './service/logger/interfaces/ILogger';
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

dotenv.config();

export class Groot {
  private mainNode!: BlockchainNodeLocal;
  private altNode!: BlockchainNodeLocal;
  private signalHeartbeat!: SignalAWSHeartbeat;
  private hostnameProvider!: HostNameProvider;
  private signalCriticalFailure!: SignalAWSCriticalFailure;
  private blockchainNodeHealthMonitor!: BlockchainNodeHealthMonitor;
  private healthMonitor!: HealthMonitor;
  private ruleEngine!: RuleEngine;
  private transactionsQueuer!: TransactionQueuer;
  private blockchainReader!: BlockchainReader;
  private abiRepo!: AbiRepo;

  constructor(
      private configService: ConfigServiceAWS,
      private logger: ILogger,
      private dbService: DBService,
  ) {
    this.initializeNodes();
    this.initializeHealthMonitor();

    this.blockchainReader = new BlockchainReader(this.logger, this.mainNode, this.altNode);

    this.initializeAbiRepo();

    this.initializeRuleEngine();

    this.initializeTxQueuer();
  }

  private initializeNodes() {
    this.mainNode = new BlockchainNodeLocal(
        this.logger,
        `http://localhost:${process.env.MAIN_LOCAL_NODE_PORT || 8545}`,
        'AlchemyNodeLabel',
    );
    this.altNode = new BlockchainNodeLocal(
        this.logger,
        `http://localhost:${process.env.ALT_LOCAL_NODE_PORT || 18545}`,
        'InfuraNodeLabel',
    );
  }

  private initializeHealthMonitor() {
    this.blockchainNodeHealthMonitor = new BlockchainNodeHealthMonitor(
        this.logger,
        this.mainNode,
        this.altNode,
    );
    this.hostnameProvider = new HostNameProvider(this.logger);
    this.signalCriticalFailure = new SignalAWSCriticalFailure(
        this.configService,
        this.logger,
        this.hostnameProvider,
        namespace,
    );
    this.signalHeartbeat = new SignalAWSHeartbeat(
        this.configService,
        this.logger,
        this.hostnameProvider,
        namespace,
    );
    this.healthMonitor = new HealthMonitor(
        this.logger,
        this.blockchainNodeHealthMonitor,
        this.signalHeartbeat,
        this.signalCriticalFailure,
    );
  }

  private initializeAbiRepo() {
    const abiStorage = new AbiStorageDynamoDB(this.configService);
    const abiFetcher = new AbiFetcherEtherscan(this.configService);
    this.abiRepo = new AbiRepo(this.blockchainReader, abiStorage, abiFetcher);
  }

  private initializeRuleEngine() {
    const ruleFactory = new FactoryRule(this.logger, this.configService, this.blockchainReader, this.abiRepo);
    this.ruleEngine = new RuleEngine(this.logger, ruleFactory);
  }

  private initializeTxQueuer() {
    const txQueue = new PostgreTxQueue(this.logger, this.dbService);
    this.transactionsQueuer = new TransactionQueuer(this.logger, txQueue);
  }

  public async initalizeGroot() {
    this.logger.info('Initializing Groot...');
    await this.configService.refreshConfig();
    this.logger.info('Groot initialized successfully.');
  }

  public async shutdownGroot() {
    this.logger.warn('Shutting down Groot...');

    await Promise.all([
      this.shutdownReadOnlyLocalNodes(),
      this.dbService.end(),
    ]);

    this.logger.warn('Groot shutdown successfully.');
  }

  private async shutdownReadOnlyLocalNodes() {
    await Promise.all([
      this.mainNode.stopNode(),
      this.altNode.stopNode(),
    ]);
  }

  public async prepareForAnotherCycle() {
    this.logger.info('Preparing Groot for cycle...');
    await this.healthMonitor.startOfCycleSequence();

    await this.configService.refreshConfig();
    await this.setLocalNodesToNewestBlock();

    this.healthMonitor.endOfCycleSequence();
    this.logger.info('Groot is ready for cycle.');
  }

  private async setLocalNodesToNewestBlock() {
    await Promise.all([
      this.mainNode.resetNode(this.configService.getMainRPCURL()),
      this.altNode.resetNode(this.configService.getAlternativeRPCURL()),
    ]);
  }

  public async runOneGrootCycle(): Promise<void> {
    this.logger.info('Running Groot cycle...');

    try {
      await this.ruleEngine.loadRulesFromJSONConfig(this.configService.getRules());
      try {
        await this.ruleEngine.evaluateRulesAndCreateOutboundTransactions();
      } catch (err) {
        if (err instanceof Error) {
          console.error(err.message);
        }
      }
      const txs = this.ruleEngine.getOutboundTransactions();
      await this.transactionsQueuer.queueTransactions(txs);
    } catch (ex) {
      if (ex instanceof Error) {
        this.logger.error(ex.message);
      }
    } finally {
      this.logger.info('Groot cycle ran successfully.');
      await this.logger.flush();
    }
  }

  public async sleepBetweenCycles(): Promise<void> {
    const sleepTime = this.configService.getSleepMillisecondsBetweenCycles();
    this.logger.debug(`Sleeping for ${sleepTime} seconds...`);
    await new Promise((resolve) => setTimeout(resolve, sleepTime));
  }
}
