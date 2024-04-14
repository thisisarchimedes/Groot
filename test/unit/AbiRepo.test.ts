import {expect} from 'chai';
import {AbiRepo} from '../../src/rule_engine/tool/abi_repository/AbiRepo';
import {AbiStorageAdapter} from './adapters/AbiStorageAdapter';
import {AbiFetcherAdapter} from './adapters/AbiFetcherAdapter';
import {BlockchainNodeAdapter} from './adapters/BlockchainNodeAdapter';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {LoggerAll} from '../../src/service/logger/LoggerAll';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';


describe('ABI Repo', function() {
  let abiStorage: AbiStorageAdapter;
  let abiFetcher: AbiFetcherAdapter;
  let abiRepo: AbiRepo;
  let localNodeAlchemy: BlockchainNodeAdapter;
  let localNodeInfura: BlockchainNodeAdapter;

  beforeEach(async function() {
    const configService = new ConfigServiceAWS('DemoApp', 'us-east-1');
    await configService.refreshConfig();

    const logger = new LoggerAll(configService);

    abiStorage = new AbiStorageAdapter();
    abiFetcher = new AbiFetcherAdapter();

    // Starting nodes
    localNodeAlchemy = new BlockchainNodeAdapter(logger, 'localNodeAlchemy');
    localNodeInfura = new BlockchainNodeAdapter(logger, 'localNodeInfura');

    Promise.all([localNodeAlchemy.startNode(), localNodeInfura.startNode()]);

    localNodeInfura.setProxyInfoForAddressResponse({isProxy: false, implementationAddress: ''});

    const blockchainReader = new BlockchainReader(logger, localNodeAlchemy, localNodeInfura);

    abiRepo = new AbiRepo(configService, blockchainReader);
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
