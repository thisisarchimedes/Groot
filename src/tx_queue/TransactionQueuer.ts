import 'reflect-metadata';

import { inject, injectable } from 'inversify';
import { OutboundTransaction } from '../blockchain/OutboundTransaction';
import { ILogger } from '../service/logger/interfaces/ILogger';
import { ITxQueue } from './interfaces/ITxQueue';
import { ITransactionQueuer } from './interfaces/ITransactionQueuer';
import { resolve } from 'path';

@injectable()
export class TransactionQueuer implements ITransactionQueuer {
  private readonly logger: ILogger;
  private readonly queue: ITxQueue;

  constructor(@inject('ILoggerAll') _logger: ILogger,
    @inject('PostgreTxQueue') _queue: ITxQueue) {
    this.logger = _logger;
    this.queue = _queue;
  }
  public async refresh(): Promise<void> {

  }

  public async queueTransactions(txs: OutboundTransaction[]): Promise<void> {
    for (const tx of txs) {
      if (this.isTxValid(tx) == false) {
        this.logger.error(`Invalid transaction: ${tx.context}`);
        continue;
      }
      this.logger.info(`Queuing transaction: ${tx.context}`);
      await this.queue.addTransactionToQueue(tx);
    }
  }

  private isTxValid(tx: OutboundTransaction): boolean {
    return tx.postEvalUniqueKey !== '';
  }
}
