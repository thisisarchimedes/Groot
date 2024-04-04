import {OutboundTransaction} from '../../blockchain/OutboundTransaction';
import {ILogger} from '../../service/logger/interfaces/ILogger';
import {Executor, UrgencyLevel} from '../TypesRule';
import {IBlockchainReader} from '../../blockchain/blockchain_reader/interfaces/IBlockchainReader';
import {IAbiRepo} from '../tool/abi_repository/interfaces/IAbiRepo';
import {injectable} from 'inversify';

export interface RuleParams {
  urgencyLevel: UrgencyLevel;
  ttlSeconds: number;
  executor: Executor;
}

export interface RuleConstructorInput {
  logger: ILogger;
  blockchainReader: IBlockchainReader;
  abiRepo: IAbiRepo
  ruleLabel: string;
  params: RuleParams;

}

@injectable()
export abstract class Rule {
  protected readonly logger: ILogger;
  protected readonly blockchainReader: IBlockchainReader;
  protected readonly abiRepo: IAbiRepo;

  protected ruleLabel: string;
  protected params: RuleParams;
  protected pendingTxQueue: OutboundTransaction[] = [];

  constructor(
      logger: ILogger,
      blockchainReader: IBlockchainReader,
      abiRepo: IAbiRepo,
  ) {
    this.logger = logger;
    this.blockchainReader = blockchainReader;
    this.abiRepo = abiRepo;
    this.ruleLabel = ''; // Default initialization
    this.params = {
      urgencyLevel: UrgencyLevel.LOW,
      executor: Executor.LEVERAGE,
      ttlSeconds: 300,
    }; // Default initialization
  }


  public async initialize(ruleLabel: string, params: RuleParams): Promise<void> {
    this.ruleLabel = ruleLabel;
    this.params = params;
    return await Promise.resolve();
  }

  public abstract evaluate(): Promise<void>;

  protected abstract generateUniqueKey<T extends unknown[]>(...args: T): string;

  public getRuleLabel(): string {
    return this.ruleLabel;
  }

  public getPendingTransactionCount(): number {
    return this.pendingTxQueue.length;
  }

  public popTransactionFromRuleLocalQueue(): OutboundTransaction | undefined {
    return this.pendingTxQueue.shift();
  }

  protected pushTransactionToRuleLocalQueue(transaction: OutboundTransaction): void {
    this.pendingTxQueue.push(transaction);
  }
}
