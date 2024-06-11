import 'reflect-metadata';

import {expect} from 'chai';
import {AbiFetcherEtherscan} from '../../src/rule_engine/tool/abi_repository/AbiFetcherEtherscan';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {AbiStorageDynamoDB} from '../../src/rule_engine/tool/abi_repository/AbiStorageDynamoDB';
import {ModulesParams} from '../../src/types/ModulesParams';

describe('ABI Repo external services', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(25000);

  const modulesParams: ModulesParams = {};

  beforeEach(async function() {
    modulesParams.configService = new ConfigServiceAWS('DemoApp', 'us-east-1');
    await modulesParams.configService.refreshConfig();
  });

  it('should load ABI from Etherscan', async function() {
    const abiFetcher = new AbiFetcherEtherscan(modulesParams);
    const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const abi: string = await abiFetcher.getAbiByAddress(USDC);

    expect(abi).to.be.not.null;
    expect(abi.length).to.be.greaterThan(100);
  });

  it('should be able to write ABI to DynamoDB', async function() {
    const address = '0x123';
    const abi = 'mockAbi2';
    const abiStorage = new AbiStorageDynamoDB(modulesParams);
    await abiStorage.storeAbiForAddress(address, abi);
  });

  it('should be able to read ABI from DynamoDB', async function() {
    const address = '0x123';
    const abiStorage = new AbiStorageDynamoDB(modulesParams);
    const abi = await abiStorage.getAbiForAddress(address);
    expect(abi).to.be.not.null;
    expect(abi?.length).to.be.greaterThan(0);
  });
});
