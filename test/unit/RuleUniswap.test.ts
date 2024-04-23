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

  it('should calculate new upper and lower tick correctly when we are too close to upper tick', async function() {
    const currentTick = 170;
    const upperTargetTickPercentage = 150;
    const lowerTargetTickPercentage = 50;
    const tickSpacing = 15;
    const amount0 = parseUnits('10', 8);
    const amount1 = parseUnits('10', 18);

    await setupMockResponses(
        100,
        200,
        currentTick,
        tickSpacing,
        amount0,
        amount1,
    );
    const uniswapRule = createUniswapRule(
        upperTargetTickPercentage,
        lowerTargetTickPercentage,
    );

    const ruleFactory = createRuleFactory();
    const rule = ruleFactory.createRule(uniswapRule);

    const expectedNewUpperTick = calculateNewTick(
        currentTick,
        upperTargetTickPercentage,
        tickSpacing,
    );

    logger.lookForInfoLogLineContaining(
        `New upper tick: ${expectedNewUpperTick}`,
    );
    await rule?.evaluate();

    expect(logger.isExpectedLogLineInfoFound()).to.be.true;
  });

  it('should calculate new upper and lower tick correctly when we are too close to lower tick', async function() {
    const currentTick = 110;
    const upperTargetTickPercentage = 150;
    const lowerTargetTickPercentage = 50;
    const tickSpacing = 15;
    const amount0 = parseUnits('10', 8);
    const amount1 = parseUnits('10', 18);

    await setupMockResponses(
        100,
        200,
        currentTick,
        tickSpacing,
        amount0,
        amount1,
    );
    const uniswapRule = createUniswapRule(
        upperTargetTickPercentage,
        lowerTargetTickPercentage,
    );

    const ruleFactory = createRuleFactory();
    const rule = ruleFactory.createRule(uniswapRule);

    const expectedNewLowerTick = calculateNewTick(
        currentTick,
        lowerTargetTickPercentage,
        tickSpacing,
    );

    logger.lookForInfoLogLineContaining(
        `New lower tick: ${expectedNewLowerTick}`,
    );
    await rule?.evaluate();

    expect(logger.isExpectedLogLineInfoFound()).to.be.true;
  });

  it('should generate tx to update ticks', async function() {
    const currentTick = 110;
    const upperTargetTickPercentage = 150;
    const lowerTargetTickPercentage = 50;
    const tickSpacing = 15;
    const amount0 = parseUnits('10', 8);
    const amount1 = parseUnits('10', 18);

    await setupMockResponses(
        100,
        200,
        currentTick,
        tickSpacing,
        amount0,
        amount1,
    );
    const uniswapRule = createUniswapRule(
        upperTargetTickPercentage,
        lowerTargetTickPercentage,
    );

    const ruleFactory = createRuleFactory();
    const rule = ruleFactory.createRule(uniswapRule);

    await rule?.evaluate();
    expect(rule?.getPendingTransactionCount()).to.be.eq(1);

    const pendingTx =
      rule?.popTransactionFromRuleLocalQueue() as OutboundTransaction;
    expect(pendingTx).not.to.be.null;

    const upperTick = calculateNewTick(
        currentTick,
        upperTargetTickPercentage,
        tickSpacing,
    );
    const lowerTick = calculateNewTick(
        currentTick,
        lowerTargetTickPercentage,
        tickSpacing,
    );
    const ABI = ['function rebalance(int24,int24,uint256,uint256)'];
    const iFace = new ethers.Interface(ABI);
    const amountOut0Min = amount0 - (amount0 * BigInt(50)) / BigInt(10000);
    const amountOut1Min = amount1 - (amount1 * BigInt(50)) / BigInt(10000);
    const data = iFace.encodeFunctionData('rebalance', [
      lowerTick,
      upperTick,
      amountOut0Min,
      amountOut1Min,
    ]);

    expect(pendingTx.lowLevelUnsignedTransaction.data === data).to.be.true;
  });

  function createBlockchainNodeAdapter(
      name: string,
  ): BlockchainNodeUniswapAdapter {
    const adapter = new BlockchainNodeUniswapAdapter(logger, name);
    adapter.startNode();
    return adapter;
  }

  function createBlockchainReader(): BlockchainReader {
    return new BlockchainReader(logger, [localNodeAlchemy, localNodeInfura]);
  }

  function createAbiRepo(): AbiRepo {
    const environment = process.env.ENVIRONMENT as string;
    const region = process.env.AWS_REGION as string;
    const configService = new ConfigServiceAWS(environment, region);
    const abiStorage = new AbiStorageDynamoDB(
        configService.getDynamoDBAbiRepoTable(),
        configService.getAWSRegion(),
    );
    const abiFetcher = new AbiFetcherEtherscan(
        configService.getEtherscanAPIKey(),
    );
    return new AbiRepo(blockchainReader, abiStorage, abiFetcher);
  }

  function createRuleFactory(): FactoryRule {
    return new FactoryRule(logger, blockchainReader, abiRepo);
  }

  function createDummyRule(): RuleJSONConfigItem {
    return {
      ruleType: TypeRule.UniswapPSPRebalance,
      label: 'Uniswap PSP rebalance - test',
      params: {
        upperTriggerThresholdPercentage: 70,
        lowerTriggerThresholdPercentage: 130,
        upperTargetTickPercentage: 150,
        lowerTargetTickPercentage: 50,
        strategyAddress: '0x1234',
        slippagePercentage: BigInt(50),
      },
    };
  }

  function createUniswapRule(
      upperTargetTickPercentage = 150,
      lowerTargetTickPercentage = 50,
  ): RuleJSONConfigItem {
    return {
      ruleType: TypeRule.UniswapPSPRebalance,
      label: 'Uniswap PSP rebalance - test',
      params: {
        upperTriggerThresholdPercentage: 70,
        lowerTriggerThresholdPercentage: 130,
        upperTargetTickPercentage,
        lowerTargetTickPercentage,
        strategyAddress: '0x1234',
        slippagePercentage: BigInt(50),
      },
    };
  }

  async function setupMockResponses(
      lowerTick: number,
      upperTick: number,
      currentTick: number,
      tickSpacing = 15,
      amount0 = BigInt(0),
      amount1 = BigInt(0),
  ): Promise<void> {
    await localNodeAlchemy.setLowerTickResponse(lowerTick);
    await localNodeAlchemy.setUpperTickResponse(upperTick);
    await localNodeAlchemy.setCurrentTickResponse(currentTick);
    await localNodeAlchemy.setTickSpacingResponse(tickSpacing);
    await localNodeAlchemy.setCurrentPositionResponse(
        BigInt(0),
        amount0,
        amount1,
    );
  }

  function calculateNewTick(
      currentTick: number,
      targetTickPercentage: number,
      tickSpacing: number,
  ): number {
    let newTick = Number((currentTick * targetTickPercentage) / 100);
    newTick = Math.round(newTick / tickSpacing) * tickSpacing;
    return newTick;
  }
});
