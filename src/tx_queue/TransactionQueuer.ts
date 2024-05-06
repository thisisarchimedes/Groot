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
      await this.queue.addTransactionToQueue(tx);
    }
  }

  private isTxValid(tx: OutboundTransaction): boolean {
    return tx.postEvalUniqueKey !== '';
  }
}
