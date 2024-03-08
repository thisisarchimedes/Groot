import {expect} from 'chai';
import Web3 from 'web3';

import {FactoryRule} from '../../src/rule_engine/FactoryRule';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {ConfigServiceAdapter} from './adapters/ConfigServiceAdapter';
import {RuleEngine} from '../../src/rule_engine/RuleEngine';
import {BlockchainNodeAdapter} from './adapters/BlockchainNodeAdapter';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';

describe('Rule Engine Testings', function() {
  const logger: LoggerAdapter = new LoggerAdapter();
  const configService: ConfigServiceAdapter = new ConfigServiceAdapter();
  let localNodeAlchemy: BlockchainNodeAdapter;
  let localNodeInfura: BlockchainNodeAdapter;
  let blockchainReader: BlockchainReader;

  beforeEach(async function() {
    localNodeAlchemy = new BlockchainNodeAdapter(logger);
    await localNodeAlchemy.startNode();

    localNodeInfura = new BlockchainNodeAdapter(logger);
    await localNodeInfura.startNode();

    blockchainReader = new BlockchainReader(logger, [localNodeAlchemy, localNodeInfura]);
  });

  it('should load rules from rule JSON and iterate on them, invoke each one', async function() {
    configService.setRulesFromFile('./test/unit/data/dummy_rules.json');
    await configService.refreshConfig();

    const ruleFactory = new FactoryRule(logger, blockchainReader);
    const ruleEngine = new RuleEngine(logger, ruleFactory);

    ruleEngine.loadRulesFromJSONConfig(configService.getRules());
    const tx = await ruleEngine.evaluateRules();

    expect(tx).not.to.be.undefined;
    expect(tx.length).to.be.eq(2);
    expect(logger.getLatestInfoLogLine()).to.contain('I AM GROOT');
  });

  it('Should attach tx hash to all transactions', async function() {
    configService.setRulesFromFile('./test/unit/data/dummy_rules.json');
    await configService.refreshConfig();

    const ruleFactory = new FactoryRule(logger, blockchainReader);
    const ruleEngine = new RuleEngine(logger, ruleFactory);

    ruleEngine.loadRulesFromJSONConfig(configService.getRules());
    const tx = await ruleEngine.evaluateRules();

    expect(tx).not.to.be.undefined;
    expect(tx[0].hash).to.be.eq(Web3.utils.sha3(JSON.stringify(tx[0].lowLevelUnsignedTransaction)));
    expect(tx[1].hash).to.be.eq(Web3.utils.sha3(JSON.stringify(tx[1].lowLevelUnsignedTransaction)));
    expect(tx[0].hash).to.be.eq(tx[1].hash);
  });
});
