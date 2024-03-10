import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import {BlockchainNodeAdapter} from './adapters/BlockchainNodeAdapter';
import {BlockChainReaderError, BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';
import {LoggerAdapter} from './adapters/LoggerAdapter';

chai.use(chaiAsPromised);
const {expect} = chai;

describe('Check that blockchain reader works with multiple underlying nodes', function() {
  let localNodeAlchemy: BlockchainNodeAdapter;
  let localNodeInfura: BlockchainNodeAdapter;
  const logger: LoggerAdapter = new LoggerAdapter();

  beforeEach(async function() {
    localNodeAlchemy = new BlockchainNodeAdapter(logger, 'localNodeAlchemy');
    await localNodeAlchemy.startNode();
    localNodeInfura = new BlockchainNodeAdapter(logger, 'localNodeInfura');
    await localNodeInfura.startNode();
  });

  afterEach(async function() {
    await localNodeAlchemy.stopNode();
    await localNodeInfura.stopNode();
  });

  it('Should be able to load two nodes and get most recent block number', async function() {
    const blockNumberAlchemy: number = 19364429;
    const blockNumberInfura: number = 19364430;
    localNodeAlchemy.setBlockNumber(blockNumberAlchemy);
    localNodeInfura.setBlockNumber(blockNumberInfura);

    const blockchainReader = new BlockchainReader(logger, [localNodeAlchemy, localNodeInfura]);
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

    const blockchainReader = new BlockchainReader(logger, [localNodeAlchemy, localNodeInfura]);

    const usdcContractAddress: string = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const abi = getStubAbi();
    const res = Number(await blockchainReader.callViewFunction(usdcContractAddress, abi, 'decimals'));

    expect(res).to.be.eq(2);
  });

  it('Should call getBlockNumber and handle 1/2 node failed, use another node', async function() {
    const blockNumberAlchemy: number = 19364429;
    localNodeAlchemy.setBlockNumber(blockNumberAlchemy);
    localNodeAlchemy.setThrowErrorOnGetBlockNumber(false);

    const blockNumberInfura: number = 19364430;
    localNodeInfura.setBlockNumber(blockNumberInfura);
    localNodeInfura.setThrowErrorOnGetBlockNumber(true);

    const blockchainReader = new BlockchainReader(logger, [localNodeAlchemy, localNodeInfura]);

    const res = await blockchainReader.getBlockNumber();

    expect(res).to.be.eq(19364429);
  });

  it('Should throw an error when all nodes fail to retrieve block number', async function() {
    const blockNumberAlchemy: number = 19364429;
    localNodeAlchemy.setBlockNumber(blockNumberAlchemy);
    localNodeAlchemy.setThrowErrorOnGetBlockNumber(true);

    const blockNumberInfura: number = 19364430;
    localNodeInfura.setBlockNumber(blockNumberInfura);
    localNodeInfura.setThrowErrorOnGetBlockNumber(true);

    const blockchainReader = new BlockchainReader(logger, [localNodeAlchemy, localNodeInfura]);

    try {
      await blockchainReader.getBlockNumber();
      expect.fail('Expected getBlockNumber to throw an error');
    } catch (error) {
      expect(error).to.be.instanceOf(BlockChainReaderError);
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

    const blockchainReader = new BlockchainReader(logger, [localNodeAlchemy, localNodeInfura]);

    const usdcContractAddress: string = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const abi = getStubAbi();
    const res = Number(await blockchainReader.callViewFunction(usdcContractAddress, abi, 'decimals'));

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

    const blockchainReader = new BlockchainReader(logger, [localNodeAlchemy, localNodeInfura]);

    try {
      const usdcContractAddress: string = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      const abi = getStubAbi();

      await blockchainReader.callViewFunction(usdcContractAddress, abi, 'decimals');
      expect.fail('Expected callViewFunction to throw an error');
    } catch (error) {
      expect(error).to.be.instanceOf(BlockChainReaderError);
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

    const blockchainReader = new BlockchainReader(logger, [localNodeAlchemy, localNodeInfura]);

    try {
      const usdcContractAddress: string = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      const abi = getStubAbi();

      await blockchainReader.callViewFunction(usdcContractAddress, abi, 'decimals');
      expect.fail('Expected callViewFunction to throw an error');
    } catch (error) {
      expect(error).to.be.instanceOf(BlockChainReaderError);
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

    const blockchainReader = new BlockchainReader(logger, [localNodeAlchemy, localNodeInfura]);

    try {
      const usdcContractAddress: string = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      const abi = getStubAbi();

      await blockchainReader.callViewFunction(usdcContractAddress, abi, 'decimals');
      expect.fail('Expected callViewFunction to throw an error');
    } catch (error) {
      expect(error).to.be.instanceOf(BlockChainReaderError);
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
