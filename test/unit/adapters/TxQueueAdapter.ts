import {OutboundTransaction} from '../../../src/blockchain/OutboundTransaction';
import {ITxQueue} from '../../../src/tx_queue/interfaces/ITxQueue';

export class TxQueueAdapter implements ITxQueue {
  refresh(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  private transactions: OutboundTransaction[] = [];

  public addTransactionToQueue(tx: OutboundTransaction):Promise<void> {
    this.transactions.push(tx);
    return Promise.resolve();
  }

  public getTransactions(): OutboundTransaction[] {
    return this.transactions;
  }
}
