import {TransactionRequest} from '@ethersproject/abstract-provider';
import {UrgencyLevel} from '../rule_engine/TypesRule';

export interface OutboundTransaction {
  urgencyLevel: UrgencyLevel;
  context: string;
  postEvalUniqueKey: string;
  lowLevelUnsignedTransaction: TransactionRequest;
}
