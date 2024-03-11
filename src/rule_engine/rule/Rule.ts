import {OutboundTransaction} from '../../blockchain/OutboundTransaction';
import {BlockchainReader} from '../../blockchain/blockchain_reader/BlockchainReader';
import {Logger} from '../../service/logger/Logger';
import {UrgencyLevel} from '../TypesRule';

export interface RuleParams {
  urgencyLevel: UrgencyLevel;
}

export abstract class Rule {
  protected logger: Logger;
  protected blockchainReader: BlockchainReader;

  protected params: RuleParams;
  protected readonly ruleLabel: string;
  protected pendingTxQueue: OutboundTransaction[] = [];

  constructor(
      logger: Logger,
      blockchainReader: BlockchainReader,
      ruleLabel: string,
      params: RuleParams,
  ) {
    this.logger = logger;
    this.params = params;
    this.ruleLabel = ruleLabel;
    this.blockchainReader = blockchainReader;
  }

  abstract evaluate(): Promise<void>;

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
