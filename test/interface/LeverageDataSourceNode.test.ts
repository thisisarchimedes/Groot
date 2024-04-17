import 'reflect-metadata';
import * as chai from 'chai';
import {describe, it, beforeEach} from 'mocha';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';
import LeverageDataSourceNode from '../../src/rule_engine/tool/data_source/LeverageDataSourceNode';
import {AbiRepo} from '../../src/rule_engine/tool/abi_repository/AbiRepo';
import {AbiFetcherEtherscan} from '../../src/rule_engine/tool/abi_repository/AbiFetcherEtherscan';
import {AbiStorageDynamoDB} from '../../src/rule_engine/tool/abi_repository/AbiStorageDynamoDB';
import {LoggerConsole} from '../../src/service/logger/LoggerConsole';
import {BlockchainNodeLocal} from '../../src/blockchain/blockchain_nodes/BlockchainNodeLocal';
import 'dotenv/config';
import {PositionState} from '../../src/types/LeveragePosition';

const {expect} = chai;

describe('LeverageDataSource Tests', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(60000);

  let logger: LoggerConsole;
  let dataSource: LeverageDataSourceNode;
  let localNodeAlchemy: BlockchainNodeLocal;
  let localNodeInfura: BlockchainNodeLocal;
  let blockchainReader: BlockchainReader;

  beforeEach(async function() {
    const configService = new ConfigServiceAWS('StableApp', 'us-east-1');
    await configService.refreshConfig();

    // Setup Logger
    logger = new LoggerConsole();

    // Starting nodes
    localNodeAlchemy = new BlockchainNodeLocal(
        logger,
        `http://localhost:${process.env.MAIN_LOCAL_NODE_PORT || 8545}`,
        'localNodeAlchemy',
    );
    localNodeInfura = new BlockchainNodeLocal(
        logger,
        `http://localhost:${process.env.ALT_LOCAL_NODE_PORT || 18545}`,
        'localNodeInfura',
    );
    await Promise.all([localNodeAlchemy.startNode(), localNodeInfura.startNode()]);

    blockchainReader = new BlockchainReader(logger, localNodeAlchemy, localNodeInfura);
    const abiStorage = new AbiStorageDynamoDB(configService);
    const abiFetcher = new AbiFetcherEtherscan(configService);
    const abiRepo = new AbiRepo(blockchainReader, abiStorage, abiFetcher);

    dataSource = new LeverageDataSourceNode(logger, configService, blockchainReader, abiRepo);
  });

  it('Get all live positions for liquidation', async function() {
    const livePositions = await dataSource.getLivePositions();

    expect(livePositions).to.be.an('array').that.is.not.empty;
    livePositions.forEach((position) => {
      expect(position.positionState).to.equal(PositionState.LIVE);
    });
  });
});
