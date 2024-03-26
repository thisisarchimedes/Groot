import 'reflect-metadata';

import { Client } from 'pg';
import { TYPES } from '../inversify.types';
import { inject, injectable } from 'inversify';
import { ITxQueue } from './interfaces/ITxQueue';
import { OutboundTransaction } from '../blockchain/OutboundTransaction';

@injectable()
class PostgreTxQueue implements ITxQueue {
    private client: Client;

    constructor(@inject(TYPES.PGClient) client: Client) {
        this.client = client;

        // Immediately connect to the database
        this.client.connect().catch(console.error);
    }
    public async refresh(): Promise<void> {
        //flush records
    }

    public async addTransactionToQueue(tx: OutboundTransaction): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async insertTransaction(
        createdAt: Date,
        updatedAt: Date,
        status: string,
        to: string,
        executor: string,
        txHash: string | null,
        identifier: string,
        value: string,
        data: string,
        urgency: string,
        gasLimit: string,
        nonce: number | null,
    ): Promise<void> {
        try {
            await this.client.query('BEGIN');
            const queryText = `CALL insert_transaction($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`;
            const queryValues: (string | number | Date | null)[] = [createdAt, updatedAt, status, to, executor, txHash, identifier, value, data, urgency, gasLimit, nonce];
            // await this.client.query(queryText, queryValues);
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
