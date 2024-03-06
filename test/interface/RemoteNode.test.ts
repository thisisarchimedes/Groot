import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as dotenv from 'dotenv';

import {BlockchainNodeRemoteRPC} from '../../src/blockchain/blockchain_nodes/BlockchainNodeRemoteRPC';
import { LoggerAdapter } from '../unit/adapters/LoggerAdapter';

dotenv.config();
chai.use(chaiAsPromised);

const {expect} = chai;

describe('Check that we work with remote node correctly', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(120000);

  let remoteNode: BlockchainNodeRemoteRPC;
  const logger: LoggerAdapter = new LoggerAdapter();

  beforeEach(async function() {
    remoteNode = new BlockchainNodeRemoteRPC(logger, 'http://ec2-52-4-114-208.compute-1.amazonaws.com:8545', 'demo-node');
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
