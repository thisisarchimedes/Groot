import 'reflect-metadata';

import * as dotenv from 'dotenv';
import { injectable, inject } from 'inversify';

import { TxQueueAdapter } from '../test/unit/adapters/TxQueueAdapter';
import { TransactionQueuer } from './tx_queue/TransactionQueuer';
import { IConfigServiceAWS } from './service/config/interfaces/IConfigServiceAWS';
import { ILoggerAll } from './service/logger/interfaces/ILoggerAll';
import { IBlockchainNodeLocal } from './blockchain/blockchain_nodes/interfaces/IBlockchainNodeLocal';
import { IRuleEngine } from './rule_engine/interfaces/IRuleEngine';
import { IGroot } from './interfaces/IGroot';
import { IHealthMonitor } from './service/health_monitor/signal/interfaces/IHealthMonitor';

dotenv.config();

@injectable()
export class Groot implements IGroot {
  private txQueuer!: TransactionQueuer;

  public readonly logger: ILoggerAll;
  private readonly configService: IConfigServiceAWS;
  private readonly mainNode: IBlockchainNodeLocal;
  private readonly altNode: IBlockchainNodeLocal;
  private readonly healthMonitor: IHealthMonitor;
  private ruleEngine!: IRuleEngine;

  constructor(
    @inject('IConfigServiceAWS') _configService: IConfigServiceAWS,
    @inject('ILoggerAll') _logger: ILoggerAll,
    @inject('BlockchainNodeLocalMain') _mainLocalNode: IBlockchainNodeLocal,
    @inject('BlockchainNodeLocalAlt') _altLocalNode: IBlockchainNodeLocal,
    @inject('IHealthMonitor') _healthMonitor: IHealthMonitor,
    @inject('IRuleEngine') _ruleEngine: IRuleEngine,
  ) {
    this.logger = _logger;
    this.configService = _configService;
    this.mainNode = _mainLocalNode;
    this.altNode = _altLocalNode;
    this.healthMonitor = _healthMonitor;
    this.ruleEngine = _ruleEngine;
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
    this.resetTransactionQueuer();

    this.healthMonitor.endOfCycleSequence();
    this.logger.info('Groot is ready for cycle.');
  }

  private async setLocalNodesToNewestBlock() {
    await Promise.all([
      this.mainNode.resetNode(this.configService.getMainRPCURL()),
      this.altNode.resetNode(this.configService.getAlternativeRPCURL()),
    ]);
  }

  private resetTransactionQueuer() {
    // TODO: Replace with actual queue implementaion
    const queue = new TxQueueAdapter();
    this.txQueuer = new TransactionQueuer(this.logger, queue);
  }

  public async runOneGrootCycle(): Promise<void> {
    this.logger.info('Running Groot cycle...');

    try {
      this.ruleEngine.loadRulesFromJSONConfig(this.configService.getRules());

      await this.ruleEngine.evaluateRulesAndCreateOutboundTransactions();
      const txs = this.ruleEngine.getOutboundTransactions();
      await this.txQueuer.queueTransactions(txs);
    } catch (ex) {
      console.log('error '); // FIX
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
