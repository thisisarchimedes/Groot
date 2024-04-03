import {Executor, UrgencyLevel} from '../rule_engine/TypesRule';

export interface RawTransactionData {
  to: string;
  value: bigint;
  data: string;
}

export interface OutboundTransaction {
  urgencyLevel: UrgencyLevel;
  context: string;
  executor: Executor;
  postEvalUniqueKey: string;
  lowLevelUnsignedTransaction: RawTransactionData;
  ttlSeconds: number;
}
