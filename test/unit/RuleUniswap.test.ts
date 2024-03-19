import {expect} from 'chai';
import * as dotenv from 'dotenv';

import {FactoryRule} from '../../src/rule_engine/FactoryRule';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {RuleJSONConfigItem, TypeRule} from '../../src/rule_engine/TypesRule';
import {BlockchainNodeAdapter} from './adapters/BlockchainNodeAdapter';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';
import {AbiRepo} from '../../src/rule_engine/tool/abi_repository/AbiRepo';
import {AbiStorageDynamoDB} from '../../src/rule_engine/tool/abi_repository/AbiStorageDynamoDB';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {AbiFetcherEtherscan} from '../../src/rule_engine/tool/abi_repository/AbiFetcherEtherscan';
import {BlockchainNodeUniswapAdapter} from './adapters/BlockchainNodeUniswapAdapter';

dotenv.config();

describe('Rule Factory Testings: Uniswap', function() {
  const logger: LoggerAdapter = new LoggerAdapter();
  let localNodeAlchemy: BlockchainNodeUniswapAdapter;
  let localNodeInfura: BlockchainNodeUniswapAdapter;
  let blockchainReader: BlockchainReader;

  let abiRepo: AbiRepo;

  beforeEach(async function() {
    localNodeAlchemy = new BlockchainNodeUniswapAdapter(
        logger,
        'localNodeAlchemy',
    );
    await localNodeAlchemy.startNode();

    localNodeInfura = new BlockchainNodeUniswapAdapter(
        logger,
        'localNodeInfura',
    );
    await localNodeInfura.startNode();

    blockchainReader = new BlockchainReader(logger, [
      localNodeAlchemy,
      localNodeInfura,
    ]);

    const environment = process.env.ENVIRONMENT as string;
    const region = process.env.AWS_REGION as string;
    const configSerivce: ConfigServiceAWS = new ConfigServiceAWS(
        environment,
        region,
    );
    const abiStorage = new AbiStorageDynamoDB(
        configSerivce.getDynamoDBAbiRepoTable(),
        configSerivce.getAWSRegion(),
    );
    const abiFetcher = new AbiFetcherEtherscan(
        configSerivce.getEtherscanAPIKey(),
    );
    abiRepo = new AbiRepo(blockchainReader, abiStorage, abiFetcher);
  });

  it('should create Uniswap PSP rebalance Rule object from a rule config', function() {
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

  it('should create Uniswap PSP rebalance Rule and evaluate - do nothing when position is in place', function() {
    const ruleFactory = new FactoryRule(logger, blockchainReader, abiRepo);
    localNodeAlchemy.setLowerTickResponse(100);
    localNodeAlchemy.setUpperTickResponse(200);
    localNodeAlchemy.setCurrentTickResponse(150);
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
