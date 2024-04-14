
import 'reflect-metadata';

import {expect} from 'chai';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {ConfigServiceAdapter} from './adapters/ConfigServiceAdapter';
import {BlockchainNodeAdapter} from './adapters/BlockchainNodeAdapter';
import {RuleJSONConfigItem, TypeRule} from '../../src/rule_engine/TypesRule';
import {RuleParamsDummy} from '../../src/rule_engine/rule/RuleDummy';
import {OutboundTransaction} from '../../src/blockchain/OutboundTransaction';
import {RuleEngine} from '../../src/rule_engine/RuleEngine';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {BlockchainNodeLocal} from '../../src/blockchain/blockchain_nodes/BlockchainNodeLocal';

describe('Rule Engine Testings', function() {
  let logger: LoggerAdapter;
  let configService: ConfigServiceAdapter;
  let localNodeAlchemy: BlockchainNodeAdapter;
  let localNodeInfura: BlockchainNodeAdapter;
  let ruleEngine: RuleEngine;

  beforeEach(async function() {
    logger = new LoggerAdapter();
    configService = new ConfigServiceAdapter();
    configService.setLeverageContractInfo({
      positionOpener: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
      positionLiquidator: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
      positionCloser: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
      positionExpirator: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
      positionLedger: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
    });
    localNodeAlchemy = new BlockchainNodeAdapter(logger, 'localNodeAlchemy');
    localNodeInfura = new BlockchainNodeAdapter(logger, 'localNodeInfura');
    await Promise.all([localNodeAlchemy.startNode(), localNodeInfura.startNode()]);
    ruleEngine = new RuleEngine(
        logger,
        configService as unknown as ConfigServiceAWS,
        localNodeAlchemy as unknown as BlockchainNodeLocal,
        localNodeInfura as unknown as BlockchainNodeLocal,
    );
  });

  it('should load rules from rule JSON and iterate on them, invoke each one', async function() {
    const expectedLogMessage = 'I AM GROOT';

    configService.setLeverageContractInfo({
      positionOpener: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
      positionLiquidator: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
      positionCloser: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
      positionExpirator: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
      positionLedger: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
    });

    logger.lookForInfoLogLineContaining(expectedLogMessage);
    const ruleEngine = await createRuleEngineWithConfiguredRules('./test/unit/data/dummy_rules.json');

    await ruleEngine.evaluateRulesAndCreateOutboundTransactions();
    const transactions = ruleEngine.getOutboundTransactions();
    assertTransactionsValid(transactions, 3);
    expect(logger.isExpectedLogLineInfoFound()).to.be.true;
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
    configService.setRulesFromFile(rulesFilePath);
    await configService.refreshConfig();
    return await createRuleEngine(configService.getRules());
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
    const logLine = logger.getLatestInfoLogLine();
    expect(logLine).to.contain(
        `"message":"Rule Eval Results",` +
      `"successfulRuleEval":${successfulRuleEval},` +
      `"failedRuleEval":${failedRuleEval}`,
    );
  }
});
