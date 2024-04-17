import 'reflect-metadata';
import * as chai from 'chai';
import * as dotenv from 'dotenv';
import {spawn} from 'child_process';
import {BlockchainNodeProxyInfo} from '../../src/blockchain/blockchain_nodes/BlockchainNodeProxyInfo';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {BlockchainNodeLocal} from '../../src/blockchain/blockchain_nodes/BlockchainNodeLocal';
import {LoggerAll} from '../../src/service/logger/LoggerAll';

dotenv.config();
const {expect} = chai;

describe('Check that we work with local Hardhat node correctly', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(120000);

  let localNode: BlockchainNodeLocal;

  before(function() {
    spawn('./scripts/container_reader_node/run_nodes_containers_locally.sh', [], {
      shell: true,
    });
  });

  beforeEach(async function() {
    const configService = await createConfigService();
    await initializeConfigService(configService);
    const logger = new LoggerAll(configService);

    localNode = new BlockchainNodeLocal(
        logger,
        `http://localhost:${process.env.MAIN_LOCAL_NODE_PORT || 8545}`,
        'AlchemyNodeLabel',
    );
    await localNode.startNode();
  });

  afterEach(async function() {
    await localNode.stopNode();
  });

  it('mock test', function() {
    expect(true).to.be.true;
  });

  it('Should be able to reset node and point it to valid RPC', async function() {
    console.log('Starting reset test - MAKE SURE THERE IS LOCAL NODE RUNNING AND ACCESSABLE');
    const alchemyRpcUrl: string = 'https://eth-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY;
    await resetAndVerify(alchemyRpcUrl);
    const infuraRpcUrl: string = 'https://mainnet.infura.io/v3/' + process.env.INFURA_API_KEY;
    await resetAndVerify(infuraRpcUrl);
  });

  async function resetAndVerify(rpcUrl: string) {
    await localNode.resetNode(rpcUrl);
    const blockNumber = await localNode.getBlockNumber();
    expect(blockNumber > 1934000n).to.be.true;
  }

  it('Should be able to invoke arbitrary view on-chain method', async function() {
    // eslint-disable-next-line max-len
    const abi = [{'inputs': [], 'name': 'decimals', 'outputs': [{'internalType': 'uint8', 'name': '', 'type': 'uint8'}], 'stateMutability': 'view', 'type': 'function'}];
    const usdcContractAddress: string = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const res = Number(await localNode.callViewFunction(usdcContractAddress, JSON.stringify(abi), 'decimals'));
    expect(res).to.be.equal(6);
  });

  it('Should be able to get implementation address out of proxy address', async function() {
    const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const res: BlockchainNodeProxyInfo = await localNode.getProxyInfoForAddress(USDC);
    expect(res.isProxy).to.be.true;
    expect(res.implementationAddress).to.contain('0x');
    expect(res.implementationAddress.length).to.be.equal(42);
  });

  it('Should be able to detect non-proxy address', async function() {
    const USDCImp = '0x43506849D7C04F9138D1A2050bbF3A0c054402dd';
    const res: BlockchainNodeProxyInfo = await localNode.getProxyInfoForAddress(USDCImp);
    expect(res.isProxy).to.be.false;
    expect(res.implementationAddress.length).to.be.equal(0);
  });

  async function createConfigService(): Promise<ConfigServiceAWS> {
    const environment = process.env.ENVIRONMENT as string;
    const region = process.env.AWS_REGION as string;
    const configServiceAWS = new ConfigServiceAWS(environment, region);
    await configServiceAWS.refreshConfig();
    return configServiceAWS;
  }

  async function initializeConfigService(configService: ConfigServiceAWS): Promise<void> {
    await configService.refreshConfig();
  }
});
