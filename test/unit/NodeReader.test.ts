import {LocalHardhatNode} from '../../src/LocalHardhatNode';

import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

const {expect} = chai;

describe('Check that we work with local Hardhat node correctly', function() {
  it('should fail connecting to RPC', async function() {
    const localNode = new LocalHardhatNode(1234, 'invalid-container', 'invalid-container');
    await expect(localNode.getBlockNumber()).to.be.rejected;
  });

  it('should spin a new docker and read current block number directly from node', async function() {
    this.timeout(120000);

    const localNode = new LocalHardhatNode(8545, 'archimedes-node:latest', 'archimedes-node-alchemy');
    await localNode.startNodeContainer();
    await localNode.waitForContainerToBeReady();
    const blockNumber = await localNode.getBlockNumber();
    expect(blockNumber > 1934000n).to.be.true;
  });
});
