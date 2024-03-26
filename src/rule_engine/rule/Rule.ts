import {OutboundTransaction} from '../../blockchain/OutboundTransaction';
import {ILogger} from '../../service/logger/interfaces/ILogger';
import {UrgencyLevel} from '../TypesRule';
import {IBlockchainReader} from '../../blockchain/blockchain_reader/interfaces/IBlockchainReader';
import {IAbiRepo} from '../tool/abi_repository/interfaces/IAbiRepo';

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

export abstract class Rule {
  protected logger: ILogger;
  protected blockchainReader: IBlockchainReader;
  protected abiRepo: IAbiRepo;

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
