import 'reflect-metadata';
import * as chai from 'chai';
import {BlockchainReader, BlockchainReaderError} from '../../src/blockchain/blockchain_reader/BlockchainReader';
import {BlockchainNodeAdapter} from './adapters/BlockchainNodeAdapter';
import {LoggerAll} from '../../src/service/logger/LoggerAll';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {ModulesParams} from '../../src/types/ModulesParams';

const {expect} = chai;

describe('Check that blockchain reader works with multiple underlying nodes', function() {
  const modulesParams: ModulesParams = {};

  beforeEach(async function() {
    modulesParams.configService = new ConfigServiceAWS('DemoApp', 'us-east-1');
    await modulesParams.configService.refreshConfig();

    modulesParams.logger = new LoggerAll(modulesParams.configService);

    // Starting nodes
    modulesParams.mainNode = new BlockchainNodeAdapter(modulesParams, 'localNodeAlchemy');
    modulesParams.altNode = new BlockchainNodeAdapter(modulesParams, 'localNodeInfura');

    modulesParams.blockchainReader = new BlockchainReader(modulesParams);

    return Promise.all([modulesParams.mainNode.startNode(), modulesParams.altNode.startNode()]);
  });

  it('Should be able to load two nodes and get most recent block number', async function() {
    const blockNumberAlchemy: number = 19364429;
    const blockNumberInfura: number = 19364430;

    (modulesParams.mainNode! as BlockchainNodeAdapter).setBlockNumber(blockNumberAlchemy);
    (modulesParams.altNode! as BlockchainNodeAdapter).setBlockNumber(blockNumberInfura);

    const blockNumber = await modulesParams.blockchainReader!.getBlockNumber();
    expect(blockNumber).to.be.a('number');
    expect(blockNumber).to.be.eq(Math.max(blockNumberAlchemy, blockNumberInfura));
  });

  it('Should be able to facilitate read call, decide which node to use, when both response', async function() {
    const blockNumberAlchemy: number = 19364429;
    (modulesParams.mainNode! as BlockchainNodeAdapter).setBlockNumber(blockNumberAlchemy);
    (modulesParams.mainNode! as BlockchainNodeAdapter).setReadResponse('1');

    const blockNumberInfura: number = 19364430;
    (modulesParams.altNode! as BlockchainNodeAdapter).setBlockNumber(blockNumberInfura);
    (modulesParams.altNode! as BlockchainNodeAdapter).setReadResponse('2');

    const usdcContractAddress: string = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const abi = getStubAbi();
    const res = Number(await modulesParams.blockchainReader!.callViewFunction(usdcContractAddress,
        abi, 'decimals'));

    expect(res).to.be.eq(2);
  });

  it('Should call getBlockNumber and handle 1/2 node failed, use another node', async function() {
    const blockNumberAlchemy: number = 19364429;
    (modulesParams.mainNode! as BlockchainNodeAdapter).setBlockNumber(blockNumberAlchemy);
    (modulesParams.mainNode! as BlockchainNodeAdapter).setThrowErrorOnGetBlockNumber(false);

    const blockNumberInfura: number = 19364430;
    (modulesParams.altNode! as BlockchainNodeAdapter).setBlockNumber(blockNumberInfura);
    (modulesParams.altNode! as BlockchainNodeAdapter).setThrowErrorOnGetBlockNumber(true);

    const res = await modulesParams.blockchainReader!.getBlockNumber();

    expect(res).to.be.eq(blockNumberAlchemy);
  });

  it('Should throw an error when all nodes fail to retrieve block number', async function() {
    const blockNumberAlchemy: number = 19364429;

    (modulesParams.mainNode! as BlockchainNodeAdapter).setBlockNumber(blockNumberAlchemy);
    (modulesParams.mainNode! as BlockchainNodeAdapter).setThrowErrorOnGetBlockNumber(true);

    const blockNumberInfura: number = 19364430;
    (modulesParams.altNode! as BlockchainNodeAdapter).setBlockNumber(blockNumberInfura);
    (modulesParams.altNode! as BlockchainNodeAdapter).setThrowErrorOnGetBlockNumber(true);

    try {
      await modulesParams.blockchainReader!.getBlockNumber();
      expect.fail('Expected getBlockNumber to throw an error');
    } catch (error) {
      expect(error).to.be.instanceOf(BlockchainReaderError);
    }
  });


  it('Should call callViewFunction and handle 1/2 node failed, use another node', async function() {
    const blockNumberAlchemy: number = 19364429;

    (modulesParams.mainNode! as BlockchainNodeAdapter).setBlockNumber(blockNumberAlchemy);
    (modulesParams.mainNode! as BlockchainNodeAdapter).setReadResponse('1');

    const blockNumberInfura: number = 19364430;
    (modulesParams.altNode! as BlockchainNodeAdapter).setBlockNumber(blockNumberInfura);
    (modulesParams.altNode! as BlockchainNodeAdapter).setReadResponse('2');
    (modulesParams.altNode! as BlockchainNodeAdapter).setThrowErrorOnCallViewFunction(true);

    const usdcContractAddress: string = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const abi = getStubAbi();
    const res = Number(await modulesParams.blockchainReader!.callViewFunction(usdcContractAddress,
        abi, 'decimals'));

    expect(res).to.be.eq(1);
  });

  it('Should throw an error when all nodes fail to call view function', async function() {
    const blockNumberAlchemy: number = 19364429;

    (modulesParams.mainNode! as BlockchainNodeAdapter).setBlockNumber(blockNumberAlchemy);
    (modulesParams.mainNode! as BlockchainNodeAdapter).setThrowErrorOnGetBlockNumber(false);
    (modulesParams.mainNode! as BlockchainNodeAdapter).setReadResponse('1');
    (modulesParams.mainNode! as BlockchainNodeAdapter).setThrowErrorOnCallViewFunction(true);

    const blockNumberInfura: number = 19364430;
    (modulesParams.altNode! as BlockchainNodeAdapter).setBlockNumber(blockNumberInfura);
    (modulesParams.altNode! as BlockchainNodeAdapter).setThrowErrorOnGetBlockNumber(false);
    (modulesParams.altNode! as BlockchainNodeAdapter).setReadResponse('2');
    (modulesParams.altNode! as BlockchainNodeAdapter).setThrowErrorOnCallViewFunction(true);

    try {
      const usdcContractAddress: string = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      const abi = getStubAbi();

      await modulesParams.blockchainReader!.callViewFunction(usdcContractAddress, JSON.stringify(abi), 'decimals');
      expect.fail('Expected callViewFunction to throw an error');
    } catch (error) {
      expect(error).to.be.instanceOf(BlockchainReaderError);
    }
  });

  it('Should throw an error when all nodes fail - getBlockNumber fails', async function() {
    const blockNumberAlchemy: number = 19364429;

    (modulesParams.mainNode! as BlockchainNodeAdapter).setBlockNumber(blockNumberAlchemy);
    (modulesParams.mainNode! as BlockchainNodeAdapter).setThrowErrorOnGetBlockNumber(true);
    (modulesParams.mainNode! as BlockchainNodeAdapter).setReadResponse('1');
    (modulesParams.mainNode! as BlockchainNodeAdapter).setThrowErrorOnCallViewFunction(false);

    const blockNumberInfura: number = 19364430;
    (modulesParams.altNode! as BlockchainNodeAdapter).setBlockNumber(blockNumberInfura);
    (modulesParams.altNode! as BlockchainNodeAdapter).setThrowErrorOnGetBlockNumber(true);
    (modulesParams.altNode! as BlockchainNodeAdapter).setReadResponse('2');
    (modulesParams.altNode! as BlockchainNodeAdapter).setThrowErrorOnCallViewFunction(false);

    try {
      const usdcContractAddress: string = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      const abi = getStubAbi();

      await modulesParams.blockchainReader!.callViewFunction(usdcContractAddress, JSON.stringify(abi), 'decimals');
      expect.fail('Expected callViewFunction to throw an error');
    } catch (error) {
      expect(error).to.be.instanceOf(BlockchainReaderError);
    }
  });

  it('Should throw an error when all nodes fail - callViewFunction fails', async function() {
    const blockNumberAlchemy: number = 19364429;

    (modulesParams.mainNode! as BlockchainNodeAdapter).setBlockNumber(blockNumberAlchemy);
    (modulesParams.mainNode! as BlockchainNodeAdapter).setThrowErrorOnGetBlockNumber(false);
    (modulesParams.mainNode! as BlockchainNodeAdapter).setReadResponse('1');
    (modulesParams.mainNode! as BlockchainNodeAdapter).setThrowErrorOnCallViewFunction(true);

    const blockNumberInfura: number = 19364430;
    (modulesParams.altNode! as BlockchainNodeAdapter).setBlockNumber(blockNumberInfura);
    (modulesParams.altNode! as BlockchainNodeAdapter).setThrowErrorOnGetBlockNumber(false);
    (modulesParams.altNode! as BlockchainNodeAdapter).setReadResponse('2');
    (modulesParams.altNode! as BlockchainNodeAdapter).setThrowErrorOnCallViewFunction(true);

    try {
      const usdcContractAddress: string = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      const abi = getStubAbi();

      await modulesParams.blockchainReader!.callViewFunction(usdcContractAddress, JSON.stringify(abi), 'decimals');
      expect.fail('Expected callViewFunction to throw an error');
    } catch (error) {
      expect(error).to.be.instanceOf(BlockchainReaderError);
    }
  });

  function getStubAbi() {
    return `[
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
    ]`;
  }
});

