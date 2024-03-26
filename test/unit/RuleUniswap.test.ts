import 'reflect-metadata';
import { expect } from 'chai';
import * as dotenv from 'dotenv';
import { FactoryRule } from '../../src/rule_engine/FactoryRule';
import { LoggerAdapter } from './adapters/LoggerAdapter';
import { RuleJSONConfigItem, TypeRule } from '../../src/rule_engine/TypesRule';
import { BlockchainReader } from '../../src/blockchain/blockchain_reader/BlockchainReader';
import { AbiRepo } from '../../src/rule_engine/tool/abi_repository/AbiRepo';
import { TYPES } from '../../src/inversify.types';
import { createTestContainer } from './inversify.config.unit_test';
import { Container } from 'inversify';
import { BlockchainNodeAdapter } from './adapters/BlockchainNodeAdapter';

dotenv.config();

describe('Rule Factory Testings: Uniswap', function () {
  let container: Container;
  let logger: LoggerAdapter;
  let blockchainReader: BlockchainReader;
  let abiRepo: AbiRepo;

  beforeEach(async function () {
    container = createTestContainer();
    logger = container.get<LoggerAdapter>(TYPES.ILoggerAll);
    blockchainReader = container.get<BlockchainReader>(TYPES.IBlockchainReader);
    abiRepo = container.get<AbiRepo>(TYPES.IAbiRepo);

    const localNodeAlchemy = container.get<BlockchainNodeAdapter>(TYPES.BlockchainNodeLocalMain);
    const localNodeInfura = container.get<BlockchainNodeAdapter>(TYPES.BlockchainNodeLocalAlt);
    await Promise.all([localNodeAlchemy.startNode(), localNodeInfura.startNode()]);
  });

  it('should create Uniswap PSP rebalance Rule object from a rule config', function () {
    const ruleFactory = new FactoryRule(logger, blockchainReader, abiRepo);
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

  it('should create Uniswap PSP rebalance Rule and evaluate - do nothing when position is in place', function () {
    const ruleFactory = new FactoryRule(logger, blockchainReader, abiRepo);
    const uniswapRule: RuleJSONConfigItem = {
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
    const rule = ruleFactory.createRule(uniswapRule);
    expect(rule).not.to.be.null;
    rule?.evaluate();
    expect(rule?.getPendingTransactionCount()).to.be.eq(0);
  });
});
