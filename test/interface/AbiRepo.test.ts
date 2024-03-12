import {expect} from 'chai';
import {AbiFetcherEtherscan} from '../../src/rule_engine/tool/abi_repository/AbiFetcherEtherscan';

describe('Using Etherscan to fetch ABI', function() {
  it('should load ABI from The Graph', async function() {
    const abiFetcher = new AbiFetcherEtherscan('YPSCJ22BA3D498YBFPYN8KTX2H3EE97QZP');
    const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const abi: string = await abiFetcher.getAbiByAddress(USDC);

    expect(abi).to.be.not.null;
    expect(abi.length).to.be.greaterThan(100);
  });
});
