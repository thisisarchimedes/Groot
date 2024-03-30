import 'reflect-metadata';
import { expect } from 'chai';
import { LoggerAdapter } from './adapters/LoggerAdapter';
import { UrgencyLevel } from '../../src/rule_engine/TypesRule';
import { OutboundTransaction } from '../../src/blockchain/OutboundTransaction';
import { TxQueueAdapter } from './adapters/TxQueueAdapter';
import { TransactionQueuer } from '../../src/tx_queue/TransactionQueuer';
import { TYPES } from '../../src/inversify.types';
import { Container } from 'inversify';
import { createTestContainer } from './inversify.config.unit_test';

describe('Transaction Queuer', function () {
  let container: Container;
  let logger: LoggerAdapter;
  let txQueuer: TransactionQueuer;
  let queue: TxQueueAdapter;

  beforeEach(async function () {
    container = createTestContainer();
    logger = container.get<LoggerAdapter>(TYPES.ILoggerAll);
    queue = container.get<TxQueueAdapter>(TxQueueAdapter);
    txQueuer = new TransactionQueuer(logger, queue);
  });

  it('should filter out and report on all tx that dont have a hash', async function () {
    const txs: OutboundTransaction[] = [
      {
        urgencyLevel: UrgencyLevel.URGENT,
        context: 'test 1',
        postEvalUniqueKey: '0x1234',
        lowLevelUnsignedTransaction: {
          to: '0x0',
          value: BigInt(0),
          data: '0x0',
        },
      },
      {
        urgencyLevel: UrgencyLevel.URGENT,
        context: 'test 2',
        postEvalUniqueKey: '',
        lowLevelUnsignedTransaction: {
          to: '0x0',
          value: BigInt(0),
          data: '0x0',
        },
      },
      {
        urgencyLevel: UrgencyLevel.NORMAL,
        context: 'test 3',
        postEvalUniqueKey: '0x345',
        lowLevelUnsignedTransaction: {
          to: '0x0',
          value: BigInt(0),
          data: '0x0',
        },
      },
    ];

    await txQueuer.queueTransactions(txs);
    const txsInQueue = queue.getTransactions();
    expect(txsInQueue[0].postEvalUniqueKey).to.be.eq('0x1234');
    expect(txsInQueue[1].postEvalUniqueKey).to.be.eq('0x345');
    expect(txsInQueue[2]).to.be.undefined;
    expect(logger.getLatestErrorLogLine()).to.contain('test 2');
  });
});
