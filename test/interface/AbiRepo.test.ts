import {expect} from 'chai';
import {AbiFetcherEtherscan} from '../../src/rule_engine/tool/abi_repository/AbiFetcherEtherscan';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';

describe('Using Etherscan to fetch ABI', function() {
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
});
