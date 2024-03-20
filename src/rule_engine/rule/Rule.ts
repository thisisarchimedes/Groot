import { OutboundTransaction } from '../../blockchain/OutboundTransaction';
import { BlockchainReader } from '../../blockchain/blockchain_reader/BlockchainReader';
import { ILogger } from '../../service/logger/ILogger';
import { Logger } from '../../service/logger/Logger';
import { UrgencyLevel } from '../TypesRule';
import { AbiRepo } from '../tool/abi_repository/AbiRepo';

export interface RuleParams {
  urgencyLevel: UrgencyLevel;
}

export interface RuleConstructorInput {
  logger: ILogger;
  blockchainReader: BlockchainReader;
  abiRepo: AbiRepo
  ruleLabel: string;
  params: RuleParams;

}

export abstract class Rule {
  protected logger: ILogger;
  protected blockchainReader: BlockchainReader;
  protected abiRepo: AbiRepo;

  protected params: RuleParams;
  protected readonly ruleLabel: string;
  protected pendingTxQueue: OutboundTransaction[] = [];

  constructor(constructorInput: RuleConstructorInput) {
    this.logger = constructorInput.logger;
    this.params = constructorInput.params;
    this.abiRepo = constructorInput.abiRepo;
    this.ruleLabel = constructorInput.ruleLabel;
    this.blockchainReader = constructorInput.blockchainReader;
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
