import {OutboundTransaction} from '../blockchain/OutboundTransaction';
import {Logger} from '../service/logger/Logger';
import {ITxQueue} from './ITxQueue';

export class TransactionQueuer {
  private readonly logger: Logger;
  private readonly queue: ITxQueue;

  constructor(logger: Logger, queue: ITxQueue) {
    this.logger = logger;
    this.queue = queue;
  }

  public async queueTransactions(txs: OutboundTransaction[]): Promise<void> {
    for (const tx of txs) {
      if (this.isTxValid(tx) == false) {
        this.logger.error(`Invalid transaction: ${tx.context}`);
        continue;
      }
      this.logger.info(`Queuing transaction: ${tx.context}`);
      await this.queue.add(tx);
    }
  }

  private isTxValid(tx: OutboundTransaction): boolean {
    return tx.hash !== '';
  }
}
