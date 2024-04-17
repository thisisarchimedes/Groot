import {assert} from 'chai';
import 'dotenv/config';
import UniSwap from '../../src/rule_engine/tool/uni_swap/UniSwap';

const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const WETH_DECIMALS = 18;
const WBTC = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';
const WBTC_DECIMALS = 8;

describe('UniSwap', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(20000);

  let uniSwap: UniSwap;

  beforeEach(function() {
    const alchemyRpcUrl: string = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY!}`;
    uniSwap = new UniSwap(alchemyRpcUrl);
  });

  it('Test payload build', async function() {
    const currentTimestamp = Math.floor(Date.now() / 1000);

    const {swapOutputAmount, payload} = await uniSwap.buildPayload(
        (1 ** WETH_DECIMALS).toString(),
        WETH,
        WETH_DECIMALS,
        WBTC,
        WBTC_DECIMALS,
        currentTimestamp,
    );

    const expectedPayload = `0x00000000000000000000000000000
    000000000000000000000000000000000200000000000000000000000000000
    000000000000000000000000000000000040000000000000000000000000000
    0000000000000000000000000000065940fb600000000000000000000000000
    0000000000000000000000000000000000002bc02aaa39b223fe8d0a0e5c4f2
    7ead9083c756cc20001f42260fac5e5542a773aa44fbcfedf7c193bc2c59900
    0000000000000000000000000000000000000000`;

    // Eth should be more than 0.005 (sanity)
    assert(Number(swapOutputAmount) > 0.005, 'swapOutputAmount should be greater than 0.005');
    assert(payload, expectedPayload);
  });
});
