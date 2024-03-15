import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as dotenv from 'dotenv';

import {BlockchainLocalNodeContainer} from '../../src/blockchain/blockchain_nodes/BlockchainLocalNodeContainer';
import {BlockchainNodeError, BlockchainNodeProxyInfo} from '../../src/blockchain/blockchain_nodes/BlockchainNode';
import {LoggerAdapter} from '../unit/adapters/LoggerAdapter';

dotenv.config();
chai.use(chaiAsPromised);

const {expect} = chai;

describe('Check that we work with local Hardhat node correctly', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(120000);

  let localNode: BlockchainLocalNodeContainer;
  const logger: LoggerAdapter = new LoggerAdapter();

  beforeEach(async function() {
    localNode = new BlockchainLocalNodeContainer(logger, 8545, 'archimedes-node-alchemy');
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

  it('Should be able to recover node after getting invalid RPC', async function() {
    try {
      await localNode.resetNode('invalidRPCUrl');
      expect.fail('Expected resetNode to throw an error');
    } catch (error) {
      expect(error).to.be.instanceOf(BlockchainNodeError);
    }

    await localNode.recoverNode();
    const blockNumber = await localNode.getBlockNumber();
    expect(blockNumber > 1934000n).to.be.true;
  });

  it('Should be able to get implementation address out of proxy address', async function() {
    const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const res: BlockchainNodeProxyInfo = await localNode.getProxyInfoForAddress(USDC);
    expect(res.isProxy).to.be.true;
    expect(res.implementationAddress).to.contain('0x');
    expect(res.implementationAddress.length).to.be.equal(42);
  });

  it('Should be able to get detect none proxy address', async function() {
    const USDCImp = '0x43506849D7C04F9138D1A2050bbF3A0c054402dd';
    const res: BlockchainNodeProxyInfo = await localNode.getProxyInfoForAddress(USDCImp);
    expect(res.isProxy).to.be.false;
    expect(res.implementationAddress.length).to.be.equal(0);
  });
});
