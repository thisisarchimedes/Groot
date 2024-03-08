import {expect} from 'chai';

import {FactoryRule} from '../../src/rule_engine/FactoryRule';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {RuleJSONConfigItem, TypeRule} from '../../src/rule_engine/TypesRule';
import {RuleParams} from '../../src/rule_engine/rule/Rule';
import {BlockchainNodeAdapter} from './adapters/BlockchainNodeAdapter';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';

describe('Rule Factory Testings', function() {
  const logger: LoggerAdapter = new LoggerAdapter();
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

  it('should create Rule object from a dummy rule config', async function() {
    const ruleFactory = new FactoryRule(logger, blockchainReader);


    const dummyRule: RuleJSONConfigItem = {
      ruleType: TypeRule.Dummy,
      params: {
        message: 'I AM GROOT',
      },
    };

    const rule = ruleFactory.createRule(dummyRule.ruleType, dummyRule.params as RuleParams);
    expect(rule).not.to.be.undefined;
    if (rule) {
      await rule.evaluate();
    }
    expect(logger.getLatestInfoLogLine()).to.contain('I AM GROOT');
  });
});
