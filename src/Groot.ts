import 'reflect-metadata';

import * as dotenv from 'dotenv';
import { injectable, inject } from 'inversify';

import { TransactionQueuer } from './tx_queue/TransactionQueuer';
import { IBlockchainNodeLocal } from './blockchain/blockchain_nodes/interfaces/IBlockchainNodeLocal';
import { IRuleEngine } from './rule_engine/interfaces/IRuleEngine';
import { IGroot } from './interfaces/IGroot';
import { IHealthMonitor } from './service/health_monitor/signal/interfaces/IHealthMonitor';
import { IConfigService } from './service/config/interfaces/IConfigService';
import { ILogger } from './service/logger/interfaces/ILogger';
import { ITxQueue } from './tx_queue/interfaces/ITxQueue';
import { ITransactionQueuer } from './tx_queue/interfaces/ITransactionQueuer';

dotenv.config();

@injectable()
export class Groot implements IGroot {
  private txQueuer!: TransactionQueuer;

  public readonly logger: ILogger;
  private readonly configService: IConfigService;
  private readonly mainNode: IBlockchainNodeLocal;
  private readonly altNode: IBlockchainNodeLocal;
  private readonly healthMonitor: IHealthMonitor;
  private ruleEngine!: IRuleEngine;
  private transactionsQueuer: ITransactionQueuer;

  constructor(
    @inject('IConfigServiceAWS') _configService: IConfigService,
    @inject('ILoggerAll') _logger: ILogger,
    @inject('BlockchainNodeLocalMain') _mainLocalNode: IBlockchainNodeLocal,
    @inject('BlockchainNodeLocalAlt') _altLocalNode: IBlockchainNodeLocal,
    @inject('IHealthMonitor') _healthMonitor: IHealthMonitor,
    @inject('IRuleEngine') _ruleEngine: IRuleEngine,
    @inject('ITransactionQueuer') _transactionsQueuer: ITransactionQueuer,
  ) {
    this.logger = _logger;
    this.configService = _configService;
    this.mainNode = _mainLocalNode;
    this.altNode = _altLocalNode;
    this.healthMonitor = _healthMonitor;
    this.ruleEngine = _ruleEngine;
    this.transactionsQueuer = _transactionsQueuer;
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
    await this.resetTransactionQueuer();

    this.healthMonitor.endOfCycleSequence();
    this.logger.info('Groot is ready for cycle.');
  }

  private async setLocalNodesToNewestBlock() {
    await Promise.all([
      this.mainNode.resetNode(this.configService.getMainRPCURL()),
      this.altNode.resetNode(this.configService.getAlternativeRPCURL()),
    ]);
  }

  private async resetTransactionQueuer() {
    await this.transactionsQueuer.refresh();
  }

  public async runOneGrootCycle(): Promise<void> {
    this.logger.info('Running Groot cycle...');

    try {
      this.ruleEngine.loadRulesFromJSONConfig(this.configService.getRules());

      await this.ruleEngine.evaluateRulesAndCreateOutboundTransactions();
      const txs = this.ruleEngine.getOutboundTransactions();
      await this.txQueuer.queueTransactions(txs);
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
