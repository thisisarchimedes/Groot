import {expect} from 'chai';
import {AbiRepo} from '../../src/rule_engine/tool/abi_repository/AbiRepo';
import {AbiStorageAdapter} from './adapters/AbiStorageAdapter';
import {AbiFetcherAdapter} from './adapters/AbiFetcherAdapter';


describe('ABI Repo', function() {
  const abiStorage: AbiStorageAdapter = new AbiStorageAdapter();
  const abiFetcher: AbiFetcherAdapter = new AbiFetcherAdapter();
  let abiRepo: AbiRepo;

  beforeEach(function() {
    abiRepo = new AbiRepo(abiStorage, abiFetcher);
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
});
