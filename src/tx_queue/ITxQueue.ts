import {OutboundTransaction} from '../blockchain/OutboundTransaction';

export interface ITxQueue {
   add(tx: OutboundTransaction): void;
}
