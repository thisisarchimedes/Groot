import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as dotenv from 'dotenv';

import {BlockchainNodeLocalContainer} from '../../src/blockchain/blockchain_nodes/BlockchainNodeLocalContainer';
import {BlockchainNodeError} from '../../src/blockchain/blockchain_nodes/BlockchainNode';
import {LoggerAdapter} from '../unit/adapters/LoggerAdapter';

dotenv.config();
chai.use(chaiAsPromised);

const {expect} = chai;

describe('Check that we work with local Hardhat node w/container correctly', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(120000);

  let localNodeContainer: BlockchainNodeLocalContainer;
  const logger: LoggerAdapter = new LoggerAdapter();

  beforeEach(async function() {
    localNodeContainer = new BlockchainNodeLocalContainer(logger, 9545, 'archimedes-node-alchemy');
    await localNodeContainer.startNode();
  });

  afterEach(async function() {
    await localNodeContainer.stopNode();
  });

  it('Should be able to reset node and point it to invalid RPC', async function() {
    try {
      await localNodeContainer.resetNode('invalidRPCUrl');
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
    await localNodeContainer.resetNode(rpcUrl);

    const blockNumber = await localNodeContainer.getBlockNumber();
    expect(blockNumber > 1934000n).to.be.true;
  }

  it('Should be able to invoke aribtrary view on-chain method', async function() {
    // eslint-disable-next-line max-len
    const abi = [{'inputs': [], 'name': 'decimals', 'outputs': [{'internalType': 'uint8', 'name': '', 'type': 'uint8'}], 'stateMutability': 'view', 'type': 'function'}];
    const usdcContractAddress: string = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

    const res = Number(await localNodeContainer.callViewFunction(usdcContractAddress, abi, 'decimals'));

    expect(res).to.be.equal(6);
  });

  it('Should be able to recover node after getting invalid RPC', async function() {
    try {
      await localNodeContainer.resetNode('invalidRPCUrl');
      expect.fail('Expected resetNode to throw an error');
    } catch (error) {
      expect(error).to.be.instanceOf(BlockchainNodeError);
    }

    await localNodeContainer.recoverNode();
    const blockNumber = await localNodeContainer.getBlockNumber();
    expect(blockNumber > 1934000n).to.be.true;
  });
});
