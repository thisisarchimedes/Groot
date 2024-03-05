import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as dotenv from 'dotenv';

import {BlockchainNodeLocalHardhat} from '../../src/blockchain_nodes/BlockchainNodeLocalHardhat';
import {BlockchainNodeError} from '../../src/blockchain_nodes/BlockchainNode';

dotenv.config();
chai.use(chaiAsPromised);

const {expect} = chai;

describe('Check that we work with local Hardhat node correctly', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(120000);

  let localNode: BlockchainNodeLocalHardhat;

  beforeEach(async function() {
    localNode = new BlockchainNodeLocalHardhat(8545, 'archimedes-node-alchemy');
    await localNode.startNode();
  });

  afterEach(async function() {
    await localNode.stopNode();
  });

  it('Should be able to reset node and point it to invalid RPC', async function() {
    try {
      await localNode.resetNode('invalidRPCUrl');
      expect.fail('Expected resetNode to throw an error');
    } catch (error) {
      expect(error).to.be.instanceOf(BlockchainNodeError);
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

    const blockNumber = await localNode.getBlockNumber();
    expect(blockNumber > 1934000n).to.be.true;
  }

  it('Should be able to invoke aribtrary view on-chain method', async function() {
    // eslint-disable-next-line max-len
    const abi = [{'inputs': [], 'name': 'decimals', 'outputs': [{'internalType': 'uint8', 'name': '', 'type': 'uint8'}], 'stateMutability': 'view', 'type': 'function'}];
    const usdcContractAddress: string = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

    const res = Number(await localNode.callViewFunction(usdcContractAddress, abi, 'decimals'));

    expect(res).to.be.equal(6);
  });
});
