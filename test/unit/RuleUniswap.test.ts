import {expect} from 'chai';

import {FactoryRule} from '../../src/rule_engine/FactoryRule';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {RuleJSONConfigItem, TypeRule} from '../../src/rule_engine/TypesRule';
import {BlockchainNodeAdapter} from './adapters/BlockchainNodeAdapter';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';

describe('Rule Factory Testings: Uniswap', function() {
  const logger: LoggerAdapter = new LoggerAdapter();
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

  it('should create Uniswap PSP rebalance Rule object from a rule config', function() {
    const ruleFactory = new FactoryRule(logger, blockchainReader);

    const dummyRule: RuleJSONConfigItem = {
      ruleType: TypeRule.UniswapPSPRebalance,
      label: 'Uniswap PSP rebalance - test',
      params: {
        upperTriggerThresholdPercentage: 70,
        lowerTriggerThresholdPercentage: 130,
        upperTargetTickPercentage: 150,
        lowerTargetTickPercentage: 50,
        strategyAddress: '0x1234',
      },
    };

    const rule = ruleFactory.createRule(dummyRule);
    expect(rule).not.to.be.null;
  });
});
