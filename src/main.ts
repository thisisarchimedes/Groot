import * as dotenv from 'dotenv';

import {TxQueueAdapter} from '../test/unit/adapters/TxQueueAdapter';
import {FactoryRule} from './rule_engine/FactoryRule';
import {RuleEngine} from './rule_engine/RuleEngine';
import {ConfigServiceAWS} from './service/config/ConfigServiceAWS';
import {LoggerAll} from './service/logger/LoggerAll';
import {TransactionQueuer} from './tx_queue/TransactionQueuer';
import {BlockchainReader} from './blockchain/blockchain_reader/BlockchainReader';
import {BlockchainNodeLocalHardhat} from './blockchain/blockchain_nodes/BlockchainNodeLocalHardhat';

dotenv.config();

export class Groot {
  private readonly logServiceName: string = 'Groot';
  private readonly configService: ConfigServiceAWS;

  private logger!: LoggerAll;
  private ruleEngine!: RuleEngine;
  private txQueuer!: TransactionQueuer;

  private mainNode!: BlockchainNodeLocalHardhat;
  private altNode!: BlockchainNodeLocalHardhat;
  private blockchainReader!: BlockchainReader;
  private nextAvailablePortNumber: number;

  constructor(environment: string, region: string) {
    this.configService = new ConfigServiceAWS(environment, region);
    this.nextAvailablePortNumber = 8545;
  }

  public async initalizeGroot() {
    await this.configService.refreshConfig();
    this.logger = new LoggerAll(this.configService, this.logServiceName);

    this.logger.info('Initializing Groot...');

    await this.initalizeReadOnlyLocalNodes();

    this.logger.info('Groot initialized successfully.');
  }

  private async initalizeReadOnlyLocalNodes() {
    this.mainNode = new BlockchainNodeLocalHardhat(this.logger, this.nextAvailablePortNumber++, 'alchemy-node');
    this.altNode = new BlockchainNodeLocalHardhat(this.logger, this.nextAvailablePortNumber++, 'infura-node');

    await Promise.all([
      this.mainNode.startNode(),
      this.altNode.startNode(),
    ]);

    this.blockchainReader = new BlockchainReader(this.logger, [this.mainNode, this.altNode]);
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

    await this.configService.refreshConfig();

    await this.setLocalNodesToNewestBlock();

    this.resetRulesEngine();

    this.resetTransactionQueuer();

    this.logger.info('Groot is ready for another cycle.');
  }

  private async setLocalNodesToNewestBlock() {
    await Promise.all([
      this.mainNode.resetNode(this.configService.getMainRPCURL()),
      this.altNode.resetNode(this.configService.getAlternativeRPCURL()),
    ]);
  }

  private resetRulesEngine() {
    const ruleFactory = new FactoryRule(this.logger, this.blockchainReader);
    this.ruleEngine = new RuleEngine(this.logger, ruleFactory);
  }

  private resetTransactionQueuer() {
    // TODO: Replace with actual queue implementaion
    const queue = new TxQueueAdapter();
    this.txQueuer = new TransactionQueuer(this.logger, queue);
  }

  public async runGrootCycle(): Promise<void> {
    this.logger.info('Running Groot...');

    this.ruleEngine.loadRulesFromJSONConfig(this.configService.getRules());

    await this.ruleEngine.evaluateRulesAndCreateOutboundTransactions();
    const txs = this.ruleEngine.getOutboundTransactions();
    await this.txQueuer.queueTransactions(txs);

    this.logger.info('Groot cycle ran successfully.');
  }
}

export async function grootStartHere(runInfinite: boolean = true): Promise<void> {
  const environment = process.env.ENVIRONMENT as string;
  const region = process.env.AWS_REGION as string;

  console.log(`Starting Groot in ${environment} environment and ${region} region`);

  const groot = new Groot(environment, region);
  await groot.initalizeGroot();

  do {
    await groot.prepareForAnotherCycle();
    await groot.runGrootCycle();
  } while (runInfinite);

  await groot.shutdownGroot();
}
