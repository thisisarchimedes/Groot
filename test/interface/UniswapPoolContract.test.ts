import {expect} from 'chai';
import {JsonRpcProvider, Contract} from 'ethers';
import UNISWAPV3_STRATEGY_ABI from '../../src/constants/abis/UNISWAPV3_STRATEGY_ABI.json';
import * as dotenv from 'dotenv';

dotenv.config();

describe('Uniswap contract interface', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(12000);

  let alchemyRpc: JsonRpcProvider;
  const uniswapStrategyAddress = '0x69209d1bF6A6612d34D03D16a332154A3131212a';
  let uniswapStrategy: Contract;

  beforeEach(function() {
    const apiKeyAlchemy = process.env.ALCHEMY_API_KEY;
    alchemyRpc = new JsonRpcProvider(
        `https://eth-mainnet.alchemyapi.io/v2/${apiKeyAlchemy}`,
    );
    uniswapStrategy = new Contract(
        uniswapStrategyAddress,
        UNISWAPV3_STRATEGY_ABI,
        alchemyRpc,
    );
  });

  it('should return expected response structure from Uniswap getPosition', async function() {
    const position = await uniswapStrategy.getPosition();
    const testBigIntVar: bigint = BigInt(0);
    expect(typeof position[0]).to.be.eq(typeof testBigIntVar);
    expect(typeof position[1]).to.be.eq(typeof testBigIntVar);
    expect(typeof position[2]).to.be.eq(typeof testBigIntVar);
  });
});
