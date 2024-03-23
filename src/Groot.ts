import 'reflect-metadata';

import * as dotenv from 'dotenv';
import { injectable, inject } from 'inversify';

import { TxQueueAdapter } from '../test/unit/adapters/TxQueueAdapter';
import { FactoryRule } from './rule_engine/FactoryRule';
import { RuleEngine } from './rule_engine/RuleEngine';
import { TransactionQueuer } from './tx_queue/TransactionQueuer';
import { HealthMonitor } from './service/health_monitor/HealthMonitor';
import { SignalAWSCriticalFailure } from './service/health_monitor/signal/SignalAWSCriticalFailure';
import { SignalAWSHeartbeat } from './service/health_monitor/signal/SignalAWSHeartbeat';
import { HostNameProvider } from './service/health_monitor/HostNameProvider';
import { AbiRepo } from './rule_engine/tool/abi_repository/AbiRepo';
import { AbiStorageDynamoDB } from './rule_engine/tool/abi_repository/AbiStorageDynamoDB';
import { AbiFetcherEtherscan } from './rule_engine/tool/abi_repository/AbiFetcherEtherscan';
import { IConfigServiceAWS } from './service/config/interfaces/IConfigServiceAWS';
import { ILoggerAll } from './service/logger/interfaces/ILoggerAll';
import { IBlockchainReader } from './blockchain/blockchain_reader/interfaces/IBlockchainReader';
import { IBlockchainNodeLocal } from './blockchain/blockchain_nodes/interfaces/IBlockchainNodeLocal';

dotenv.config();

@injectable()
export class Groot implements IGroot {
  private ruleEngine!: RuleEngine;
  private txQueuer!: TransactionQueuer;

  private abiRepo!: AbiRepo;

  private readonly logger: ILoggerAll;
  private readonly configService: IConfigServiceAWS
  private readonly blockchainReader: IBlockchainReader;
  private readonly mainNode: IBlockchainNodeLocal;
  private readonly altNode: IBlockchainNodeLocal;
  private readonly healthMonitor: IHealthMonitor;


  constructor(
    @inject("IConfigServiceAWS") _configService: IConfigServiceAWS,
    @inject("ILoggerAll") _logger: ILoggerAll,
    @inject("BlockchainNodeLocalMain") _mainLocalNode: IBlockchainNodeLocal,
    @inject("BlockchainNodeLocalAlt") _altLocalNode: IBlockchainNodeLocal,
    @inject("IBlockchainReader") _blockchainReader: IBlockchainReader,
    @inject("IHealthMonitor") _healthMonitor: IHealthMonitor,

  ) {
    this.logger = _logger;
    this.configService = _configService;
    this.mainNode = _mainLocalNode;
    this.altNode = _altLocalNode;
    this.blockchainReader = _blockchainReader;
    this.healthMonitor = _healthMonitor;
  }

  public async initalizeGroot() {
    await this.configService.refreshConfig();

    this.logger.info('Initializing Groot...');

    this.initalizeAbiRepo();

    this.logger.info('Groot initialized successfully.');
  }

  private initalizeAbiRepo() {
    if (!this.blockchainReader) {
      throw new Error('Cannot initalize abi repo without blockchain reader');
    }

    const abiStorage = new AbiStorageDynamoDB(
      this.configService.getDynamoDBAbiRepoTable(),
      this.configService.getAWSRegion());
    const abiFetcher = new AbiFetcherEtherscan(this.configService.getEtherscanAPIKey());
    this.abiRepo = new AbiRepo(this.blockchainReader, abiStorage, abiFetcher);
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
    this.logger.info('Preparing Groot for another cycle...');
    await this.healthMonitor.startOfCycleSequence();

    await this.configService.refreshConfig();
    await this.setLocalNodesToNewestBlock();
    this.resetRulesEngine();
    this.resetTransactionQueuer();

    this.healthMonitor.endOfCycleSequence();
    this.logger.info('Groot is ready for another cycle.');
  }

  private async setLocalNodesToNewestBlock() {
    await Promise.all([
      this.mainNode.resetNode(this.configService.getMainRPCURL()),
      this.altNode.resetNode(this.configService.getAlternativeRPCURL()),
    ]);
  }

  private resetRulesEngine() {
    const ruleFactory = new FactoryRule(this.logger, this.blockchainReader, this.abiRepo);
    this.ruleEngine = new RuleEngine(this.logger, ruleFactory);
  }

  private resetTransactionQueuer() {
    // TODO: Replace with actual queue implementaion
    const queue = new TxQueueAdapter();
    this.txQueuer = new TransactionQueuer(this.logger, queue);
  }

  public async runOneGrootCycle(): Promise<void> {
    this.logger.info('Running Groot cycle...');

    this.ruleEngine.loadRulesFromJSONConfig(this.configService.getRules());

    await this.ruleEngine.evaluateRulesAndCreateOutboundTransactions();
    const txs = this.ruleEngine.getOutboundTransactions();
    await this.txQueuer.queueTransactions(txs);

    this.logger.info('Groot cycle ran successfully.');
  }
}
