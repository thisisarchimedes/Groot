import { expect } from 'chai';
import { AbiRepo } from '../../src/rule_engine/tool/abi_repository/AbiRepo';
import { AbiStorageAdapter } from './adapters/AbiStorageAdapter';
import { AbiFetcherAdapter } from './adapters/AbiFetcherAdapter';
import { BlockchainNodeAdapter } from './adapters/BlockchainNodeAdapter';
import { TYPES } from '../../src/inversify.types';
import { IBlockchainReader } from '../../src/blockchain/blockchain_reader/interfaces/IBlockchainReader';
import { createTestContainer } from '../testContainer';
import { Container } from 'inversify';
const container = createTestContainer();


describe('ABI Repo', function () {

  let container: Container;

  let abiStorage: AbiStorageAdapter;
  let abiFetcher: AbiFetcherAdapter;
  let abiRepo: AbiRepo;

  beforeEach(async function () {

    container = createTestContainer();

    abiStorage = container.resolve(AbiStorageAdapter);
    abiFetcher = container.resolve(AbiFetcherAdapter);


    // Starting nodes
    const localNodeAlchemy = container.get<BlockchainNodeAdapter>(TYPES.BlockchainNodeLocalMain);
    const localNodeInfura = container.get<BlockchainNodeAdapter>(TYPES.BlockchainNodeLocalAlt);

    Promise.all([localNodeAlchemy.startNode(), localNodeInfura.startNode()]);

    localNodeInfura.setProxyInfoForAddressResponse({ isProxy: false, implementationAddress: '' });

    const blockchainReader = container.get<IBlockchainReader>(TYPES.IBlockchainReader);

    abiRepo = new AbiRepo(blockchainReader, abiStorage, abiFetcher);
  });

  it('should load ABI from AbiRepo if exists in DB', async function () {
    abiStorage.setReturnValue('mockAbi');
    abiFetcher.setReturnValue('INVALID');
    const abi = await abiRepo.getAbiByAddress('Exists');
    expect(abi).to.be.not.null;
    expect(abi === 'mockAbi').to.be.true;
  });

  it('should fetch ABI from external service if not exists DB', async function () {
    abiStorage.setReturnValue(null);
    abiFetcher.setReturnValue('mockAbi');
    const abi = await abiRepo.getAbiByAddress('Exists');
    expect(abi).to.be.not.null;
    expect(abi === 'mockAbi').to.be.true;
    expect(await abiStorage.getAbiForAddress('Exists')).to.equal('mockAbi');
  });

  it('should fetch ABI from external service and traverse proxy', async function () {
    abiStorage.setReturnValue(null);
    abiFetcher.setReturnValue('mockAbiImplementation');
    const localNodeAlchemy = container.get<BlockchainNodeAdapter>(TYPES.BlockchainNodeLocalMain);
    const localNodeInfura = container.get<BlockchainNodeAdapter>(TYPES.BlockchainNodeLocalAlt);
    localNodeAlchemy.setProxyInfoForAddressResponse({ isProxy: true, implementationAddress: 'mockAbiImplementation' });
    localNodeInfura.setProxyInfoForAddressResponse({ isProxy: true, implementationAddress: 'mockAbiImplementation' });

    const abi = await abiRepo.getAbiByAddress('Exists');

    expect(abi).to.be.not.null;
    expect(abi === 'mockAbiImplementation').to.be.true;
    expect(await abiStorage.getAbiForAddress('Exists')).to.equal('mockAbiImplementation');
  });
});
