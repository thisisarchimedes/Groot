import { LocalHardhatNode } from '../../src/LocalHardhatNode';

import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

const { expect } = chai;

describe('Check that we work with local Hardhat node correctly', function () {
    it('should fail connecting to RPC', async function () {
        const rpc_url = 'http://localhost:1234';
        const localNode = new LocalHardhatNode(rpc_url);

        await expect(localNode.getBlockNumber()).to.be.rejected;
    });

    it('should read current block number directly from node', async function () {
        const rpc_url = 'http://localhost:8545';
        const localNode = new LocalHardhatNode(rpc_url);
        const blockNumber = await localNode.getBlockNumber();
        expect(blockNumber > 1934000n).to.be.true;
    });
});
