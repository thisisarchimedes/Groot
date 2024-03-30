
import 'reflect-metadata';

import { expect } from 'chai';
import { Container } from 'inversify';
import { LoggerAdapter } from './adapters/LoggerAdapter';
import { ConfigServiceAdapter } from './adapters/ConfigServiceAdapter';
import { BlockchainNodeAdapter } from './adapters/BlockchainNodeAdapter';
import { BlockchainReader } from '../../src/blockchain/blockchain_reader/BlockchainReader';
import { RuleJSONConfigItem, TypeRule } from '../../src/rule_engine/TypesRule';
import { OutboundTransaction } from '../../src/blockchain/OutboundTransaction';
import { TYPES } from '../../src/inversify.types';
import { createTestContainer } from './inversify.config.unit_test';
import { IRuleEngine } from '../../src/rule_engine/interfaces/IRuleEngine';

describe('Rule Engine Testings', function () {
  let container: Container;
  let logger: LoggerAdapter;
  let configService: ConfigServiceAdapter;
  let blockchainReader: BlockchainReader;

  beforeEach(async function () {
    container = createTestContainer();
    logger = container.get<LoggerAdapter>(TYPES.ILoggerAll);
    configService = container.get<ConfigServiceAdapter>(ConfigServiceAdapter);
    blockchainReader = container.get<BlockchainReader>(TYPES.IBlockchainReader);

    const localNodeAlchemy = container.get<BlockchainNodeAdapter>(TYPES.BlockchainNodeLocalMain);
    const localNodeInfura = container.get<BlockchainNodeAdapter>(TYPES.BlockchainNodeLocalAlt);
    await Promise.all([localNodeAlchemy.startNode(), localNodeInfura.startNode()]);
  });

  it('should load rules from rule JSON and iterate on them, invoke each one', async function () {
    const expectedLogMessage = 'I AM GROOT';
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

    await ruleEngine.evaluateRulesAndCreateOutboundTransactions();
    const transactions = ruleEngine.getOutboundTransactions();

    assertRuleEvaluationResult(1, 1);
    assertTransactionsValid(transactions, 3);
  });

  async function createRuleEngineWithConfiguredRules(rulesFilePath: string): Promise<IRuleEngine> {
    configService.setRulesFromFile(rulesFilePath);
    await configService.refreshConfig();
    return createRuleEngine(configService.getRules());
  }

  function createRuleEngine(rules: RuleJSONConfigItem[]): IRuleEngine {
    const ruleEngine: IRuleEngine = container.get<IRuleEngine>(TYPES.IRuleEngine);
    ruleEngine.loadRulesFromJSONConfig(rules);
    return ruleEngine;
  }

  function createDummyRule(message: string, numberOfDummyTxs: number, evalSuccess: boolean): RuleJSONConfigItem {
    return {
      ruleType: TypeRule.Dummy,
      label: 'dummyRule',
      params: { message, NumberOfDummyTxs: numberOfDummyTxs, evalSuccess },
    };
  }

  function createInvalidRule(message: string, numberOfDummyTxs: number): RuleJSONConfigItem {
    return {
      ruleType: TypeRule.Invalid,
      label: 'invalideRule',
      params: { message, NumberOfDummyTxs: numberOfDummyTxs },
    };
  }

  function assertTransactionsValid(transactions: OutboundTransaction[], expectedLength?: number): void {
    expect(transactions).not.to.be.undefined;
    if (expectedLength !== undefined) {
      expect(transactions.length).to.be.eq(expectedLength);
    }
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
