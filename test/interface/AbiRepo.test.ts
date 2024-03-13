import {expect} from 'chai';
import {AbiFetcherEtherscan} from '../../src/rule_engine/tool/abi_repository/AbiFetcherEtherscan';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {AbiStorageDynamoDB} from '../../src/rule_engine/tool/abi_repository/AbiStorageDynamoDB';

describe('ABI Repo external services', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(12000);

  let configService: ConfigServiceAWS;

  beforeEach(async function() {
    configService = new ConfigServiceAWS('DemoApp', 'us-east-1');
    await configService.refreshConfig();
  });

  it('should load ABI from Etherscan', async function() {
    const abiFetcher = new AbiFetcherEtherscan(configService.getEtherscanAPIKey());
    const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const abi: string = await abiFetcher.getAbiByAddress(USDC);

    expect(abi).to.be.not.null;
    expect(abi.length).to.be.greaterThan(100);
  });

  it('should be able to write ABI to DynamoDB', async function() {
    const address = '0x123';
    const abi = 'mockAbi2';
    const abiStorage = new AbiStorageDynamoDB('ABIRepo', 'us-east-1');
    await abiStorage.storeAbiForAddress(address, abi);
  });

  it('should be able to read ABI from DynamoDB', async function() {
    const address = '0x123';
    const abiStorage = new AbiStorageDynamoDB('ABIRepo', 'us-east-1');
    const abi = await abiStorage.getAbiForAddress(address);
    expect(abi).to.be.not.null;
    expect(abi?.length).to.be.greaterThan(0);
  });
});
