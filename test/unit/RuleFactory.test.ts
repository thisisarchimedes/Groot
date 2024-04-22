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
import {ModulesParams} from '../../src/types/ModulesParams';
import LeverageDataSourceDB from '../../src/rule_engine/tool/data_source/LeverageDataSourceDB';

describe('Rule Factory Testings', function() {
  const modulesParams: ModulesParams = {};
  let ruleFactory: FactoryRule;

  beforeEach(async function() {
    modulesParams.configService = new ConfigServiceAWS('DemoApp', 'us-east-1');
    await modulesParams.configService.refreshConfig();

    modulesParams.logger = new LoggerAdapter();

    // Starting nodes
    modulesParams.mainNode = new BlockchainNodeAdapter(modulesParams, 'localNodeAlchemy');
    modulesParams.altNode = new BlockchainNodeAdapter(modulesParams, 'localNodeInfura');

    Promise.all([modulesParams.mainNode.startNode(), modulesParams.altNode.startNode()]);

    (modulesParams.altNode as BlockchainNodeAdapter)
        .setProxyInfoForAddressResponse({isProxy: false, implementationAddress: ''});

    modulesParams.blockchainReader = new BlockchainReader(modulesParams);
    modulesParams.dbService = new DBService(modulesParams.logger!, modulesParams.configService);
    modulesParams.leverageDataSource = {
      leverageDataSourceDB: new LeverageDataSourceDB(modulesParams),
    };

    const abiStorage = new AbiStorageAdapter();
    const abiFetcher = new AbiFetcherAdapter();
    modulesParams.abiRepo = new AbiRepo(modulesParams, abiStorage, abiFetcher);

    ruleFactory = new FactoryRule(modulesParams);
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
    expect((modulesParams.logger as LoggerAdapter).getLatestInfoLogLine()).to.contain('I AM GROOT');
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
