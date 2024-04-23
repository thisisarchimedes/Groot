import 'reflect-metadata';
import {expect} from 'chai';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {Executor, UrgencyLevel} from '../../src/rule_engine/TypesRule';
import {OutboundTransaction} from '../../src/blockchain/OutboundTransaction';
import {TxQueueAdapter} from './adapters/TxQueueAdapter';
import {TransactionQueuer} from '../../src/tx_queue/TransactionQueuer';
import {ModulesParams} from '../../src/types/ModulesParams';

describe('Transaction Queuer', function() {
  const modulesParams: ModulesParams = {};
  let queue: TxQueueAdapter;

  beforeEach(function() {
    modulesParams.logger = new LoggerAdapter();
    queue = new TxQueueAdapter();
    modulesParams.transactionsQueuer = new TransactionQueuer(modulesParams, queue);
  });

  it('should filter out and report on all tx that dont have a hash', async function() {
    const txs: OutboundTransaction[] = [
      {
        urgencyLevel: UrgencyLevel.HIGH,
        ttlSeconds: 300,
        executor: Executor.LEVERAGE,
        context: 'test 1',
        postEvalUniqueKey: '0x1234',
        lowLevelUnsignedTransaction: {
          to: '0x0',
          value: BigInt(0),
          data: '0x0',
        },
      },
      {
        urgencyLevel: UrgencyLevel.HIGH,
        ttlSeconds: 300,
        executor: Executor.LEVERAGE,
        context: 'test 2',
        postEvalUniqueKey: '',
        lowLevelUnsignedTransaction: {
          to: '0x0',
          value: BigInt(0),
          data: '0x0',
        },
      },
      {
        urgencyLevel: UrgencyLevel.LOW,
        ttlSeconds: 300,
        executor: Executor.LEVERAGE,
        context: 'test 3',
        postEvalUniqueKey: '0x345',
        lowLevelUnsignedTransaction: {
          to: '0x0',
          value: BigInt(0),
          data: '0x0',
        },
      },
    ];

    await modulesParams.transactionsQueuer!.queueTransactions(txs);
    const txsInQueue = queue.getTransactions();
    expect(txsInQueue[0].postEvalUniqueKey).to.be.eq('0x1234');
    expect(txsInQueue[1].postEvalUniqueKey).to.be.eq('0x345');
    expect(txsInQueue[2]).to.be.undefined;
    expect((modulesParams.logger as LoggerAdapter).getLatestErrorLogLine()).to.contain('test 2');
  });
});
