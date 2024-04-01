import 'reflect-metadata';

import {Client, QueryConfig} from 'pg';
import {TYPES} from '../inversify.types';
import {inject, injectable} from 'inversify';
import {ITxQueue} from './interfaces/ITxQueue';
import {OutboundTransaction} from '../blockchain/OutboundTransaction';
import {UrgencyLevel} from '../rule_engine/TypesRule';

@injectable()
class PostgreTxQueue implements ITxQueue {
  private client: Client;

  constructor(@inject(TYPES.LeverageDBClient) client: Client) {
    this.client = client;
  }
  public async refresh(): Promise<void> {
    // await this.client.connect().catch(console.error);
  }

  public async addTransactionToQueue(tx: OutboundTransaction): Promise<void> {
    await this.client.connect().catch(console.error);

    const createdAt = new Date();
    const updatedAt = new Date();
    const status = 'PENDING';
    const to = tx.lowLevelUnsignedTransaction.to;
    const executor = ''; // You need to provide the executor
    const identifier = tx.postEvalUniqueKey;
    const value = tx.lowLevelUnsignedTransaction.value.toString();
    const data = tx.lowLevelUnsignedTransaction.data;
    const urgency = tx.urgencyLevel;
    await this.insertTransaction(createdAt, updatedAt, status, to, executor, '', identifier, value, data, urgency);
  }

  async insertTransaction(
      createdAt: Date,
      updatedAt: Date,
      status: string, // Assuming this is the correct representation for TransactionStatus
      to: string,
      executor: string,
      txHash: string,
      identifier: string,
      value: string,
      data: string,
      urgency: UrgencyLevel, // Assuming this translates correctly to TransactionUrgency
  ): Promise<void> {
    try {
      await this.client.query('BEGIN');
      // Specify your SQL command and the parameters array
      const queryConfig: QueryConfig = {
        text: 'CALL "Transactions".insert_transaction($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        values: [createdAt, updatedAt, status, to, executor, txHash, identifier, value, data, urgency],
      };

      await this.client.query(queryConfig);
      await this.client.query('COMMIT');
    } catch (err) {
      await this.client.query('ROLLBACK');
      throw err;
    }
  }
}

export default PostgreTxQueue;
