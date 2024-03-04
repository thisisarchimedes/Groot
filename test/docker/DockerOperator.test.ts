import { LocalNodeHardhat } from '../../src/blockchain_reader/LocalNodeHardhat';

import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

const { expect } = chai;

describe('Check that we able to launch and stop docker containers', function () {
  // eslint-disable-next-line no-invalid-this
  this.timeout(120000);

  it('should spin a new docker and read current block number directly from node', async function () {
    const localNode = new LocalNodeHardhat(8545, 'archimedes-node');

    await localNode.startNode();
    const blockNumber = await localNode.getBlockNumber();
    expect(blockNumber > 1934000n).to.be.true;

    await localNode.stopNode();
  });
});
