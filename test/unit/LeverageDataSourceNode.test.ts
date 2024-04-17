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

const {expect} = chai;

describe('LeverageDataSource Tests', function() {
  let loggerAdapter: LoggerAdapter;
  let dataSource: LeverageDataSourceNode;
  let localNodeAlchemy: BlockchainNodeAdapter;
  let localNodeInfura: BlockchainNodeAdapter;
  let blockchainReader: BlockchainReader;

  beforeEach(async function() {
    const configService = new ConfigServiceAWS('DemoApp', 'us-east-1');
    await configService.refreshConfig();

    // Setup LoggerAdapter
    loggerAdapter = new LoggerAdapter();

    // Starting nodes
    localNodeAlchemy = new BlockchainNodeAdapter(loggerAdapter, 'localNodeAlchemy');
    localNodeInfura = new BlockchainNodeAdapter(loggerAdapter, 'localNodeInfura');
    await Promise.all([localNodeAlchemy.startNode(), localNodeInfura.startNode()]);
    blockchainReader = new BlockchainReader(loggerAdapter, localNodeAlchemy, localNodeInfura);

    localNodeAlchemy.setProxyInfoForAddressResponse({
      isProxy: true, implementationAddress: '0x2e8d2f9b031b58ff07c4b84a33eee86b978974cc'});
    localNodeInfura.setProxyInfoForAddressResponse({
      isProxy: true, implementationAddress: '0x2e8d2f9b031b58ff07c4b84a33eee86b978974cc'});

    const abiStorage = new AbiStorageDynamoDB(configService);
    const abiFetcher = new AbiFetcherEtherscan(configService);
    const abiRepo = new AbiRepo(blockchainReader, abiStorage, abiFetcher);

    dataSource = new LeverageDataSourceNode(loggerAdapter, configService, blockchainReader, abiRepo);
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

    localNodeAlchemy.setReadResponse(nodeLivePositionResponse);
    localNodeInfura.setReadResponse(nodeLivePositionResponse);

    const livePositions = await dataSource.getLivePositions(3);

    expect(livePositions).to.be.deep.equal([
      expectedLivePositionStruct,
      {...expectedLivePositionStruct, nftId: 1},
      {...expectedLivePositionStruct, nftId: 2},
    ]);
  });
});
