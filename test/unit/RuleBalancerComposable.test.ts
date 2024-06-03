import 'reflect-metadata';
import {expect} from 'chai';
import * as dotenv from 'dotenv';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {
  Executor,
  RuleJSONConfigItem,
  TypeRule,
  UrgencyLevel,
} from '../../src/rule_engine/TypesRule';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';
import {AbiRepo} from '../../src/rule_engine/tool/abi_repository/AbiRepo';
import {RuleParamsBalancerComposablePSPAdjust} from '../../src/rule_engine/rule/RuleBalancerComposablePSPAdjust';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {FactoryRule} from '../../src/rule_engine/FactoryRule';
import {AbiStorageAdapter} from './adapters/AbiStorageAdapter';
import {AbiFetcherAdapter} from './adapters/AbiFetcherAdapter';
import DBService from '../../src/service/db/dbService';
import LeverageDataSourceDB from '../../src/rule_engine/tool/data_source/LeverageDataSourceDB';
import {ModulesParams} from '../../src/types/ModulesParams';
import {ethers, parseUnits} from 'ethers';
import {OutboundTransaction} from '../../src/blockchain/OutboundTransaction';
import {BlockchainNodeUniswapAdapter} from './adapters/BlockchainNodeUniswapAdapter';

dotenv.config();

describe('Rule Factory Testings: Balancer Composable PSP', function() {
  const modulesParams: ModulesParams = {};
  let ruleFactory: FactoryRule;
  // eslint-disable-next-line no-invalid-this
  this.timeout(25000);

  beforeEach(async function() {
    modulesParams.configService = new ConfigServiceAWS('DemoApp', 'us-east-1');
    await modulesParams.configService.refreshConfig();

    modulesParams.logger = new LoggerAdapter();

    // Starting nodes
    modulesParams.mainNode = new BlockchainNodeUniswapAdapter(
        modulesParams,
        'localNodeAlchemy',
    );
    modulesParams.altNode = new BlockchainNodeUniswapAdapter(
        modulesParams,
        'localNodeInfura',
    );
    await Promise.all([
      modulesParams.mainNode.startNode(),
      modulesParams.altNode.startNode(),
    ]);

    modulesParams.blockchainReader = new BlockchainReader(modulesParams);
    modulesParams.dbService = new DBService(
        modulesParams.logger,
        modulesParams.configService,
    );
    modulesParams.leverageDataSource = {
      leverageDataSourceDB: new LeverageDataSourceDB(modulesParams),
    };

    const abiStorage = new AbiStorageAdapter();
    const abiFetcher = new AbiFetcherAdapter();
    modulesParams.abiRepo = new AbiRepo(modulesParams, abiStorage, abiFetcher);

    ruleFactory = new FactoryRule(modulesParams);
  });

  it('should create Balancer PSP rebalance Rule object from a rule config', function() {
    const balancerRule = createBalancerComposablePSPRule();
    const rule = ruleFactory.createRule(balancerRule);

    expect(rule).not.to.be.null;
  });

  function createRuleFactory(): FactoryRule {
    return new FactoryRule(modulesParams);
  }

  function createBalancerComposablePSPRule(
      adjustInThreshold = BigInt(20000000000000),
      adjustOutThreshold = 35,
      lpSlippage = 20,
      hoursNeedsPassSinceLastAdjustOut = 24,
      hoursNeedsPassSinceLastAdjustIn = 24,
      adjustOutUnderlyingSlippage = 1,
      maximumPoolOwnershipRatio = 20,
      strategyAddress = '0x69209d1bF6A6612d34D03D16a332154A3131212a',
      adapterAddress = '0x0d6b5a54f940bf3d52e438cab785981aaefdf40c',
  ): RuleJSONConfigItem {
    const params: RuleParamsBalancerComposablePSPAdjust = {
      strategyAddress,
      adapterAddress,
      adjustInThreshold,
      adjustOutThreshold,
      lpSlippage,
      hoursNeedsPassSinceLastAdjustOut,
      hoursNeedsPassSinceLastAdjustIn,
      adjustOutUnderlyingSlippage,
      maximumPoolOwnershipRatio,
      ttlSeconds: 300,
      executor: Executor.LEVERAGE,
      urgencyLevel: UrgencyLevel.LOW,
    };
    return {
      ruleType: TypeRule.PSPBalancerComposableAdjust,
      label: 'Balancer PSP rebalance - test',
      params,
    };
  }
});
