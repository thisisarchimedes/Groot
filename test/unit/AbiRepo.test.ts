import {expect} from 'chai';
import {AbiRepo} from '../../src/rule_engine/tool/abi_repository/AbiRepo';
import {AbiStorageAdapter} from './adapters/AbiStorageAdapter';
import {AbiFetcherAdapter} from './adapters/AbiFetcherAdapter';
import {BlockchainNodeAdapter} from './adapters/BlockchainNodeAdapter';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';


describe('ABI Repo', function() {
  const abiStorage: AbiStorageAdapter = new AbiStorageAdapter();
  const abiFetcher: AbiFetcherAdapter = new AbiFetcherAdapter();
  let abiRepo: AbiRepo;

  let localNodeAlchemy: BlockchainNodeAdapter;
  let localNodeInfura: BlockchainNodeAdapter;
  let blockchainReader: BlockchainReader;

  const logger: LoggerAdapter = new LoggerAdapter();

  beforeEach(async function() {
    localNodeAlchemy = new BlockchainNodeAdapter(logger, 'localNodeAlchemy');
    await localNodeAlchemy.startNode();
    localNodeAlchemy.setProxyInfoForAddressResponse({isProxy: false, implementationAddress: ''});

    localNodeInfura = new BlockchainNodeAdapter(logger, 'localNodeInfura');
    await localNodeInfura.startNode();
    localNodeInfura.setProxyInfoForAddressResponse({isProxy: false, implementationAddress: ''});

    blockchainReader = new BlockchainReader(logger, [localNodeAlchemy, localNodeInfura]);

    abiRepo = new AbiRepo(blockchainReader, abiStorage, abiFetcher);
  });

  it('should load ABI from AbiRepo if exists in DB', async function() {
    abiStorage.setReturnValue('mockAbi');
    abiFetcher.setReturnValue('INVALID');
    const abi = await abiRepo.getAbiByAddress('Exists');
    expect(abi).to.be.not.null;
    expect(abi === 'mockAbi').to.be.true;
  });

  it('should fetch ABI from external service if not exists DB', async function() {
    abiStorage.setReturnValue(null);
    abiFetcher.setReturnValue('mockAbi');
    const abi = await abiRepo.getAbiByAddress('Exists');
    expect(abi).to.be.not.null;
    expect(abi === 'mockAbi').to.be.true;
    expect(await abiStorage.getAbiForAddress('Exists')).to.equal('mockAbi');
  });

  it('should fetch ABI from external service and traverse proxy', async function() {
    abiStorage.setReturnValue(null);
    abiFetcher.setReturnValue('mockAbiImplementation');
    localNodeAlchemy.setProxyInfoForAddressResponse({isProxy: true, implementationAddress: 'mockAbiImplementation'});
    localNodeInfura.setProxyInfoForAddressResponse({isProxy: true, implementationAddress: 'mockAbiImplementation'});

    const abi = await abiRepo.getAbiByAddress('Exists');

    expect(abi).to.be.not.null;
    expect(abi === 'mockAbiImplementation').to.be.true;
    expect(await abiStorage.getAbiForAddress('Exists')).to.equal('mockAbiImplementation');
  });
});
