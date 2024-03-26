import {OutboundTransaction} from '../../../src/blockchain/OutboundTransaction';
import {ITxQueue} from '../../../src/tx_queue/ITxQueue';
import {injectable} from 'inversify';

@injectable()
export class TxQueueAdapter implements ITxQueue {
  private transactions: OutboundTransaction[] = [];

  public addTransactionToQueue(tx: OutboundTransaction): void {
    this.transactions.push(tx);
  }

  public getTransactions(): OutboundTransaction[] {
    return this.transactions;
  }
}
