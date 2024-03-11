import {expect} from 'chai';
import Web3 from 'web3';

import {FactoryRule} from '../../src/rule_engine/FactoryRule';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {ConfigServiceAdapter} from './adapters/ConfigServiceAdapter';
import {RuleEngine} from '../../src/rule_engine/RuleEngine';
import {BlockchainNodeAdapter} from './adapters/BlockchainNodeAdapter';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';
import {RuleJSONConfigItem, TypeRule} from '../../src/rule_engine/TypesRule';

describe('Rule Engine Testings', function() {
  const logger: LoggerAdapter = new LoggerAdapter();
  const configService: ConfigServiceAdapter = new ConfigServiceAdapter();
  let localNodeAlchemy: BlockchainNodeAdapter;
  let localNodeInfura: BlockchainNodeAdapter;
  let blockchainReader: BlockchainReader;

  beforeEach(async function() {
    localNodeAlchemy = new BlockchainNodeAdapter(logger, 'localNodeAlchemy');
    await localNodeAlchemy.startNode();

    localNodeInfura = new BlockchainNodeAdapter(logger, 'localNodeInfura');
    await localNodeInfura.startNode();

    blockchainReader = new BlockchainReader(logger, [localNodeAlchemy, localNodeInfura]);
  });

  it('should load rules from rule JSON and iterate on them, invoke each one', async function() {
    logger.lookForInfoLogLineContaining('I AM GROOT');
    configService.setRulesFromFile('./test/unit/data/dummy_rules.json');
    await configService.refreshConfig();

    const ruleFactory = new FactoryRule(logger, blockchainReader);
    const ruleEngine = new RuleEngine(logger, ruleFactory);

    ruleEngine.loadRulesFromJSONConfig(configService.getRules());
    await ruleEngine.evaluateRulesAndCreateOutboundTransactions();
    const tx = ruleEngine.getOutboundTransactions();

    expect(tx).not.to.be.undefined;
    expect(tx.length).to.be.eq(3);
    expect(logger.isExpectedLogLineInfoFound()).to.be.true;
  });

  it('Should attach tx hash to all transactions', async function() {
    configService.setRulesFromFile('./test/unit/data/dummy_rules.json');
    await configService.refreshConfig();

    const ruleFactory = new FactoryRule(logger, blockchainReader);
    const ruleEngine = new RuleEngine(logger, ruleFactory);

    ruleEngine.loadRulesFromJSONConfig(configService.getRules());
    await ruleEngine.evaluateRulesAndCreateOutboundTransactions();
    const tx = ruleEngine.getOutboundTransactions();

    expect(tx).not.to.be.undefined;
    expect(tx[0].hash).to.be.eq(Web3.utils.sha3(JSON.stringify(tx[0].lowLevelUnsignedTransaction)));
    expect(tx[1].hash).to.be.eq(Web3.utils.sha3(JSON.stringify(tx[1].lowLevelUnsignedTransaction)));
    expect(tx[0].hash).to.be.eq(tx[1].hash);
  });

  it('Should report on 1 successful rule and 1 failed rule', async function() {
    const testRules: RuleJSONConfigItem[] = [
      {
        ruleType: TypeRule.Dummy,
        label: 'dummyRule',
        params: {
          message: 'I AM GROOT',
          NumberOfDummyTxs: 3,
          evalSuccess: true,
        },
      },
      {
        ruleType: TypeRule.Invalid,
        label: 'invalideRule',
        params: {
          message: 'I AM GROOT',
          NumberOfDummyTxs: 3,
        },
      },
      {
        ruleType: TypeRule.Dummy,
        label: 'dummyRule',
        params: {
          message: 'I AM GROOT',
          NumberOfDummyTxs: 1,
          evalSuccess: false,
        },
      },
    ];
    const ruleFactory = new FactoryRule(logger, blockchainReader);
    const ruleEngine = new RuleEngine(logger, ruleFactory);

    ruleEngine.loadRulesFromJSONConfig(testRules);
    await ruleEngine.evaluateRulesAndCreateOutboundTransactions();
    const tx = ruleEngine.getOutboundTransactions();

    const logLine = logger.getLatestInfoLogLine();
    expect(logLine).to.contain('Rule evaluation result: {"successfulRuleEval":1,"failedRuleEval":1}');
    expect(tx).not.to.be.undefined;
    expect(tx.length).to.be.eq(3);
  });
});
