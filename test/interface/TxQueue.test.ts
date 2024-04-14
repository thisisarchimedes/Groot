import { expect } from 'chai';

import { TYPES } from '../../src/inversify.types';
import { ITxQueue } from '../../src/tx_queue/interfaces/ITxQueue';
import { OutboundTransaction } from '../../src/blockchain/OutboundTransaction';
import { ConfigServiceAWS } from '../../src/service/config/ConfigServiceAWS';
import { Executor, UrgencyLevel } from '../../src/rule_engine/TypesRule';
import DBService from '../../src/service/db/dbService';
import PostgreTxQueue from '../../src/tx_queue/PostgreTxQueue';
import { LoggerAll } from '../../src/service/logger/LoggerAll';

describe('Transaction Insertion Tests', function () {
    let txQueue: ITxQueue;
    let dbService: DBService;

    this.beforeAll(async () => {
        const configService = new ConfigServiceAWS('DemoApp', 'us-east-1');
        await configService.refreshConfig();

        const logger = new LoggerAll(configService);

        const dbService = new DBService(logger, configService);
        await configService.refreshConfig();

        txQueue = new PostgreTxQueue(logger, dbService);
    })

    this.afterAll(async () => {
        await dbService.getTransactionsClient().query('DELETE FROM "Transactions"."Transaction" WHERE "identifier" LIKE $1', ['test_%']);
        await dbService.end();
    });

    afterEach(async () => {
        await dbService.getTransactionsClient().query('DELETE FROM "Transactions"."Transaction" WHERE "identifier" LIKE $1', ['test_%']);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 5 seconds
    });

    it('Should insert a new transaction', async () => {
        const testTransaction = {
            lowLevelUnsignedTransaction: {
                to: '0xTEST',
                value: BigInt('0'),
                data: '0xTEST',
            },
            executor: Executor.LEVERAGE,
            postEvalUniqueKey: 'test_uniqueIdentifier1',
            urgencyLevel: UrgencyLevel.LOW,
            ttlSeconds: 300,
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
        const result = await dbService.getTransactionsClient().query('SELECT * FROM "Transactions"."Transaction" WHERE identifier = $1', ['test_uniqueIdentifier1']);
        expect(result.rows.length).to.equal(1);
        expect(result.rows[0].identifier).to.equal('test_uniqueIdentifier1');
    });

    it('Attempting to insert a duplicate transaction within TTL', async () => {
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

    it('Inserting a Transaction After Previous One Expires', async () => {
        const expiredTransaction = {
            lowLevelUnsignedTransaction: {
                to: '0xTEST',
                value: BigInt('0'), // converted to bigint
                data: '0xTEST',
            },
            executor: Executor.LEVERAGE,
            postEvalUniqueKey: 'test_expiredTransaction',
            urgencyLevel: UrgencyLevel.LOW,
            ttlSeconds: 1, // 1 sec for quick expiration
        } as OutboundTransaction;

        await txQueue.addTransactionToQueue(expiredTransaction);

        // Wait for the transaction to expire
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds

        // Insert a new transaction with the same identifier
        const newTransaction = { ...expiredTransaction };

        let errorOccurred = false;
        try {
            await txQueue.addTransactionToQueue(newTransaction);
        } catch (error) {
            errorOccurred = true;
        }
        expect(errorOccurred).to.be.false;

        const pendingResult = await dbService.getTransactionsClient().query('SELECT * FROM "Transactions"."Transaction" WHERE status = $1 AND identifier = $2', ['PENDING', 'test_expiredTransaction']);
        const failedResult = await dbService.getTransactionsClient().query('SELECT * FROM "Transactions"."Transaction" WHERE status = $1 AND identifier = $2', ['FAILED', 'test_expiredTransaction']);

        expect(pendingResult.rows.length).to.equal(1);
        expect(failedResult.rows.length).to.equal(1);
    }).timeout(1000000000);

    it('Concurrent Insertions with Different Identifiers', async () => {
        const transactions = [{
            lowLevelUnsignedTransaction: {
                to: '0xTEST',
                value: BigInt('0'), // converted to bigint
                data: '0xTEST',
            },
            executor: Executor.LEVERAGE,
            postEvalUniqueKey: 'test_uniqueIdentifier200',
            urgencyLevel: UrgencyLevel.LOW,
            ttlSeconds: 300, // 5 minutes
        } as OutboundTransaction, {
            lowLevelUnsignedTransaction: {
                to: '0xTEST',
                value: BigInt('0'), // converted to bigint
                data: '0xTEST',
            },
            executor: Executor.LEVERAGE,
            postEvalUniqueKey: 'test_uniqueIdentifier201',
            urgencyLevel: UrgencyLevel.LOW,
            ttlSeconds: 300, // 5 minutes
        } as OutboundTransaction
        ];

        const insertionPromises = transactions.map(tx => txQueue.addTransactionToQueue(tx));
        await Promise.all(insertionPromises);

        // Verify each transaction was inserted
        for (let tx of transactions) {
            const result = await dbService.getTransactionsClient().query('SELECT * FROM "Transactions"."Transaction" WHERE identifier = $1', [tx.postEvalUniqueKey]);
            expect(result.rows.length).to.equal(1);
        }
    }).timeout(1000000000);
});
