import * as chai from 'chai';
import * as dotenv from 'dotenv';

import {BlockchainNodeRemoteRPC} from '../../src/blockchain/blockchain_nodes/BlockchainNodeRemoteRPC';
import {LoggerAdapter} from '../unit/adapters/LoggerAdapter';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';

dotenv.config();

const {expect} = chai;

describe('Check that we work with remote node correctly', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(120000);

  let remoteNode: BlockchainNodeRemoteRPC;
  let configService: ConfigServiceAWS;
  const logger = new LoggerAdapter();

  beforeEach(async function() {
    const environment = process.env.ENVIRONMENT as string;
    const region = process.env.AWS_REGION as string;
    configService = new ConfigServiceAWS(environment, region);
    await configService.refreshConfig();

    remoteNode = new BlockchainNodeRemoteRPC(logger, configService.getMainRPCURL(), 'demo-node');
    await remoteNode.startNode();
  });

  afterEach(async function() {
    await remoteNode.stopNode();
  });

  it('Should be able to point to demo RPC', async function() {
    const blockNumber = await remoteNode.getBlockNumber();
    expect(blockNumber > 1934000n).to.be.true;
  });
});
