import 'reflect-metadata';

import * as dotenv from 'dotenv';
import {IGroot} from './interfaces/IGroot';
import {ILogger} from './service/logger/interfaces/ILogger';
import {ITransactionQueuer} from './tx_queue/interfaces/ITransactionQueuer';
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

dotenv.config();

export class Groot implements IGroot {
  public logger: ILogger;
  private configService: ConfigServiceAWS;
  private mainNode: BlockchainNodeLocal;
  private altNode: BlockchainNodeLocal;
  private signalHeartbeat: SignalAWSHeartbeat;
  private hostnameProvider: HostNameProvider;
  private signalCriticalFailure: SignalAWSCriticalFailure;
  private blockchainNodeHealthMonitor: BlockchainNodeHealthMonitor;
  private healthMonitor: HealthMonitor;
  private ruleEngine: RuleEngine;
  private transactionsQueuer: ITransactionQueuer;

  constructor(
      _configService: ConfigServiceAWS,
      _logger: ILogger,
      _dbService: DBService,
  ) {
    this.logger = _logger;
    this.configService = _configService;
    this.mainNode = new BlockchainNodeLocal(
        _logger,
        `http://localhost:${process.env.MAIN_LOCAL_NODE_PORT || 8545}`,
        'AlchemyNodeLabel',
    );
    this.altNode = new BlockchainNodeLocal(
        _logger,
        `http://localhost:${process.env.ALT_LOCAL_NODE_PORT || 18545}`,
        'InfuraNodeLabel',
    );
    this.blockchainNodeHealthMonitor = new BlockchainNodeHealthMonitor(
        _logger,
        this.mainNode,
        this.altNode,
    );
    this.hostnameProvider = new HostNameProvider(_logger);
    this.signalCriticalFailure = new SignalAWSCriticalFailure(
        _configService,
        _logger,
        this.hostnameProvider,
        namespace,
    );
    this.signalHeartbeat = new SignalAWSHeartbeat(
        _configService,
        _logger,
        this.hostnameProvider,
        namespace,
    );
    this.healthMonitor = new HealthMonitor(
        _logger,
        this.blockchainNodeHealthMonitor,
        this.signalHeartbeat,
        this.signalCriticalFailure,
    );
    this.ruleEngine = new RuleEngine(_logger, this.configService, this.mainNode, this.altNode);

    const txQueue = new PostgreTxQueue(_logger, _dbService);
    this.transactionsQueuer = new TransactionQueuer(_logger, txQueue);
  }

  public async initalizeGroot() {
    this.logger.info('Initializing Groot...');
    await this.configService.refreshConfig();
    this.logger.info('Groot initialized successfully.');
  }

  public async shutdownGroot() {
    this.logger.warn('Shutting down Groot...');

    await this.shutdownReadOnlyLocalNodes();

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
          console.log(err.message);
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
