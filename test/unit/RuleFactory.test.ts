import 'reflect-metadata';
import { expect } from 'chai';
import { FactoryRule } from '../../src/rule_engine/FactoryRule';
import { LoggerAdapter } from './adapters/LoggerAdapter';
import { RuleJSONConfigItem, TypeRule } from '../../src/rule_engine/TypesRule';
import { BlockchainReader } from '../../src/blockchain/blockchain_reader/BlockchainReader';
import { TYPES } from '../../src/inversify.types';
import { Container } from 'inversify';
import { BlockchainNodeAdapter } from './adapters/BlockchainNodeAdapter';
import { IAbiRepo } from '../../src/rule_engine/tool/abi_repository/interfaces/IAbiRepo';
import { createTestContainer } from './inversify.config.unit_test';

describe('Rule Factory Testings', function () {
  let container: Container;
  let logger: LoggerAdapter;
  let blockchainReader: BlockchainReader;
  let abiRepo: IAbiRepo;

  beforeEach(async function () {
    container = createTestContainer();
    logger = container.get<LoggerAdapter>(TYPES.ILoggerAll);
    blockchainReader = container.get<BlockchainReader>(TYPES.IBlockchainReader);
    abiRepo = container.get<IAbiRepo>(TYPES.IAbiRepo);

    const localNodeAlchemy = container.get<BlockchainNodeAdapter>(TYPES.BlockchainNodeLocalMain);
    const localNodeInfura = container.get<BlockchainNodeAdapter>(TYPES.BlockchainNodeLocalAlt);
    await Promise.all([localNodeAlchemy.startNode(), localNodeInfura.startNode()]);
  });

  it('should create Rule object from a dummy rule config', async function () {
    const ruleFactory = new FactoryRule(logger, blockchainReader, abiRepo);
    const dummyRule: RuleJSONConfigItem = {
      ruleType: TypeRule.Dummy,
      label: 'dummyRule',
      params: { message: 'I AM GROOT', NumberOfDummyTxs: 1, evalSuccess: true },
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
      params: { message: 'I AM GROOT', NumberOfDummyTxs: 3, evalSuccess: true },
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
      params: { message: 'I AM GROOT', NumberOfDummyTxs: 1, evalSuccess: true },
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
