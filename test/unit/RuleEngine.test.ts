import {expect} from 'chai';
import Web3 from 'web3';

import {FactoryRule} from '../../src/rule_engine/FactoryRule';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {ConfigServiceAdapter} from './adapters/ConfigServiceAdapter';
import {RuleEngine} from '../../src/rule_engine/RuleEngine';
import {BlockchainNodeAdapter} from './adapters/BlockchainNodeAdapter';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';
import {RuleJSONConfigItem, TypeRule} from '../../src/rule_engine/TypesRule';
import {OutboundTransaction} from '../../src/blockchain/OutboundTransaction';

describe('Rule Engine Testings', function() {
  const logger: LoggerAdapter = new LoggerAdapter();
  const configService: ConfigServiceAdapter = new ConfigServiceAdapter();
  let blockchainReader: BlockchainReader;

  beforeEach(async function() {
    const localNodeAlchemy = await startBlockchainNode('localNodeAlchemy');
    const localNodeInfura = await startBlockchainNode('localNodeInfura');
    blockchainReader = new BlockchainReader(logger, [localNodeAlchemy, localNodeInfura]);
  });

  it('should load rules from rule JSON and iterate on them, invoke each one', async function() {
    const expectedLogMessage = 'I AM GROOT';
    logger.lookForInfoLogLineContaining(expectedLogMessage);
    const ruleEngine = await createRuleEngineWithConfiguredRules('./test/unit/data/dummy_rules.json');

    await ruleEngine.evaluateRulesAndCreateOutboundTransactions();
    const transactions = ruleEngine.getOutboundTransactions();

    assertTransactionsValid(transactions, 3);
    expect(logger.isExpectedLogLineInfoFound()).to.be.true;
  });

  it('Should attach tx hash to all transactions', async function() {
    const ruleEngine = await createRuleEngineWithConfiguredRules('./test/unit/data/dummy_rules.json');

    await ruleEngine.evaluateRulesAndCreateOutboundTransactions();
    const transactions = ruleEngine.getOutboundTransactions();

    assertTransactionsValid(transactions);
    assertTransactionHashesValid(transactions);
  });

  it('Should report on 1 successful rule and 1 failed rule', async function() {
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

  async function startBlockchainNode(name: string): Promise<BlockchainNodeAdapter> {
    const node = new BlockchainNodeAdapter(logger, name);
    await node.startNode();
    return node;
  }

  async function createRuleEngineWithConfiguredRules(rulesFilePath: string): Promise<RuleEngine> {
    configService.setRulesFromFile(rulesFilePath);
    await configService.refreshConfig();
    return createRuleEngine(configService.getRules());
  }

  function createRuleEngine(rules: RuleJSONConfigItem[]): RuleEngine {
    const ruleFactory = new FactoryRule(logger, blockchainReader);
    const ruleEngine = new RuleEngine(logger, ruleFactory);
    ruleEngine.loadRulesFromJSONConfig(rules);
    return ruleEngine;
  }

  function createDummyRule(message: string, numberOfDummyTxs: number, evalSuccess: boolean): RuleJSONConfigItem {
    return {
      ruleType: TypeRule.Dummy,
      label: 'dummyRule',
      params: {message, NumberOfDummyTxs: numberOfDummyTxs, evalSuccess},
    };
  }

  function createInvalidRule(message: string, numberOfDummyTxs: number): RuleJSONConfigItem {
    return {
      ruleType: TypeRule.Invalid,
      label: 'invalideRule',
      params: {message, NumberOfDummyTxs: numberOfDummyTxs},
    };
  }

  function assertTransactionsValid(transactions: OutboundTransaction[], expectedLength?: number): void {
    expect(transactions).not.to.be.undefined;
    if (expectedLength !== undefined) {
      expect(transactions.length).to.be.eq(expectedLength);
    }
  }

  function assertTransactionHashesValid(transactions: OutboundTransaction[]): void {
    expect(transactions[0].hash).to.be.eq(Web3.utils.sha3(JSON.stringify(transactions[0].lowLevelUnsignedTransaction)));
    expect(transactions[1].hash).to.be.eq(Web3.utils.sha3(JSON.stringify(transactions[1].lowLevelUnsignedTransaction)));
    expect(transactions[0].hash).to.be.eq(transactions[1].hash);
  }

  function assertRuleEvaluationResult(successfulRuleEval: number, failedRuleEval: number): void {
    const logLine = logger.getLatestInfoLogLine();
    expect(logLine).to.contain(
        `Rule evaluation result: {"successfulRuleEval":${successfulRuleEval},` +
      `"failedRuleEval":${failedRuleEval}}`,
    );
  }
});
