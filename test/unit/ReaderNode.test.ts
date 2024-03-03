import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as dotenv from 'dotenv';

import {LocalHardhatNode, LocalHardhatNodeResetError} from '../../src/LocalHardhatNode';

dotenv.config();
chai.use(chaiAsPromised);

const {expect} = chai;

describe('Check that we work with local Hardhat node correctly', function() {
  this.timeout(120000);

  let localNode: LocalHardhatNode;

  beforeEach(async function() {
    localNode = new LocalHardhatNode(8545, 'archimedes-node:latest', 'archimedes-node-alchemy');
    await localNode.startNodeContainer();
    await localNode.waitForNodeToBeReady();
  });

  afterEach(async function() {
    await localNode.stopNodeContainer();
  });

  it('Should be able to reset node and point it to invalid RPC', async function() {
    try {
      await localNode.resetNode('invalidRPCUrl');
      expect.fail('Expected resetNode to throw an error');
    } catch (error) {
      expect(error).to.be.instanceOf(LocalHardhatNodeResetError);
    }
  });

  it('Should be able to reset node and point it to valid RPC', async function() {
    const alchemyRpcUrl: string = 'https://eth-mainnet.g.alchemy.com/v2/' + process.env.API_KEY_ALCHEMY;
    await resetAndVerify(alchemyRpcUrl);

    const infuraRpcUrl: string = 'https://mainnet.infura.io/v3/' + process.env.API_KEY_INFURA;
    await resetAndVerify(infuraRpcUrl);
  });

  async function resetAndVerify(rpcUrl: string) {
    await localNode.resetNode(rpcUrl);
    await localNode.waitForNodeToBeReady();

    const blockNumber = await localNode.getBlockNumber();
    expect(blockNumber > 1934000n).to.be.true;
  }
});
