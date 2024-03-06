import {Transaction} from 'web3-types';
import {UrgencyLevel} from '../rules_engine/RuleTypes';

export interface OutboundTransaction {
  urgencyLevel: UrgencyLevel;
  hash: string;
  lowLevelUnsignedTransaction: Transaction;
}
