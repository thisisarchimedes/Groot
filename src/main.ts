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
    this.logger = new LoggerAll(this.configService, 'Groot');

    this.logger.info('Initializing Groot...');

    this.mainNode = new BlockchainNodeLocalHardhat(this.logger, this.nextAvailablePortNumber++, 'alchemy-node');
    this.altNode = new BlockchainNodeLocalHardhat(this.logger, this.nextAvailablePortNumber++, 'infura-node');

    await Promise.all([
      this.mainNode.startNode(),
      this.altNode.startNode(),
    ]);

    this.blockchainReader = new BlockchainReader(this.logger, [this.mainNode, this.altNode]);

    this.logger.info('Groot initialized successfully.');
  }

  public async shutdownGroot() {
    this.logger.warn('Shutting down Groot...');

    await Promise.all([
      this.mainNode.stopNode(),
      this.altNode.stopNode(),
    ]);

    this.logger.warn('Groot shutdown successfully.');
  }

  public async prepareForAnotherCycle() {
    this.logger.info('Preparing Groot for another cycle...');

    await this.configService.refreshConfig();

    // get latest block number
    await Promise.all([
      this.mainNode.resetNode(this.configService.getMainRPCURL()),
      this.altNode.resetNode(this.configService.getAlternativeRPCURL()),
    ]);

    const ruleFactory = new FactoryRule(this.logger, this.blockchainReader);
    this.ruleEngine = new RuleEngine(this.logger, ruleFactory);

    // TODO: Replace with actual queue implementaion
    const queue = new TxQueueAdapter();
    this.txQueuer = new TransactionQueuer(this.logger, queue);

    this.logger.info('Groot is ready for another cycle.');
  }

  public async runGroot(): Promise<void> {
    await this.prepareForAnotherCycle();

    this.logger.info('Running Groot...');

    this.ruleEngine.loadRulesFromJSONConfig(this.configService.getRules());

    await this.ruleEngine.evaluateRulesAndCreateOutboundTransactions();
    const txs = this.ruleEngine.getOutboundTransactions();
    await this.txQueuer.queueTransactions(txs);

    this.logger.info('Groot cycle ran successfully.');
  }
}

export async function startGroot(runInfinite: boolean = true): Promise<void> {
  const environment = process.env.ENVIRONMENT as string;
  const region = process.env.AWS_REGION as string;

  console.log(`Starting Groot in ${environment} environment and ${region} region`);

  const groot = new Groot(environment, region);
  await groot.initalizeGroot();

  do {
    await groot.runGroot();
  } while (runInfinite);

  await groot.shutdownGroot();
}
