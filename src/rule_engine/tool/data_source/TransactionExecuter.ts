import PostgreDataSourceBase from './PostgreDataSourceBase';

enum TransactionStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

enum TransactionUrgency {
    LOW = 'LOW',
    HIGH = 'HIGH',
}

interface Transaction {
    to: string;
    executor: string;
    txHash?: string;
    identifier: string;
    value: string;
    data: string;
    urgency?: TransactionUrgency;
    gasLimit: string;
    nonce?: number;
}

class TransactionExecuter extends PostgreDataSourceBase {
    async insertTransaction(transaction: Transaction) {
        const {
            to,
            executor,
            txHash,
            identifier,
            value,
            data,
            urgency = TransactionUrgency.LOW,
            gasLimit,
            nonce,
        } = transaction;

        const query = {
            text: `
        INSERT INTO "Transaction" (
          "to",
          "executor",
          "txHash",
          "identifier",
          "value",
          "data",
          "urgency",
          "gasLimit",
          "nonce"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
            values: [
                to,
                executor,
                txHash,
                identifier,
                value,
                data,
                urgency,
                gasLimit,
                nonce,
            ],
        };

        try {
            await this.executeQuery(query);
        } catch (error) {
            this.logger.error(`Failed to insert transaction: ${(error as Error).message}`);
            throw error;
        }
    }
}

export { TransactionExecuter, Transaction, TransactionStatus, TransactionUrgency };