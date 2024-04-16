import {OutboundTransaction} from '../../blockchain/OutboundTransaction';
import {ILogger} from '../../service/logger/interfaces/ILogger';
import {RuleConstructorInput, RuleParams} from '../TypesRule';
import {IBlockchainReader} from '../../blockchain/blockchain_reader/interfaces/IBlockchainReader';
import {IAbiRepo} from '../tool/abi_repository/interfaces/IAbiRepo';

export abstract class Rule {
  protected readonly logger: ILogger;
  protected readonly blockchainReader: IBlockchainReader;
  protected readonly abiRepo: IAbiRepo;

  protected ruleLabel: string;
  protected params: RuleParams;
  protected pendingTxQueue: OutboundTransaction[] = [];

  constructor(input: RuleConstructorInput) {
    this.logger = input.logger;
    this.blockchainReader = input.blockchainReader;
    this.abiRepo = input.abiRepo;
    this.ruleLabel = input.ruleLabel;
    this.params = input.params;
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
