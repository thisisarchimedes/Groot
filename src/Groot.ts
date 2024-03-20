import 'reflect-metadata';

import * as dotenv from 'dotenv';
import { injectable, inject } from 'inversify';

import { TxQueueAdapter } from '../test/unit/adapters/TxQueueAdapter';
import { FactoryRule } from './rule_engine/FactoryRule';
import { RuleEngine } from './rule_engine/RuleEngine';
import { LoggerAll } from './service/logger/LoggerAll';
import { TransactionQueuer } from './tx_queue/TransactionQueuer';
import { BlockchainReader } from './blockchain/blockchain_reader/BlockchainReader';
import { BlockchainNodeLocal } from './blockchain/blockchain_nodes/BlockchainNodeLocal';
import { HealthMonitor } from './service/health_monitor/HealthMonitor';
import { BlockchainNodeHealthMonitor } from './service/health_monitor/BlockchainNodeHealthMonitor';
import { SignalAWSCriticalFailure } from './service/health_monitor/signal/SignalAWSCriticalFailure';
import { SignalAWSHeartbeat } from './service/health_monitor/signal/SignalAWSHeartbeat';
import { HostNameProvider } from './service/health_monitor/HostNameProvider';
import { AbiRepo } from './rule_engine/tool/abi_repository/AbiRepo';
import { AbiStorageDynamoDB } from './rule_engine/tool/abi_repository/AbiStorageDynamoDB';
import { AbiFetcherEtherscan } from './rule_engine/tool/abi_repository/AbiFetcherEtherscan';
import { IConfigServiceAWS } from './service/config/interfaces/IConfigServiceAWS';
import { ILoggerAll } from './service/logger/interfaces/ILoggerAll';

dotenv.config();

@injectable()
export class Groot {
  private readonly logServiceName: string = 'Groot';
  private ruleEngine!: RuleEngine;
  private txQueuer!: TransactionQueuer;
  private healthMonitor!: HealthMonitor;

  private mainNode!: BlockchainNodeLocal;
  private altNode!: BlockchainNodeLocal;
  private blockchainReader!: BlockchainReader;

  private abiRepo!: AbiRepo;

  private readonly mainLocalNodePort: number;
  private readonly altLocalNodePort: number;

  constructor(
    @inject("IConfigServiceAWS") private configService: IConfigServiceAWS,
    @inject("ILoggerAll") private logger: ILoggerAll,
    mainLocalNodePort: number = 8545,
    altLocalNodePort: number = 18545
  ) {
    this.mainLocalNodePort = mainLocalNodePort;
    this.altLocalNodePort = altLocalNodePort;
  }

  public async initalizeGroot() {
    await this.configService.refreshConfig();
    this.logger = new LoggerAll(this.configService, this.logServiceName);

    this.logger.info('Initializing Groot...');

    await this.initalizeReadOnlyLocalNodes();

    this.initalizeHealthMonitor();

    this.initalizeAbiRepo();

    this.logger.info('Groot initialized successfully.');
  }

  private async initalizeReadOnlyLocalNodes() {
    this.mainNode = new BlockchainNodeLocal(this.logger, `http://localhost:${this.mainLocalNodePort}`, 'alchemy-node');
    this.altNode = new BlockchainNodeLocal(this.logger, `http://localhost:${this.altLocalNodePort}`, 'infura-node');

    await Promise.all([
      this.mainNode.startNode(),
      this.altNode.startNode(),
    ]);

    this.blockchainReader = new BlockchainReader(this.logger, [this.mainNode, this.altNode]);
  }

  private initalizeHealthMonitor() {
    if (!this.mainNode || !this.altNode) {
      throw new Error('Cannot initalize health monitor without nodes');
    }

    const blockchainHealthMonitor = new BlockchainNodeHealthMonitor(this.logger, [this.mainNode, this.altNode]);
    const hostNameProvider = new HostNameProvider(this.logger);
    const signalHeartbeat = new SignalAWSHeartbeat(this.logger, this.configService, hostNameProvider);
    const signalCriticalFailure = new SignalAWSCriticalFailure(this.logger, this.configService, hostNameProvider);
    this.healthMonitor = new HealthMonitor(
      this.logger,
      blockchainHealthMonitor,
      signalHeartbeat,
      signalCriticalFailure);
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
