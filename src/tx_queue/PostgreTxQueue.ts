import 'reflect-metadata';

import { Client } from 'pg';
import { TYPES } from '../inversify.types';
import { inject, injectable } from 'inversify';
import { ITxQueue } from './interfaces/ITxQueue';
import { OutboundTransaction } from '../blockchain/OutboundTransaction';
import { UrgencyLevel } from '../rule_engine/TypesRule';

@injectable()
class PostgreTxQueue implements ITxQueue {
  private client: Client;

  constructor(@inject(TYPES.TransactionsDBClient) client: Client) {
    this.client = client;
  }
  public async refresh(): Promise<void> {
    // await this.client.connect().catch(console.error);
  }

  public async addTransactionToQueue(tx: OutboundTransaction): Promise<void> {
    const createdAt = new Date();
    const updatedAt = new Date();
    const status = 'PENDING';
    const to = tx.lowLevelUnsignedTransaction.to;
    const executor = ''; // You need to provide the executor
    const identifier = tx.postEvalUniqueKey;
    const value = tx.lowLevelUnsignedTransaction.value.toString();
    const data = tx.lowLevelUnsignedTransaction.data;
    const urgency = tx.urgencyLevel;

    await this.insertTransaction(createdAt, updatedAt, status, to, executor, identifier, value, data, urgency);
  }

  async insertTransaction(
    createdAt: Date,
    updatedAt: Date,
    status: string,
    to: string,
    executor: string,
    identifier: string,
    value: string,
    data: string,
    urgency: UrgencyLevel,
  ): Promise<void> {
    try {
      await this.client.connect().catch(console.error)
      await this.client.query('BEGIN');
      const queryText = `CALL insert_transaction($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
      const queryValues: unknown[] = [createdAt, updatedAt, status, to, executor, identifier, value, data, urgency];
      await this.client.query(queryText, queryValues);
      await this.client.query('COMMIT');
    } catch (err) {
      await this.client.query('ROLLBACK');
      throw err;
    }
  }

  // Method to close the database connection
  async closeConnection(): Promise<void> {
    await this.client.end();
  }
}

export default PostgreTxQueue;
