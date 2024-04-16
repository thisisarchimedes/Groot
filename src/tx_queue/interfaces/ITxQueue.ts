import {OutboundTransaction} from '../../blockchain/OutboundTransaction';

export interface ITxQueue {
  addTransactionToQueue(tx: OutboundTransaction): Promise<void>;
}
