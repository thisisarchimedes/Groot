import 'reflect-metadata';
import * as chai from 'chai';
import {describe, it, beforeEach} from 'mocha';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';
import {BlockchainNodeAdapter} from './adapters/BlockchainNodeAdapter';
import LeverageDataSourceNode, {LedgerEntry} from '../../src/rule_engine/tool/data_source/LeverageDataSourceNode';
import {AbiRepo} from '../../src/rule_engine/tool/abi_repository/AbiRepo';
import {AbiFetcherEtherscan} from '../../src/rule_engine/tool/abi_repository/AbiFetcherEtherscan';
import {AbiStorageDynamoDB} from '../../src/rule_engine/tool/abi_repository/AbiStorageDynamoDB';
import LeveragePosition, {PositionState} from '../../src/types/LeveragePosition';
import {ModulesParams} from '../../src/types/ModulesParams';

const {expect} = chai;

describe('LeverageDataSourceNode Tests', function() {
  const modulesParams: ModulesParams = {};

  beforeEach(async function() {
    modulesParams.configService = new ConfigServiceAWS('DemoApp', 'us-east-1');
    await modulesParams.configService.refreshConfig();

    // Setup LoggerAdapter
    modulesParams.logger = new LoggerAdapter();

    // Starting nodes
    modulesParams.mainNode = new BlockchainNodeAdapter(modulesParams, 'localNodeAlchemy');
    modulesParams.altNode = new BlockchainNodeAdapter(modulesParams, 'localNodeInfura');
    await Promise.all([modulesParams.mainNode.startNode(), modulesParams.altNode.startNode()]);
    modulesParams.blockchainReader = new BlockchainReader(modulesParams);

    (modulesParams.mainNode as BlockchainNodeAdapter).setProxyInfoForAddressResponse({
      isProxy: true, implementationAddress: '0x2e8d2f9b031b58ff07c4b84a33eee86b978974cc'});
    (modulesParams.altNode as BlockchainNodeAdapter).setProxyInfoForAddressResponse({
      isProxy: true, implementationAddress: '0x2e8d2f9b031b58ff07c4b84a33eee86b978974cc'});

    const abiStorage = new AbiStorageDynamoDB(modulesParams);
    const abiFetcher = new AbiFetcherEtherscan(modulesParams);
    modulesParams.abiRepo = new AbiRepo(modulesParams, abiStorage, abiFetcher);

    modulesParams.leverageDataSource = {
      leverageDataSourceNode: new LeverageDataSourceNode(modulesParams),
    };
  });

  it('Get all live positions for liquidation', async function() {
    const nodeLivePositionResponse: LedgerEntry = {
      wbtcDebtAmount: 10000n,
      strategyAddress: '0x7694Cd972Baa64018e5c6389740832e4C7f2Ce9a',
      strategyShares: 20087n,
      positionOpenBlock: 19568844n,
      positionExpirationBlock: 19785444n,
      state: BigInt(PositionState.LIVE),
      liquidationBuffer: 105000000n,
      collateralAmount: 10000n,
      claimableAmount: 0n,
    };

    const expectedLivePositionStruct: LeveragePosition = {
      nftId: 0,
      debtAmount: 10000,
      strategyShares: 20087,
      strategy: '0x7694Cd972Baa64018e5c6389740832e4C7f2Ce9a',
      blockNumber: 19568844,
      positionExpireBlock: 19785444,
      positionState: PositionState.LIVE,
      collateralAmount: 10000,
      claimableAmount: 0,
    };

    (modulesParams.mainNode as BlockchainNodeAdapter).setReadResponse(nodeLivePositionResponse);
    (modulesParams.altNode as BlockchainNodeAdapter).setReadResponse(nodeLivePositionResponse);
    (modulesParams.mainNode as BlockchainNodeAdapter).setResponseLimit(3);
    (modulesParams.altNode as BlockchainNodeAdapter).setResponseLimit(3);
    (modulesParams.mainNode as BlockchainNodeAdapter).setResponseForOverlimit({state: PositionState.UNINITIALIZED});
    (modulesParams.altNode as BlockchainNodeAdapter).setResponseForOverlimit({state: PositionState.UNINITIALIZED});

    const livePositions = await modulesParams.leverageDataSource!.leverageDataSourceNode!.getLivePositions();

    expect(livePositions).to.be.deep.equal([
      expectedLivePositionStruct,
      {...expectedLivePositionStruct, nftId: 1},
      {...expectedLivePositionStruct, nftId: 2},
    ]);
  });
});
