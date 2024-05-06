import 'reflect-metadata';

import {QueryConfig} from 'pg';
import {ITxQueue} from './interfaces/ITxQueue';
import {OutboundTransaction} from '../blockchain/OutboundTransaction';
import {Executor, UrgencyLevel} from '../rule_engine/TypesRule';
import {Logger} from '../service/logger/Logger';
import DBService from '../service/db/dbService';
import {ModulesParams} from '../types/ModulesParams';


class PostgreTxQueue implements ITxQueue {
  private dbService: DBService;
  private logger: Logger;

  constructor(
      modulesParams: ModulesParams,
  ) {
    this.dbService = modulesParams.dbService!;
    this.logger = modulesParams.logger!;
  }

  public async addTransactionToQueue(tx: OutboundTransaction): Promise<void> {
    const to = tx.lowLevelUnsignedTransaction.to;
    const executor = tx.executor;
    const context = tx.context;
    const identifier = tx.postEvalUniqueKey;
    const value = tx.lowLevelUnsignedTransaction.value;
    const data = tx.lowLevelUnsignedTransaction.data;
    const urgency = tx.urgencyLevel;
    const ttlSeconds = tx.ttlSeconds;
    await this.insertTransaction(to, executor, context,
        '', identifier, value, data, urgency, ttlSeconds);
  }

  async insertTransaction(
      to: string,
      executor: Executor,
      context: string,
      txHash: string,
      identifier: string,
      value: bigint,
      data: string,
      urgency: UrgencyLevel,
      ttlSeconds: number,
  ): Promise<void> {
    try {
      await this.dbService.getTransactionsClient().query('BEGIN');
      const queryConfig: QueryConfig = {
        text: 'CALL insert_transaction($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        values: [to, executor, context, txHash, identifier, value, data, urgency, ttlSeconds],
      };

      await this.dbService.getTransactionsClient().query(queryConfig);
      await this.dbService.getTransactionsClient().query('COMMIT');
    } catch (err) {
      await this.dbService.getTransactionsClient().query('ROLLBACK');
      throw err;
    }
  }
}

export default PostgreTxQueue;
