import {Transaction} from 'web3-types';
import {UrgencyLevel} from '../rules_engine/TypesRule';

export interface OutboundTransaction {
  urgencyLevel: UrgencyLevel;
  hash: string;
  lowLevelUnsignedTransaction: Transaction;
}
