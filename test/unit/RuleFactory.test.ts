import { expect } from 'chai';

import { FactoryRule } from '../../src/rule_engine/FactoryRule';
import { LoggerAdapter } from './adapters/LoggerAdapter';
import { RuleJSONConfigItem, TypeRule } from '../../src/rule_engine/TypesRule';
import { BlockchainNodeAdapter } from './adapters/BlockchainNodeAdapter';
import { BlockchainReader } from '../../src/blockchain/blockchain_reader/BlockchainReader';
import { AbiRepo } from '../../src/rule_engine/tool/abi_repository/AbiRepo';
import { AbiStorageAdapter } from './adapters/AbiStorageAdapter';
import { AbiFetcherAdapter } from './adapters/AbiFetcherAdapter';
import { ConfigServiceAWS } from '../../src/service/config/ConfigServiceAWS';

describe('Rule Factory Testings', function () {
  const logger: LoggerAdapter = new LoggerAdapter();
  let localNodeAlchemy: BlockchainNodeAdapter;
  let localNodeInfura: BlockchainNodeAdapter;
  let blockchainReader: BlockchainReader;
  let abiRepo: AbiRepo;

  beforeEach(async function () {
    localNodeAlchemy = new BlockchainNodeAdapter(logger, 'localNodeAlchemy');
    await localNodeAlchemy.startNode();

    localNodeInfura = new BlockchainNodeAdapter(logger, 'localNodeInfura');
    await localNodeInfura.startNode();

    blockchainReader = new BlockchainReader(logger, [localNodeAlchemy, localNodeInfura]);

    const abiStorage = new AbiStorageAdapter();
    const abiFetcher = new AbiFetcherAdapter();
    abiRepo = new AbiRepo(blockchainReader, abiStorage, abiFetcher);
  });

  it('should create Rule object from a dummy rule config', async function () {
    const ruleFactory = new FactoryRule(logger, blockchainReader, abiRepo);

    const dummyRule: RuleJSONConfigItem = {
      ruleType: TypeRule.Dummy,
      label: 'dummyRule',
      params: {
        message: 'I AM GROOT',
        NumberOfDummyTxs: 1,
        evalSuccess: true,
      },
    };

    const rule = ruleFactory.createRule(dummyRule);
    expect(rule).not.to.be.undefined;
    if (rule) {
      await rule.evaluate();
    }
    expect(logger.getLatestInfoLogLine()).to.contain('I AM GROOT');
  });

  it('should generate more than one tx per rule', async function () {
    const dummyRule: RuleJSONConfigItem = {
      ruleType: TypeRule.Dummy,
      label: 'dummyRule',
      params: {
        message: 'I AM GROOT',
        NumberOfDummyTxs: 3,
        evalSuccess: true,
      },
    };

    const ruleFactory = new FactoryRule(logger, blockchainReader, abiRepo);
    const rule = ruleFactory.createRule(dummyRule);
    if (rule) {
      await rule.evaluate();
    } else {
      expect.fail('Rule is undefined');
    }

    expect(rule.getPendingTransactionCount()).be.eq(3);
    expect(rule.popTransactionFromRuleLocalQueue()).not.to.be.undefined;

    expect(rule.getPendingTransactionCount()).be.eq(2);
    expect(rule.popTransactionFromRuleLocalQueue()).not.to.be.undefined;

    expect(rule.getPendingTransactionCount()).be.eq(1);
    expect(rule.popTransactionFromRuleLocalQueue()).not.to.be.undefined;

    expect(rule.getPendingTransactionCount()).be.eq(0);
    expect(rule.popTransactionFromRuleLocalQueue()).to.be.undefined;
  });

  it('should create identifier when the Rule evaluates itself', async function () {
    const ruleFactory = new FactoryRule(logger, blockchainReader, abiRepo);

    const dummyRule: RuleJSONConfigItem = {
      ruleType: TypeRule.Dummy,
      label: 'dummyRule',
      params: {
        message: 'I AM GROOT',
        NumberOfDummyTxs: 1,
        evalSuccess: true,
      },
    };

    const rule = ruleFactory.createRule(dummyRule);
    expect(rule).not.to.be.undefined;
    if (rule) {
      await rule.evaluate();
    }

    const tx = rule?.popTransactionFromRuleLocalQueue();
    expect(tx!.postEvalUniqueKey === 'dummyKey').to.be.true;
  });
});
