import { OutboundTransaction } from '../../blockchain/OutboundTransaction';
import { ILogger } from '../../service/logger/interfaces/ILogger';
import { UrgencyLevel } from '../TypesRule';
import { IBlockchainReader } from '../../blockchain/blockchain_reader/interfaces/IBlockchainReader';
import { IAbiRepo } from '../tool/abi_repository/interfaces/IAbiRepo';
import { inject, injectable } from 'inversify';

export interface RuleParams {
  urgencyLevel: UrgencyLevel;
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
  protected params: RuleParams | unknown;
  protected pendingTxQueue: OutboundTransaction[] = [];

  constructor(
    logger: ILogger,
    blockchainReader: IBlockchainReader,
    abiRepo: IAbiRepo
  ) {
    this.logger = logger;
    this.blockchainReader = blockchainReader;
    this.abiRepo = abiRepo;
    this.ruleLabel = ""; // Default initialization
    this.params = { urgencyLevel: UrgencyLevel.NORMAL }; // Default initialization
  }


  public initialize(ruleLabel: string, params: RuleParams | unknown): void {
    this.ruleLabel = ruleLabel;
    this.params = params;
  }

  public abstract evaluate(): Promise<void>;

  protected abstract generateUniqueKey(): string;

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
