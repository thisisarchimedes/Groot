import 'reflect-metadata';
import * as chai from 'chai';
import {describe, it, beforeEach} from 'mocha';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';
import LeverageDataSourceNode from '../../src/rule_engine/tool/data_source/LeverageDataSourceNode';
import {LoggerConsole} from '../../src/service/logger/LoggerConsole';
import {BlockchainNodeLocal} from '../../src/blockchain/blockchain_nodes/BlockchainNodeLocal';
import 'dotenv/config';
import {PositionState} from '../../src/types/LeveragePosition';
import {ModulesParams} from '../../src/types/ModulesParams';

const {expect} = chai;

describe('LeverageDataSource Tests', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(60000);

  const modulesParams: ModulesParams = {};

  beforeEach(async function() {
    modulesParams.configService = new ConfigServiceAWS('StableApp', 'us-east-1');
    await modulesParams.configService.refreshConfig();

    // Setup Logger
    modulesParams.logger = new LoggerConsole();

    // Starting nodes
    modulesParams.mainNode = new BlockchainNodeLocal(
        modulesParams,
        `http://localhost:${process.env.MAIN_LOCAL_NODE_PORT || 8545}`,
        'localNodeAlchemy',
    );
    modulesParams.altNode = new BlockchainNodeLocal(
        modulesParams,
        `http://localhost:${process.env.ALT_LOCAL_NODE_PORT || 18545}`,
        'localNodeInfura',
    );
    await Promise.all([modulesParams.mainNode.startNode(), modulesParams.altNode.startNode()]);

    modulesParams.blockchainReader = new BlockchainReader(modulesParams);

    modulesParams.leverageDataSource = {
      leverageDataSourceNode: new LeverageDataSourceNode(modulesParams),
    };
  });

  it('Get all live positions for liquidation', async function() {
    const livePositions = await modulesParams.leverageDataSource!.leverageDataSourceNode!.getLivePositions();

    expect(livePositions).to.be.an('array');
    livePositions.forEach((position) => {
      expect(position.positionState).to.equal(PositionState.LIVE);
    });
  });
});
