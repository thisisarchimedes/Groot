
import 'reflect-metadata';

import { expect } from 'chai';
import { Container } from 'inversify';
import { LoggerAdapter } from './adapters/LoggerAdapter';
import { ConfigServiceAdapter } from './adapters/ConfigServiceAdapter';
import { BlockchainNodeAdapter } from './adapters/BlockchainNodeAdapter';
import { BlockchainReader } from '../../src/blockchain/blockchain_reader/BlockchainReader';
import { TYPES } from '../../src/inversify.types';
import { createTestContainer } from './inversify.config.unit_test';
import { IRuleEngine } from '../../src/rule_engine/interfaces/IRuleEngine';
import { RuleJSONConfigItem, TypeRule } from '../../src/rule_engine/TypesRule';
import { RuleParamsDummy } from '../../src/rule_engine/rule/RuleDummy';
import { OutboundTransaction } from '../../src/blockchain/OutboundTransaction';

describe('Rule Engine Testings', function () {
  let container: Container;
  let logger: LoggerAdapter;
  let configService: ConfigServiceAdapter;

  beforeEach(async function () {
    container = createTestContainer();
    logger = container.get<LoggerAdapter>(TYPES.ILoggerAll);
    configService = container.get<ConfigServiceAdapter>(TYPES.ConfigServiceAWS);
    configService.setLeverageContractInfo({
      positionOpener: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
      positionLiquidator: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
      positionCloser: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
      positionExpirator: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
      positionLedger: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
    })
    const localNodeAlchemy = container.get<BlockchainNodeAdapter>(TYPES.BlockchainNodeLocalMain);
    const localNodeInfura = container.get<BlockchainNodeAdapter>(TYPES.BlockchainNodeLocalAlt);
    await Promise.all([localNodeAlchemy.startNode(), localNodeInfura.startNode()]);
  });

  it('should load rules from rule JSON and iterate on them, invoke each one', async function () {
    const expectedLogMessage = 'I AM GROOT';

    configService.setLeverageContractInfo({
      positionOpener: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
      positionLiquidator: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
      positionCloser: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
      positionExpirator: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
      positionLedger: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
    })

    logger.lookForInfoLogLineContaining(expectedLogMessage);
    const ruleEngine = await createRuleEngineWithConfiguredRules('./test/unit/data/dummy_rules.json');

    await ruleEngine.evaluateRulesAndCreateOutboundTransactions();
    const transactions = ruleEngine.getOutboundTransactions();
    assertTransactionsValid(transactions, 3);
    expect(logger.isExpectedLogLineInfoFound()).to.be.true;
  });

  it('Should report on 1 successful rule and 1 failed rule', async function () {
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

  async function createRuleEngineWithConfiguredRules(rulesFilePath: string): Promise<IRuleEngine> {
    configService.setRulesFromFile(rulesFilePath);
    await configService.refreshConfig();
    return await createRuleEngine(configService.getRules());
  }

  async function createRuleEngine(rules: RuleJSONConfigItem[]): Promise<IRuleEngine> {
    const ruleEngine: IRuleEngine = container.get<IRuleEngine>(TYPES.IRuleEngine);
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
      params: { message, NumberOfDummyTxs: numberOfDummyTxs, evalSuccess } as RuleParamsDummy,
    };
  }

  function createInvalidRule(message: string, numberOfDummyTxs: number): RuleJSONConfigItem {
    return {
      ruleType: TypeRule.Invalid,
      label: 'invalideRule',
      params: { message, NumberOfDummyTxs: numberOfDummyTxs } as RuleParamsDummy,
    };
  }

  function assertRuleEvaluationResult(successfulRuleEval: number, failedRuleEval: number): void {
    const logLine = logger.getLatestInfoLogLine();
    expect(logLine).to.contain(
      `"message":"Rule Eval Results",` +
      `"successfulRuleEval":${successfulRuleEval},` +
      `"failedRuleEval":${failedRuleEval}`,
    );
  }
});
