import {BlockchainNodeLocalHardhat} from '../../src/blockchain/blockchain_nodes/BlockchainNodeLocalHardhat';

import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {LoggerAdapter} from '../unit/adapters/LoggerAdapter';

chai.use(chaiAsPromised);

const {expect} = chai;

describe('Check that we able to launch and stop docker containers', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(120000);

  const logger: LoggerAdapter = new LoggerAdapter();

  it('should spin a new docker and read current block number directly from node', async function() {
    const localNode = new BlockchainNodeLocalHardhat(logger, 8545, 'archimedes-node');

    await localNode.startNode();
    const blockNumber = await localNode.getBlockNumber();
    expect(blockNumber > 1934000n).to.be.true;

    await localNode.stopNode();
  });
});
