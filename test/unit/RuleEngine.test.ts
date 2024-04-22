
import 'reflect-metadata';

import {expect} from 'chai';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {ConfigServiceAdapter} from './adapters/ConfigServiceAdapter';
import {BlockchainNodeAdapter} from './adapters/BlockchainNodeAdapter';
import {RuleJSONConfigItem, TypeRule} from '../../src/rule_engine/TypesRule';
import {RuleParamsDummy} from '../../src/rule_engine/rule/RuleDummy';
import {OutboundTransaction} from '../../src/blockchain/OutboundTransaction';
import {RuleEngine} from '../../src/rule_engine/RuleEngine';
import {FactoryRule} from '../../src/rule_engine/FactoryRule';
import {AbiStorageAdapter} from './adapters/AbiStorageAdapter';
import {AbiFetcherAdapter} from './adapters/AbiFetcherAdapter';
import {AbiRepo} from '../../src/rule_engine/tool/abi_repository/AbiRepo';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';
import DBService from '../../src/service/db/dbService';
import {ModulesParams} from '../../src/types/ModulesParams';

describe('Rule Engine Testings', function() {
  const modulesParams: ModulesParams = {};
  let ruleEngine: RuleEngine;

  beforeEach(async function() {
    modulesParams.logger = new LoggerAdapter();
    modulesParams.configService = new ConfigServiceAdapter();
    (modulesParams.configService as ConfigServiceAdapter).setLeverageContractInfo({
      positionOpener: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
      positionLiquidator: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
      positionCloser: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
      positionExpirator: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
      positionLedger: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
    });
    modulesParams.mainNode = new BlockchainNodeAdapter(modulesParams, 'localNodeAlchemy');
    modulesParams.altNode = new BlockchainNodeAdapter(modulesParams, 'localNodeInfura');
    await Promise.all([modulesParams.mainNode.startNode(), modulesParams.altNode.startNode()]);

    modulesParams.blockchainReader = new BlockchainReader(modulesParams);
    modulesParams.dbService = new DBService(modulesParams.logger, modulesParams.configService);

    const abiStorage = new AbiStorageAdapter();
    const abiFetcher = new AbiFetcherAdapter();
    modulesParams.abiRepo = new AbiRepo(modulesParams, abiStorage, abiFetcher);

    const ruleFactory = new FactoryRule(modulesParams);
    ruleEngine = new RuleEngine(modulesParams, ruleFactory);
  });

  it('should load rules from rule JSON and iterate on them, invoke each one', async function() {
    const expectedLogMessage = 'I AM GROOT';

    (modulesParams.configService as ConfigServiceAdapter).setLeverageContractInfo({
      positionOpener: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
      positionLiquidator: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
      positionCloser: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
      positionExpirator: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
      positionLedger: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
    });

    (modulesParams.logger as LoggerAdapter).lookForInfoLogLineContaining(expectedLogMessage);
    const ruleEngine = await createRuleEngineWithConfiguredRules('./test/unit/data/dummy_rules.json');

    await ruleEngine.evaluateRulesAndCreateOutboundTransactions();
    const transactions = ruleEngine.getOutboundTransactions();
    assertTransactionsValid(transactions, 5);
    expect((modulesParams.logger as LoggerAdapter).isExpectedLogLineInfoFound()).to.be.true;
  });

  it('Should report on 1 successful rule and 1 failed rule', async function() {
    const testRules: RuleJSONConfigItem[] = [
      createDummyRule('I AM GROOT', 3, true),
      createInvalidRule('I AM GROOT', 3),
      createDummyRule('I AM GROOT', 1, false),
    ];
    const ruleEngine = createRuleEngine(testRules);

    await (await ruleEngine).evaluateRulesAndCreateOutboundTransactions();
    const transactions = (await ruleEngine).getOutboundTransactions();

    assertRuleEvaluationResult(1, 1);
    assertTransactionsValid(transactions, 3);
  });

  async function createRuleEngineWithConfiguredRules(rulesFilePath: string): Promise<RuleEngine> {
    (modulesParams.configService as ConfigServiceAdapter).setRulesFromFile(rulesFilePath);
    await (modulesParams.configService as ConfigServiceAdapter).refreshConfig();
    return await createRuleEngine((modulesParams.configService as ConfigServiceAdapter).getRules());
  }

  async function createRuleEngine(rules: RuleJSONConfigItem[]): Promise<RuleEngine> {
    await ruleEngine.loadRulesFromJSONConfig(rules);
    return ruleEngine;
  }

  function assertTransactionsValid(transactions: OutboundTransaction[], expectedLength?: number): void {
    expect(transactions).not.to.be.undefined;
    if (expectedLength !== undefined) {
      expect(transactions.length).to.be.eq(expectedLength);
    }
  }

  function createDummyRule(message: string, numberOfDummyTxs: number, evalSuccess: boolean): RuleJSONConfigItem {
    return {
      ruleType: TypeRule.Dummy,
      label: 'dummyRule',
      params: {message, NumberOfDummyTxs: numberOfDummyTxs, evalSuccess} as RuleParamsDummy,
    };
  }

  function createInvalidRule(message: string, numberOfDummyTxs: number): RuleJSONConfigItem {
    return {
      ruleType: TypeRule.Invalid,
      label: 'invalideRule',
      params: {message, NumberOfDummyTxs: numberOfDummyTxs} as RuleParamsDummy,
    };
  }

  function assertRuleEvaluationResult(successfulRuleEval: number, failedRuleEval: number): void {
    const logLine = (modulesParams.logger as LoggerAdapter).getLatestInfoLogLine();
    expect(logLine).to.contain(
        `"message":"Rule Eval Results",` +
      `"successfulRuleEval":${successfulRuleEval},` +
      `"failedRuleEval":${failedRuleEval}`,
    );
  }
});
