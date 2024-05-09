import 'reflect-metadata';

import {OutboundTransaction} from '../blockchain/OutboundTransaction';
import {Logger} from '../service/logger/Logger';
import {ITxQueue} from './interfaces/ITxQueue';
import {ModulesParams} from '../types/ModulesParams';

export class TransactionQueuer {
  private readonly logger: Logger;
  private readonly queue: ITxQueue;

  constructor(
      modulesParams: ModulesParams,
      _queue: ITxQueue,
  ) {
    this.logger = modulesParams.logger!;
    this.queue = _queue;
  }

  public async queueTransactions(txs: OutboundTransaction[]): Promise<void> {
    for (const tx of txs) {
      if (this.isTxValid(tx) === false) {
        this.logger.error(`Invalid transaction: ${tx.context} [${tx.postEvalUniqueKey}]`);
        continue;
      }
      this.logger.info(`Queuing transaction: ${tx.context} [${tx.postEvalUniqueKey}]`);
      try {
        await this.queue.addTransactionToQueue(tx);
      } catch (err: unknown) {
        if ((err as Error).toString().includes('already exists and is within TTL')) {
          this.logger.info((err as Error).toString());
        } else {
          this.logger.error(JSON.stringify(err));
        }
      }
    }
  }

  private isTxValid(tx: OutboundTransaction): boolean {
    return tx.postEvalUniqueKey !== '';
  }
}
