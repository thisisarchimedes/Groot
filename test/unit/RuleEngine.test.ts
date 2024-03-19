import { expect } from 'chai';

import { FactoryRule } from '../../src/rule_engine/FactoryRule';
import { LoggerAdapter } from './adapters/LoggerAdapter';
import { ConfigServiceAdapter } from './adapters/ConfigServiceAdapter';
import { RuleEngine } from '../../src/rule_engine/RuleEngine';
import { BlockchainNodeAdapter } from './adapters/BlockchainNodeAdapter';
import { BlockchainReader } from '../../src/blockchain/blockchain_reader/BlockchainReader';
import { RuleJSONConfigItem, TypeRule } from '../../src/rule_engine/TypesRule';
import { OutboundTransaction } from '../../src/blockchain/OutboundTransaction';
import { AbiStorageAdapter } from './adapters/AbiStorageAdapter';
import { AbiFetcherAdapter } from './adapters/AbiFetcherAdapter';
import { AbiRepo } from '../../src/rule_engine/tool/abi_repository/AbiRepo';

describe('Rule Engine Testings', function () {
  const logger: LoggerAdapter = new LoggerAdapter();
  const configService: ConfigServiceAdapter = new ConfigServiceAdapter();
  let blockchainReader: BlockchainReader;



  beforeEach(async function () {
    const localNodeAlchemy = await startBlockchainNode('localNodeAlchemy');
    const localNodeInfura = await startBlockchainNode('localNodeInfura');
    blockchainReader = new BlockchainReader(logger, [localNodeAlchemy, localNodeInfura]);
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
    const abiStorage = new AbiStorageAdapter();
    const abiFetcher = new AbiFetcherAdapter();
    const abiRepo = new AbiRepo(blockchainReader, abiStorage, abiFetcher);

    const ruleFactory = new FactoryRule(logger, blockchainReader, abiRepo);
    const ruleEngine = new RuleEngine(logger, ruleFactory);
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
