import {expect} from 'chai';
import * as dotenv from 'dotenv';
import {ethers} from 'ethers';
import {FactoryRule} from '../../src/rule_engine/FactoryRule';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {RuleJSONConfigItem, TypeRule} from '../../src/rule_engine/TypesRule';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';
import {AbiRepo} from '../../src/rule_engine/tool/abi_repository/AbiRepo';
import {AbiStorageDynamoDB} from '../../src/rule_engine/tool/abi_repository/AbiStorageDynamoDB';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {AbiFetcherEtherscan} from '../../src/rule_engine/tool/abi_repository/AbiFetcherEtherscan';
import {BlockchainNodeUniswapAdapter} from './adapters/BlockchainNodeUniswapAdapter';
import {OutboundTransaction} from '../../src/blockchain/OutboundTransaction';

dotenv.config();

describe('Rule Factory Testings: Uniswap', function() {
  const logger: LoggerAdapter = new LoggerAdapter();
  let localNodeAlchemy: BlockchainNodeUniswapAdapter;
  let localNodeInfura: BlockchainNodeUniswapAdapter;
  let blockchainReader: BlockchainReader;
  let abiRepo: AbiRepo;

  beforeEach(function() {
    localNodeAlchemy = createBlockchainNodeAdapter('localNodeAlchemy');
    localNodeInfura = createBlockchainNodeAdapter('localNodeInfura');

    blockchainReader = createBlockchainReader();
    abiRepo = createAbiRepo();
  });

  it('should create Uniswap PSP rebalance Rule object from a rule config', function() {
    const ruleFactory = createRuleFactory();
    const dummyRule = createDummyRule();

    const rule = ruleFactory.createRule(dummyRule);

    expect(rule).not.to.be.null;
  });

  it('should create Uniswap PSP rebalance Rule and evaluate - do nothing when position is in place', async function() {
    const ruleFactory = createRuleFactory();
    await setupMockResponses(100, 200, 135);
    const uniswapRule = createUniswapRule();

    const rule = ruleFactory.createRule(uniswapRule);

    await rule?.evaluate();

    expect(rule?.getPendingTransactionCount()).to.be.eq(0);
  });

  it('should calculate new upper and lower tick correctly when we are too close to upper tick', async function() {
    const currentTick = 170;
    const upperTargetTickPercentage = 150;
    const lowerTargetTickPercentage = 50;
    const tickSpacing = 15;

    await setupMockResponses(100, 200, currentTick, tickSpacing);
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

    await setupMockResponses(100, 200, currentTick, tickSpacing);
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

    await setupMockResponses(100, 200, currentTick, tickSpacing);
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
    const data = iFace.encodeFunctionData('rebalance', [
      lowerTick,
      upperTick,
      BigInt(0),
      BigInt(0),
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
      },
    };
  }

  async function setupMockResponses(
      lowerTick: number,
      upperTick: number,
      currentTick: number,
      tickSpacing = 15,
  ): Promise<void> {
    await localNodeAlchemy.setLowerTickResponse(lowerTick);
    await localNodeAlchemy.setUpperTickResponse(upperTick);
    await localNodeAlchemy.setCurrentTickResponse(currentTick);
    await localNodeAlchemy.setTickSpacingResponse(tickSpacing);
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
