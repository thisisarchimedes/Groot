import { expect } from 'chai';

import { LocalHardhatNode } from '../../src/LocalHardhatNode';

describe('Check that we work with local Hardhat node correctly', function () {
    it('should read current block number directly from node', function () {
        const rpc_url = 'http://localhost:8545';
        const localNode = new LocalHardhatNode(rpc_url);
        const blockNumber = localNode.getBlockNumber();
        expect(blockNumber).to.be.greaterThan(1934000);
    });
});
