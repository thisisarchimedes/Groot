import { expect } from 'chai';

import { TYPES } from '../../src/inversify.types';
import { ITxQueue } from '../../src/tx_queue/interfaces/ITxQueue';
import { OutboundTransaction } from '../../src/blockchain/OutboundTransaction';
import { InversifyConfig } from '../../src/inversify.config';
import { ConfigServiceAWS } from '../../src/service/config/ConfigServiceAWS';
import { Client } from 'pg';
import { Executor, UrgencyLevel } from '../../src/rule_engine/TypesRule';

describe('Transaction Insertion Tests', function () {
    let txQueue: ITxQueue;
    let dbClient: Client;

    beforeEach(async () => {
        const configService = new ConfigServiceAWS('DemoApp', 'us-east-1');
        await configService.refreshConfig();

        const inversifyConfig = new InversifyConfig(configService);
        const container = inversifyConfig.getContainer();
        txQueue = container.get<ITxQueue>(TYPES.PostgreTxQueue);
        dbClient = container.get<Client>(TYPES.TransactionsDBClient);
        await dbClient.connect();
    });

    this.afterAll(async () => {
        await dbClient.query('DELETE FROM "Transactions"."Transaction" WHERE "identifier" LIKE $1', ['test_%']);
        await dbClient.end();
    });

    afterEach(async () => {
        // Cleanup: Delete test transactions
        await dbClient.query('DELETE FROM "Transactions"."Transaction" WHERE "identifier" LIKE $1', ['test_%']);
    });
    it('Inserting a New Transaction', async () => {
        const testTransaction = {
            lowLevelUnsignedTransaction: {
                to: '0xTEST',
                value: BigInt('0'),
                data: '0xTEST',
            },
            executor: Executor.LEVERAGE,
            postEvalUniqueKey: 'test_uniqueIdentifier1',
            urgencyLevel: UrgencyLevel.LOW,
            ttlSeconds: 300, // 5 minutes
            context: ''
        } as OutboundTransaction;

        let errorOccurred = false;
        try {
            await txQueue.addTransactionToQueue(testTransaction);
        } catch (error) {
            errorOccurred = true;
        }
        expect(errorOccurred).to.be.false;

        // // Verify insertion
        const result = await dbClient.query('SELECT * FROM "Transactions"."Transaction" WHERE identifier = $1', ['test_uniqueIdentifier1']);
        expect(result.rows.length).to.equal(1);
        expect(result.rows[0].identifier).to.equal('test_uniqueIdentifier1');
    });

    it('Attempting to Insert a Duplicate Transaction Within TTL', async () => {
        // Insert a transaction that will be considered within TTL
        const duplicateTransaction = {
            lowLevelUnsignedTransaction: {
                to: '0xTEST',
                value: BigInt('0'), // converted to bigint
                data: '0xTEST',
            },
            executor: Executor.LEVERAGE,
            postEvalUniqueKey: 'test_uniqueIdentifier2',
            urgencyLevel: UrgencyLevel.LOW,
            ttlSeconds: 300, // 5 minutes
        } as OutboundTransaction;

        await txQueue.addTransactionToQueue(duplicateTransaction);

        // Attempt to insert the same transaction again
        let errorOccurred = false;
        let errorMessage = '';
        try {
            await txQueue.addTransactionToQueue(duplicateTransaction);
        } catch (error) {
            errorOccurred = true;
            errorMessage = (error as Error).message;
        }
        expect(errorOccurred).to.be.true;
        expect(errorMessage).to.equal('A transaction with the same identifier and a status other than COMPLETED exists within the TTL.');
    });

    // it('Overwriting an Expired Transaction', async () => {
    //     // Insert a transaction that will be considered outside TTL (expired)
    //     const expiredTransaction = {
    //         lowLevelUnsignedTransaction: {
    //             to: '0xTEST',
    //             value: BigInt('0'),
    //             data: '0xTEST',
    //         },
    //         executor: Executor.LEVERAGE,
    //         postEvalUniqueKey: 'test_uniqueIdentifier3',
    //         urgencyLevel: UrgencyLevel.LOW,
    //         ttlSeconds: -300, // Expired TTL
    //     } as OutboundTransaction;

    //     await txQueue.addTransactionToQueue(expiredTransaction);

    //     // Wait a bit to ensure the TTL is expired
    //     await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second

    //     // Insert the new transaction with the same identifier
    //     const newTransaction = {
    //         ...expiredTransaction,
    //         lowLevelUnsignedTransaction: { ...expiredTransaction.lowLevelUnsignedTransaction, data: '0xNEW_TEST' },
    //     };

    //     let errorOccurred = false;
    //     try {
    //         await txQueue.addTransactionToQueue(newTransaction);
    //     } catch (error) {
    //         errorOccurred = true;
    //     }
    //     expect(errorOccurred).to.be.false;

    //     // Verify the new transaction replaced the expired one
    //     const result = await dbClient.query('SELECT * FROM "Transactions"."Transaction" WHERE identifier = $1', ['uniqueIdentifier3']);
    //     expect(result.rows.length).to.equal(1);
    //     expect(result.rows[0].data).to.equal('0xNEW_TEST');
    // });
});
