import 'reflect-metadata';

import {QueryConfig} from 'pg';
import {ITxQueue} from './interfaces/ITxQueue';
import {OutboundTransaction} from '../blockchain/OutboundTransaction';
import {Executor, UrgencyLevel} from '../rule_engine/TypesRule';
import {ILogger} from '../service/logger/interfaces/ILogger';
import DBService from '../service/db/dbService';


class PostgreTxQueue implements ITxQueue {
  private dbService: DBService;
  private logger: ILogger;

  constructor(
      logger: ILogger,
      dbService: DBService,
  ) {
    this.dbService = dbService;
    this.logger = logger;
  }

  public async addTransactionToQueue(tx: OutboundTransaction): Promise<void> {
    const createdAt = new Date();
    const updatedAt = new Date();
    const status = 'PENDING';
    const to = tx.lowLevelUnsignedTransaction.to;
    const executor = tx.executor;
    const identifier = tx.postEvalUniqueKey;
    const value = tx.lowLevelUnsignedTransaction.value.toString();
    const data = tx.lowLevelUnsignedTransaction.data;
    const urgency = tx.urgencyLevel;
    const ttlSeconds = tx.ttlSeconds;
    await this.insertTransaction(createdAt, updatedAt, status, to, executor,
        '', identifier, value, data, urgency, ttlSeconds);
  }

  async insertTransaction(
      createdAt: Date,
      updatedAt: Date,
      status: string,
      to: string,
      executor: Executor,
      txHash: string,
      identifier: string,
      value: string,
      data: string,
      urgency: UrgencyLevel,
      ttlSeconds: number,
  ): Promise<void> {
    try {
      await this.dbService.getTransactionsClient().query('BEGIN');
      const queryConfig: QueryConfig = {
        text: 'CALL "Transactions".insert_transaction($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
        values: [createdAt, updatedAt, status, to, executor, txHash, identifier, value, data, urgency, ttlSeconds],
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
