import { LocalHardhatNode } from '../../src/LocalHardhatNode';

import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

const { expect } = chai;

describe('Check that we work with local Hardhat node correctly', function () {
    let localNode: LocalHardhatNode;

    before(async function () {
        this.timeout(120000);

        localNode = new LocalHardhatNode(8545, 'archimedes-node:latest', 'archimedes-node-alchemy');
        await localNode.startNodeContainer();
        await localNode.waitForNodeToBeReady();
    });

    after(async function () {
        this.timeout(120000);
        await localNode.stopNodeContainer();
    });

    it('Should be able to reset node and point it to invalid RPC', async function () {
        this.timeout(120000);

        try {
            // Attempt to reset the node, expecting an error
            await localNode.resetNode('invalidRPCUrl');
            
            // If the above line does not throw, force the test to fail
            expect.fail('Expected resetNode to throw an error');
        } catch (error) {
            console.log(error.message);
            // Assert that the error message is as expected
            expect(error.message).to.include('RPC Error');
        }
        //await expect (localNode.resetNode('http://localhost:1234')).to.be.rejected;
        //await localNode.waitForNodeToBeReady();
        //await expect(localNode.getBlockNumber()).to.be.rejected;
    });
});
