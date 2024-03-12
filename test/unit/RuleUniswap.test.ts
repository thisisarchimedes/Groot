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

  it('should create Uniswap PSP rebalance Rule object from a rule config', async function() {
    const ruleFactory = new FactoryRule(logger, blockchainReader);

    const dummyRule: RuleJSONConfigItem = {
      ruleType: TypeRule.UniswapPSPRebalance,
      label: 'Uniswap PSP rebalance - test',
      params: {
        upperTriggerThresholdPercentage: 70, // trigger rebalance when we are more than (upperThreshold% * upper tick)
        lowerTriggerThresholdPercentage: 130, // trigger rebalance when we are less than (lowerThreshold% * lower tick)
        upperTargetTickPercentage: 150, // Where we want to be after rebalance currentUniswapTick * newUpperTickPercentage = newUpperTick
        lowerTargetTickPercentage: 50, // Where we want to be after rebalance currentUniswapTick * newLowerTickPercentage = newLowerTick
        strategyAddress: '0x1234',
      },
    };
    /// current tick 100 and upper tick is 150 and threshold is 30% so if current tick goes over 105 we rebalance 150
    /// 50 if lower tick,  30% is the lowerThreshold, then below 65 we rebalance 
    /// newUpperTick is currentTick * newUpperTickPercentage so if currentTick is 100 and newUpperTickPercentage is 150 then upperTick becomes 150
    const rule = ruleFactory.createRule(dummyRule);
    expect(rule).not.to.be.null;
  });
});
