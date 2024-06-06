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
import {ethers, parseEther, parseUnits} from 'ethers';
import {OutboundTransaction} from '../../src/blockchain/OutboundTransaction';
import {BlockchainNodeBalancerComposableAdapter} from './adapters/BlockchainNodeBalancerComposableAdapter';

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
    modulesParams.mainNode = new BlockchainNodeBalancerComposableAdapter(
        modulesParams,
        'localNodeAlchemy',
    );
    modulesParams.altNode = new BlockchainNodeBalancerComposableAdapter(
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

  it('should check if adjustout threshold passed', async function() {
    // 2 days ago in secodns timestamp
    const lastAdjustTime = BigInt(Math.floor(Date.now() / 1000 - 172800));
    setupMockResponses(lastAdjustTime, lastAdjustTime, [
      BigInt(0),
      parseEther('50'),
      parseEther('10'),
    ]);
    const balancerRule = createBalancerComposablePSPRule();

    const ruleFactory = createRuleFactory();
    const rule = ruleFactory.createRule(balancerRule);

    (modulesParams.logger as LoggerAdapter).lookForInfoLogLineContaining(
        `Adjust Out Threshold Passed: ${true}`,
    );
    await rule?.evaluate();

    expect((modulesParams.logger as LoggerAdapter).isExpectedLogLineInfoFound())
        .to.be.true;
  });

  it('should check if ownership threshold passed', async function() {
    const lastAdjustTime = BigInt(Math.floor(Date.now() / 1000 - 172800));
    setupMockResponses(lastAdjustTime, lastAdjustTime, [
      BigInt(0),
      parseEther('50'),
      parseEther('50'),
    ]);
    const balancerRule = createBalancerComposablePSPRule();

    const ruleFactory = createRuleFactory();
    const rule = ruleFactory.createRule(balancerRule);

    (modulesParams.logger as LoggerAdapter).lookForInfoLogLineContaining(
        `Max Pool Ownership Ratio Passed: ${true}`,
    );
    await rule?.evaluate();

    expect((modulesParams.logger as LoggerAdapter).isExpectedLogLineInfoFound())
        .to.be.true;
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

  function setupMockResponses(
      lastAdjustInTime: bigint,
      lastAdjustOutTime: bigint,
      balances: bigint[] = [BigInt(0), parseEther('100'), parseEther('100')],
      underlyingBalance = parseEther('50'),
      poolTokens: string[] = [
        '0x596192bB6e41802428Ac943D2f1476C1Af25CC0E',
        '0xbf5495Efe5DB9ce00f80364C8B423567e58d2110',
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      ],
      lastChangeBlock: bigint = BigInt(0),
      poolId = '0x596192bb6e41802428ac943d2f1476c1af25cc0e000000000000000000000659',
      pool = '0x596192bb6e41802428ac943d2f1476c1af25cc0e',
      underlyingToken = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  ) {
    (
      modulesParams.mainNode as BlockchainNodeBalancerComposableAdapter
    ).setLastAdjustInTimestampResponse(lastAdjustInTime);
    (
      modulesParams.mainNode as BlockchainNodeBalancerComposableAdapter
    ).setLastAdjustOutTimestampResponse(lastAdjustOutTime);
    (
      modulesParams.mainNode as BlockchainNodeBalancerComposableAdapter
    ).setPoolTokensResponse(poolTokens, balances, lastChangeBlock);
    (
      modulesParams.mainNode as BlockchainNodeBalancerComposableAdapter
    ).setPoolIdResponse(poolId);
    (
      modulesParams.mainNode as BlockchainNodeBalancerComposableAdapter
    ).setPoolResponse(pool);
    (
      modulesParams.mainNode as BlockchainNodeBalancerComposableAdapter
    ).setUnderlyingTokenResponse(underlyingToken);
    (
      modulesParams.mainNode as BlockchainNodeBalancerComposableAdapter
    ).setAdapterUnderlyingBalanceResponse(underlyingBalance);
  }
});
