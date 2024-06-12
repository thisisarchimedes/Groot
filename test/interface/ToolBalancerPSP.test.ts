import {expect} from 'chai';

import * as dotenv from 'dotenv';
import {ToolBalancerPSP} from '../../src/rule_engine/tool/balancer/ToolBalancerPSP';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';
import {BlockchainNodeRemoteRPC} from '../../src/blockchain/blockchain_nodes/BlockchainNodeRemoteRPC';
import {LoggerConsole} from '../../src/service/logger/LoggerConsole';
import {parseEther} from 'ethers';
dotenv.config();

describe('Balancer Stratgy interface', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(12000);

  const balancerStrategyAddress = '0x4f4c4D838c1bd66A1d19f599CA9e6C6c2F6104d2';
  const balancerAdapterAddress = '0x30C2C954F734f061C0fF254E310E8c93F7497a5B';

  let blockchainReader: BlockchainReader;
  let toolBalancerPSP: ToolBalancerPSP;

  beforeEach(function() {
    const apiKeyAlchemy = process.env.API_KEY_ALCHEMY;

    // LoggerConsole
    // BlockchainNodeRemoteRPC
    const mainNode = new BlockchainNodeRemoteRPC(
        new LoggerConsole(),
        `https://eth-mainnet.alchemyapi.io/v2/${apiKeyAlchemy}`,
        'alchemyNode',
    );
    const altNode = new BlockchainNodeRemoteRPC(
        new LoggerConsole(),
        `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
        'infuraNode',
    );

    blockchainReader = new BlockchainReader({
      mainNode: mainNode,
      altNode: altNode,
    });
    toolBalancerPSP = new ToolBalancerPSP(
        balancerStrategyAddress,
        balancerAdapterAddress,
        blockchainReader,
    );
  });

  it('should fetch the last adjustIn timestamp', async function() {
    const lastAdjustIn = await toolBalancerPSP.lastAdjustInTimestamp();
    expect(lastAdjustIn).to.be.a('bigint');
  });

  it('should fetch the last adjustOut timestamp', async function() {
    const lastAdjustOut = await toolBalancerPSP.lastAdjustOutTimestamp();
    expect(lastAdjustOut).to.be.a('bigint');
  });

  it('should fetch the pool id for adapter', async function() {
    const poolId = await toolBalancerPSP.getPoolId();
    expect(poolId).to.be.a('string');
  });

  it('should fetch the pool tokens', async function() {
    const poolTokens = await toolBalancerPSP.fetchPoolTokens();
    expect(poolTokens.balances).to.be.an('array');
    expect(poolTokens.tokens).to.be.an('array');
    expect(poolTokens.lastChangeBlock).to.be.a('bigint');
  });

  it('should fetch the underlying balance', async function() {
    const underlyingBalance =
      await toolBalancerPSP.fetchAdapterUnderlyingBalance();
    expect(underlyingBalance).to.be.a('bigint');
  });

  it('should fetch the lp balance', async function() {
    const lpBalance = await toolBalancerPSP.fetchAdapterLpBalance();
    expect(lpBalance).to.be.a('bigint');
  });

  it('should fetch the pool address', async function() {
    const poolAddress = await toolBalancerPSP.fetchPoolAddress();
    expect(poolAddress).to.be.a('string');
  });

  it('should fetch underlying token address', async function() {
    const underlyingTokenAddress =
      await toolBalancerPSP.fetchUnderlyingTokenAddress();
    expect(underlyingTokenAddress).to.be.a('string');
  });

  it('should fetch minimum lp token amount', async function() {
    const minLpTokenAmount = await toolBalancerPSP.calculateMinimumLpAmountComposable(parseEther('0.1'), BigInt(20));
    expect(minLpTokenAmount).to.be.a('bigint');
  });
});
