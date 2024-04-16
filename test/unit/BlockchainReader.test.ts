import 'reflect-metadata';
import * as chai from 'chai';
import {BlockchainReader, BlockchainReaderError} from '../../src/blockchain/blockchain_reader/BlockchainReader';
import {BlockchainNodeAdapter} from './adapters/BlockchainNodeAdapter';
import {ethers} from 'ethers';
import {LoggerAll} from '../../src/service/logger/LoggerAll';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';

const {expect} = chai;

describe('Check that blockchain reader works with multiple underlying nodes', function() {
  let localNodeAlchemy: BlockchainNodeAdapter;
  let localNodeInfura: BlockchainNodeAdapter;
  let blockchainReader: BlockchainReader;

  beforeEach(async function() {
    const configService = new ConfigServiceAWS('DemoApp', 'us-east-1');
    await configService.refreshConfig();

    const logger = new LoggerAll(configService);

    // Starting nodes
    localNodeAlchemy = new BlockchainNodeAdapter(logger, 'localNodeAlchemy');
    localNodeInfura = new BlockchainNodeAdapter(logger, 'localNodeInfura');

    blockchainReader = new BlockchainReader(logger, localNodeAlchemy, localNodeInfura);

    return Promise.all([localNodeAlchemy.startNode(), localNodeInfura.startNode()]);
  });

  afterEach(function() {
    return Promise.all([localNodeAlchemy.stopNode(), localNodeInfura.stopNode()]);
  });

  it('Should be able to load two nodes and get most recent block number', async function() {
    const blockNumberAlchemy: number = 19364429;
    const blockNumberInfura: number = 19364430;

    localNodeAlchemy.setBlockNumber(blockNumberAlchemy);
    localNodeInfura.setBlockNumber(blockNumberInfura);

    const blockNumber = await blockchainReader.getBlockNumber();
    expect(blockNumber).to.be.a('number');
    expect(blockNumber).to.be.eq(Math.max(blockNumberAlchemy, blockNumberInfura));
  });

  it('Should be able to facilitate read call, decide which node to use, when both response', async function() {
    const blockNumberAlchemy: number = 19364429;
    localNodeAlchemy.setBlockNumber(blockNumberAlchemy);
    localNodeAlchemy.setReadResponse('1');

    const blockNumberInfura: number = 19364430;
    localNodeInfura.setBlockNumber(blockNumberInfura);
    localNodeInfura.setReadResponse('2');

    const usdcContractAddress: string = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const abi = getStubAbi();
    const res = Number(await blockchainReader.callViewFunction(usdcContractAddress,
        new ethers.Interface(abi), 'decimals'));

    expect(res).to.be.eq(2);
  });

  it('Should call getBlockNumber and handle 1/2 node failed, use another node', async function() {
    const blockNumberAlchemy: number = 19364429;
    localNodeAlchemy.setBlockNumber(blockNumberAlchemy);
    localNodeAlchemy.setThrowErrorOnGetBlockNumber(false);

    const blockNumberInfura: number = 19364430;
    localNodeInfura.setBlockNumber(blockNumberInfura);
    localNodeInfura.setThrowErrorOnGetBlockNumber(true);

    const res = await blockchainReader.getBlockNumber();

    expect(res).to.be.eq(blockNumberAlchemy);
  });

  it('Should throw an error when all nodes fail to retrieve block number', async function() {
    const blockNumberAlchemy: number = 19364429;

    localNodeAlchemy.setBlockNumber(blockNumberAlchemy);
    localNodeAlchemy.setThrowErrorOnGetBlockNumber(true);

    const blockNumberInfura: number = 19364430;
    localNodeInfura.setBlockNumber(blockNumberInfura);
    localNodeInfura.setThrowErrorOnGetBlockNumber(true);

    try {
      await blockchainReader.getBlockNumber();
      expect.fail('Expected getBlockNumber to throw an error');
    } catch (error) {
      expect(error).to.be.instanceOf(BlockchainReaderError);
    }
  });


  it('Should call callViewFunction and handle 1/2 node failed, use another node', async function() {
    const blockNumberAlchemy: number = 19364429;

    localNodeAlchemy.setBlockNumber(blockNumberAlchemy);
    localNodeAlchemy.setReadResponse('1');

    const blockNumberInfura: number = 19364430;
    localNodeInfura.setBlockNumber(blockNumberInfura);
    localNodeInfura.setReadResponse('2');
    localNodeInfura.setThrowErrorOnCallViewFunction(true);

    const usdcContractAddress: string = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const abi = getStubAbi();
    const res = Number(await blockchainReader.callViewFunction(usdcContractAddress,
        new ethers.Interface(abi), 'decimals'));

    expect(res).to.be.eq(1);
  });

  it('Should throw an error when all nodes fail to call view function', async function() {
    const blockNumberAlchemy: number = 19364429;

    localNodeAlchemy.setBlockNumber(blockNumberAlchemy);
    localNodeAlchemy.setThrowErrorOnGetBlockNumber(false);
    localNodeAlchemy.setReadResponse('1');
    localNodeAlchemy.setThrowErrorOnCallViewFunction(true);

    const blockNumberInfura: number = 19364430;
    localNodeInfura.setBlockNumber(blockNumberInfura);
    localNodeInfura.setThrowErrorOnGetBlockNumber(false);
    localNodeInfura.setReadResponse('2');
    localNodeInfura.setThrowErrorOnCallViewFunction(true);

    try {
      const usdcContractAddress: string = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      const abi = getStubAbi();

      await blockchainReader.callViewFunction(usdcContractAddress, new ethers.Interface(abi), 'decimals');
      expect.fail('Expected callViewFunction to throw an error');
    } catch (error) {
      expect(error).to.be.instanceOf(BlockchainReaderError);
    }
  });

  it('Should throw an error when all nodes fail - getBlockNumber fails', async function() {
    const blockNumberAlchemy: number = 19364429;

    localNodeAlchemy.setBlockNumber(blockNumberAlchemy);
    localNodeAlchemy.setThrowErrorOnGetBlockNumber(true);
    localNodeAlchemy.setReadResponse('1');
    localNodeAlchemy.setThrowErrorOnCallViewFunction(false);

    const blockNumberInfura: number = 19364430;
    localNodeInfura.setBlockNumber(blockNumberInfura);
    localNodeInfura.setThrowErrorOnGetBlockNumber(true);
    localNodeInfura.setReadResponse('2');
    localNodeInfura.setThrowErrorOnCallViewFunction(false);

    try {
      const usdcContractAddress: string = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      const abi = getStubAbi();

      await blockchainReader.callViewFunction(usdcContractAddress, new ethers.Interface(abi), 'decimals');
      expect.fail('Expected callViewFunction to throw an error');
    } catch (error) {
      expect(error).to.be.instanceOf(BlockchainReaderError);
    }
  });

  it('Should throw an error when all nodes fail - callViewFunction fails', async function() {
    const blockNumberAlchemy: number = 19364429;

    localNodeAlchemy.setBlockNumber(blockNumberAlchemy);
    localNodeAlchemy.setThrowErrorOnGetBlockNumber(false);
    localNodeAlchemy.setReadResponse('1');
    localNodeAlchemy.setThrowErrorOnCallViewFunction(true);

    const blockNumberInfura: number = 19364430;
    localNodeInfura.setBlockNumber(blockNumberInfura);
    localNodeInfura.setThrowErrorOnGetBlockNumber(false);
    localNodeInfura.setReadResponse('2');
    localNodeInfura.setThrowErrorOnCallViewFunction(true);

    try {
      const usdcContractAddress: string = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      const abi = getStubAbi();

      await blockchainReader.callViewFunction(usdcContractAddress, new ethers.Interface(abi), 'decimals');
      expect.fail('Expected callViewFunction to throw an error');
    } catch (error) {
      expect(error).to.be.instanceOf(BlockchainReaderError);
    }
  });

  function getStubAbi() {
    return [
      {
        'inputs': [],
        'name': 'decimals',
        'outputs': [
          {
            'internalType': 'uint8',
            'name': '',
            'type': 'uint8',
          },
        ],
        'stateMutability': 'view',
        'type': 'function',
      },
    ];
  }
});

