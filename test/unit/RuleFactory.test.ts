import 'reflect-metadata';
import {expect} from 'chai';
import {FactoryRule} from '../../src/rule_engine/FactoryRule';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {RuleJSONConfigItem, TypeRule} from '../../src/rule_engine/TypesRule';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';
import {BlockchainNodeAdapter} from './adapters/BlockchainNodeAdapter';
import {RuleParamsDummy} from '../../src/rule_engine/rule/RuleDummy';
import {AbiRepo} from '../../src/rule_engine/tool/abi_repository/AbiRepo';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {AbiStorageAdapter} from './adapters/AbiStorageAdapter';
import {AbiFetcherAdapter} from './adapters/AbiFetcherAdapter';
import DBService from '../../src/service/db/dbService';
import LeverageDataSource from '../../src/rule_engine/tool/data_source/LeverageDataSource';

describe('Rule Factory Testings', function() {
  let logger: LoggerAdapter;
  let blockchainReader: BlockchainReader;
  let localNodeAlchemy: BlockchainNodeAdapter;
  let localNodeInfura: BlockchainNodeAdapter;
  let abiRepo: AbiRepo;
  let ruleFactory: FactoryRule;

  beforeEach(async function() {
    const configService = new ConfigServiceAWS('DemoApp', 'us-east-1');
    await configService.refreshConfig();

    logger = new LoggerAdapter();

    // Starting nodes
    localNodeAlchemy = new BlockchainNodeAdapter(logger, 'localNodeAlchemy');
    localNodeInfura = new BlockchainNodeAdapter(logger, 'localNodeInfura');

    Promise.all([localNodeAlchemy.startNode(), localNodeInfura.startNode()]);

    localNodeInfura.setProxyInfoForAddressResponse({isProxy: false, implementationAddress: ''});

    blockchainReader = new BlockchainReader(logger, localNodeAlchemy, localNodeInfura);
    const dbService = new DBService(logger, configService);
    const leverageDataSource = new LeverageDataSource(logger, dbService);

    const abiStorage = new AbiStorageAdapter();
    const abiFetcher = new AbiFetcherAdapter();
    abiRepo = new AbiRepo(blockchainReader, abiStorage, abiFetcher);

    ruleFactory = new FactoryRule(logger, configService, blockchainReader, abiRepo, leverageDataSource);
  });

  it('should create Rule object from a dummy rule config', async function() {
    const dummyRule: RuleJSONConfigItem = {
      ruleType: TypeRule.Dummy,
      label: 'dummyRule',
      params: {message: 'I AM GROOT', NumberOfDummyTxs: 1, evalSuccess: true} as RuleParamsDummy,
    };
    const rule = await ruleFactory.createRule(dummyRule);
    expect(rule).not.to.be.undefined;
    if (rule) {
      await rule.evaluate();
    }
    expect(logger.getLatestInfoLogLine()).to.contain('I AM GROOT');
  });

  it('should generate more than one tx per rule', async function() {
    const dummyRule: RuleJSONConfigItem = {
      ruleType: TypeRule.Dummy,
      label: 'dummyRule',
      params: {message: 'I AM GROOT', NumberOfDummyTxs: 3, evalSuccess: true} as RuleParamsDummy,
    };
    const rule = await ruleFactory.createRule(dummyRule);
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

  it('should create identifier when the Rule evaluates itself', async function() {
    const dummyRule: RuleJSONConfigItem = {
      ruleType: TypeRule.Dummy,
      label: 'dummyRule',
      params: {message: 'I AM GROOT', NumberOfDummyTxs: 1, evalSuccess: true} as RuleParamsDummy,
    };
    const rule = await ruleFactory.createRule(dummyRule);
    expect(rule).not.to.be.undefined;
    if (rule) {
      await rule.evaluate();
    }
    const tx = rule?.popTransactionFromRuleLocalQueue();
    expect(tx!.postEvalUniqueKey === 'dummyKey').to.be.true;
  });
});
