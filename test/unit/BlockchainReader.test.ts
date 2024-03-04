import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as dotenv from 'dotenv';

import {LocalNodeAdapter} from './adapters/LocalNodeAdapter';
import {BlockchainReader} from '../../src/blockchain_reader/BlockchainReader';

dotenv.config();
chai.use(chaiAsPromised);

const {expect} = chai;

describe('Check that blockchain reader works with multiple underlying nodes', function() {
  let localNodeAlchemy: LocalNodeAdapter;
  let localNodeInfura: LocalNodeAdapter;

  beforeEach(async function() {
    localNodeAlchemy = new LocalNodeAdapter();
    await localNodeAlchemy.startNode();
    localNodeInfura = new LocalNodeAdapter();
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
});
