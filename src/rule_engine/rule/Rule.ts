import {OutboundTransaction} from '../../blockchain/OutboundTransaction';
import {BlockchainReader} from '../../blockchain/blockchain_reader/BlockchainReader';
import {Logger} from '../../service/logger/Logger';
import {UrgencyLevel} from '../TypesRule';
import {AbiRepo} from '../tool/abi_repository/AbiRepo';

export interface RuleParams {
  urgencyLevel: UrgencyLevel;
}

export interface RuleConstractorInput {
  logger: Logger;
  blockchainReader: BlockchainReader;
  abiRepo: AbiRepo
  ruleLabel: string;
  params: RuleParams;

}

export abstract class Rule {
  protected logger: Logger;
  protected blockchainReader: BlockchainReader;
  protected abiRepo: AbiRepo;

  protected params: RuleParams;
  protected readonly ruleLabel: string;
  protected pendingTxQueue: OutboundTransaction[] = [];

  constructor(constractorInput: RuleConstractorInput) {
    this.logger = constractorInput.logger;
    this.params = constractorInput.params;
    this.abiRepo = constractorInput.abiRepo;
    this.ruleLabel = constractorInput.ruleLabel;
    this.blockchainReader = constractorInput.blockchainReader;
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
