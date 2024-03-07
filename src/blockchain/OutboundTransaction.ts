import {Transaction} from 'web3-types';
import {UrgencyLevel} from '../rule_engine/TypesRule';

export interface OutboundTransaction {
  urgencyLevel: UrgencyLevel;
  hash: string;
  lowLevelUnsignedTransaction: Transaction;
}
