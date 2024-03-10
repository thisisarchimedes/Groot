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
  protected pendingTxQueue: OutboundTransaction[] = [];

  constructor(logger: Logger, blockchainReader: BlockchainReader, params: RuleParams) {
    this.logger = logger;
    this.params = params;
    this.blockchainReader = blockchainReader;
  }

  abstract evaluate(): Promise<boolean>;

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
