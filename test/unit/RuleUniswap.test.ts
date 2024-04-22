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
import DBService from '../../src/service/db/dbService';
import LeverageDataSourceDB from '../../src/rule_engine/tool/data_source/LeverageDataSourceDB';
import {ModulesParams} from '../../src/types/ModulesParams';

dotenv.config();

describe('Rule Factory Testings: Uniswap', function() {
  const modulesParams: ModulesParams = {};
  let ruleFactory: FactoryRule;

  beforeEach(async function() {
    modulesParams.configService = new ConfigServiceAWS('DemoApp', 'us-east-1');
    await modulesParams.configService.refreshConfig();

    modulesParams.logger = new LoggerAdapter();

    // Starting nodes
    modulesParams.mainNode = new BlockchainNodeAdapter(modulesParams, 'localNodeAlchemy');
    modulesParams.altNode = new BlockchainNodeAdapter(modulesParams, 'localNodeInfura');
    await Promise.all([modulesParams.mainNode.startNode(), modulesParams.altNode.startNode()]);

    modulesParams.blockchainReader = new BlockchainReader(modulesParams);
    modulesParams.dbService = new DBService(modulesParams.logger, modulesParams.configService);
    modulesParams.leverageDataSource = {
      leverageDataSourceDB: new LeverageDataSourceDB(modulesParams),
    };

    const abiStorage = new AbiStorageAdapter();
    const abiFetcher = new AbiFetcherAdapter();
    modulesParams.abiRepo = new AbiRepo(modulesParams, abiStorage, abiFetcher);

    ruleFactory = new FactoryRule(modulesParams);
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
