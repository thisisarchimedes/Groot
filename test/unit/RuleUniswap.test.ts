import 'reflect-metadata';
import {expect} from 'chai';
import * as dotenv from 'dotenv';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {Executor, RuleJSONConfigItem, TypeRule, UrgencyLevel} from '../../src/rule_engine/TypesRule';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';
import {AbiRepo} from '../../src/rule_engine/tool/abi_repository/AbiRepo';
import {BlockchainNodeAdapter} from './adapters/BlockchainNodeAdapter';
import {RuleParamsUniswapPSPRebalance} from '../../src/rule_engine/rule/RuleUniswapPSPRebalance';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {FactoryRule} from '../../src/rule_engine/FactoryRule';
import {AbiStorageAdapter} from './adapters/AbiStorageAdapter';
import {AbiFetcherAdapter} from './adapters/AbiFetcherAdapter';

dotenv.config();

describe('Rule Factory Testings: Uniswap', function() {
  let abiRepo: AbiRepo;
  let logger: LoggerAdapter;
  let blockchainReader: BlockchainReader;
  let localNodeAlchemy: BlockchainNodeAdapter;
  let localNodeInfura: BlockchainNodeAdapter;
  let ruleFactory: FactoryRule;

  beforeEach(async function() {
    const configService = new ConfigServiceAWS('DemoApp', 'us-east-1');
    await configService.refreshConfig();

    logger = new LoggerAdapter();

    // Starting nodes
    localNodeAlchemy = new BlockchainNodeAdapter(logger, 'localNodeAlchemy');
    localNodeInfura = new BlockchainNodeAdapter(logger, 'localNodeInfura');
    await Promise.all([localNodeAlchemy.startNode(), localNodeInfura.startNode()]);

    blockchainReader = new BlockchainReader(logger, localNodeAlchemy, localNodeInfura);

    const abiStorage = new AbiStorageAdapter();
    const abiFetcher = new AbiFetcherAdapter();
    abiRepo = new AbiRepo(blockchainReader, abiStorage, abiFetcher);

    ruleFactory = new FactoryRule(logger, configService, blockchainReader, abiRepo);
  });

  it('should create Uniswap PSP rebalance Rule object from a rule config', function() {
    const dummyRule: RuleJSONConfigItem = {
      ruleType: TypeRule.UniswapPSPRebalance,
      label: 'Uniswap PSP rebalance - test',
      params: {
        upperTriggerThresholdPercentage: 70,
        lowerTriggerThresholdPercentage: 130,
        upperTargetTickPercentage: 150,
        lowerTargetTickPercentage: 50,
        strategyAddress: '0x1234',
        ttlSeconds: 300,
        executor: Executor.LEVERAGE,
        urgencyLevel: UrgencyLevel.LOW,
      } as RuleParamsUniswapPSPRebalance,
    };
    const rule = ruleFactory.createRule(dummyRule);
    expect(rule).not.to.be.null;
  });

  it('should create Uniswap PSP rebalance Rule and evaluate - do nothing when position is in place', async function() {
    const uniswapRule: RuleJSONConfigItem = {
      ruleType: TypeRule.UniswapPSPRebalance,
      label: 'Uniswap PSP rebalance - test',
      params: {
        upperTriggerThresholdPercentage: 70,
        lowerTriggerThresholdPercentage: 130,
        upperTargetTickPercentage: 150,
        lowerTargetTickPercentage: 50,
        strategyAddress: '0x1234',
        ttlSeconds: 300,
        executor: Executor.LEVERAGE,
        urgencyLevel: UrgencyLevel.LOW,
      } as RuleParamsUniswapPSPRebalance,
    };
    const rule = await ruleFactory.createRule(uniswapRule);
    expect(rule).not.to.be.null;
    rule?.evaluate();
    expect(rule?.getPendingTransactionCount()).to.be.eq(0);
  });
});
