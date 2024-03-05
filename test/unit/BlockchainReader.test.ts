import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import {BlockchainNodeAdapter} from './adapters/BlockchainNodeAdapter';
import {BlockchainReader} from '../../src/blockchain_reader/BlockchainReader';

chai.use(chaiAsPromised);
const {expect} = chai;

describe('Check that blockchain reader works with multiple underlying nodes', function() {
  let localNodeAlchemy: BlockchainNodeAdapter;
  let localNodeInfura: BlockchainNodeAdapter;

  beforeEach(async function() {
    localNodeAlchemy = new BlockchainNodeAdapter();
    await localNodeAlchemy.startNode();
    localNodeInfura = new BlockchainNodeAdapter();
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

    const blockchainReader = new BlockchainReader([localNodeAlchemy, localNodeInfura]);
    const blockNumber = await blockchainReader.getBlockNumber();
    expect(blockNumber).to.be.a('number');
    expect(blockNumber).to.be.eq(Math.max(blockNumberAlchemy, blockNumberInfura));
  });

  it('Should be able to facilitate read call, decide which node to use, when both response', async function() {
    const blockNumberAlchemy: number = 19364429;
    const blockNumberInfura: number = 19364430;
    localNodeAlchemy.setBlockNumber(blockNumberAlchemy);
    localNodeInfura.setBlockNumber(blockNumberInfura);
    localNodeAlchemy.setReadResponse('1');
    localNodeInfura.setReadResponse('2');

    const blockchainReader = new BlockchainReader([localNodeAlchemy, localNodeInfura]);

    const usdcContractAddress: string = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const abi = [
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

    const res = Number(await blockchainReader.callViewFunction(usdcContractAddress, abi, 'decimals'));
    expect(res).to.be.eq(2);
  });

  it('Should handle 1/2 node failed, use another node, and recover failed one', async function() {
    const blockNumberAlchemy: number = 19364429;
    localNodeAlchemy.setBlockNumber(blockNumberAlchemy);
    localNodeAlchemy.setReadResponse('1');

    const blockNumberInfura: number = 19364430;
    localNodeInfura.setBlockNumber(blockNumberInfura);
    localNodeInfura.setReadResponse('2');
  });
});
