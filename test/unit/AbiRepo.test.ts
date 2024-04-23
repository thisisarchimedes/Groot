import {expect} from 'chai';
import {AbiRepo} from '../../src/rule_engine/tool/abi_repository/AbiRepo';
import {AbiStorageAdapter} from './adapters/AbiStorageAdapter';
import {AbiFetcherAdapter} from './adapters/AbiFetcherAdapter';
import {BlockchainNodeAdapter} from './adapters/BlockchainNodeAdapter';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';
import {ModulesParams} from '../../src/types/ModulesParams';
import {LoggerConsole} from '../../src/service/logger/LoggerConsole';


describe('ABI Repo', function() {
  const modulesParams: ModulesParams = {};
  let abiStorage: AbiStorageAdapter;
  let abiFetcher: AbiFetcherAdapter;

  beforeEach(async function() {
    modulesParams.configService = new ConfigServiceAWS('DemoApp', 'us-east-1');
    await modulesParams.configService.refreshConfig();

    modulesParams.logger = new LoggerConsole();

    // Starting nodes
    modulesParams.mainNode = new BlockchainNodeAdapter(modulesParams, 'localNodeAlchemy');
    modulesParams.altNode = new BlockchainNodeAdapter(modulesParams, 'localNodeInfura');

    Promise.all([modulesParams.mainNode.startNode(), modulesParams.altNode.startNode()]);

    (modulesParams.altNode as BlockchainNodeAdapter)
        .setProxyInfoForAddressResponse('', {isProxy: false, implementationAddress: ''});

    modulesParams.blockchainReader = new BlockchainReader(modulesParams);

    abiStorage = new AbiStorageAdapter();
    abiFetcher = new AbiFetcherAdapter();
    modulesParams.abiRepo = new AbiRepo(modulesParams, abiStorage, abiFetcher);
  });

  it('should load ABI from AbiRepo if exists in DB', async function() {
    abiStorage.setReturnValue('mockAbi');
    abiFetcher.setReturnValue('INVALID');
    const abi = await modulesParams.abiRepo!.getAbiByAddress('Exists');
    expect(abi).to.be.not.null;
    expect(abi === 'mockAbi').to.be.true;
  });

  it('should fetch ABI from external service if not exists DB', async function() {
    abiStorage.setReturnValue(null);
    abiFetcher.setReturnValue('mockAbi');
    const abi = await modulesParams.abiRepo!.getAbiByAddress('Exists');
    expect(abi).to.be.not.null;
    expect(abi === 'mockAbi').to.be.true;
    expect(await abiStorage.getAbiForAddress('Exists')).to.equal('mockAbi');
  });

  it('should fetch ABI from external service and traverse proxy', async function() {
    abiStorage.setReturnValue(null);
    abiFetcher.setReturnValue('mockAbiImplementation');
    (modulesParams.mainNode as BlockchainNodeAdapter)
        .setProxyInfoForAddressResponse('', {isProxy: true, implementationAddress: 'mockAbiImplementation'});
    (modulesParams.altNode as BlockchainNodeAdapter)
        .setProxyInfoForAddressResponse('', {isProxy: true, implementationAddress: 'mockAbiImplementation'});

    const abi = await modulesParams.abiRepo!.getAbiByAddress('Exists');

    expect(abi).to.be.not.null;
    expect(abi === 'mockAbiImplementation').to.be.true;
    expect(await abiStorage.getAbiForAddress('Exists')).to.equal('mockAbiImplementation');
  });
});
