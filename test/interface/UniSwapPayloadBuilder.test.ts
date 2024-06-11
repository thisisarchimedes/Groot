import {assert, expect} from 'chai';
import 'dotenv/config';
import UniSwap from '../../src/rule_engine/tool/uni_swap/UniSwap';
import UniSwapPayloadBuilder from '../../src/rule_engine/tool/uni_swap/UniSwapPayloadBuilder';
import {ModulesParams} from '../../src/types/ModulesParams';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {LoggerConsole} from '../../src/service/logger/LoggerConsole';
import {BlockchainNodeLocal} from '../../src/blockchain/blockchain_nodes/BlockchainNodeLocal';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';

const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const WETH_DECIMALS = 18;
const WBTC = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';
const WBTC_DECIMALS = 8;

describe('UniSwap', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(20000);

  const modulesParams: ModulesParams = {};
  let uniSwap: UniSwap;
  let uniSwapPayloadBuilder: UniSwapPayloadBuilder;

  beforeEach(async function() {
    const alchemyRpcUrl: string = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY!}`;
    uniSwap = new UniSwap(alchemyRpcUrl);

    modulesParams.configService = new ConfigServiceAWS('StableApp', 'us-east-1');
    await modulesParams.configService.refreshConfig();

    // Setup Logger
    modulesParams.logger = new LoggerConsole();

    // Starting nodes
    modulesParams.mainNode = new BlockchainNodeLocal(
        modulesParams,
        `http://localhost:${process.env.MAIN_LOCAL_NODE_PORT || 8545}`,
        'localNodeAlchemy',
    );
    modulesParams.altNode = new BlockchainNodeLocal(
        modulesParams,
        `http://localhost:${process.env.ALT_LOCAL_NODE_PORT || 18545}`,
        'localNodeInfura',
    );
    await Promise.all([modulesParams.mainNode.startNode(), modulesParams.altNode.startNode()]);

    modulesParams.blockchainReader = new BlockchainReader(modulesParams);

    uniSwapPayloadBuilder = new UniSwapPayloadBuilder(
        modulesParams.configService,
        modulesParams.blockchainReader,
    );
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

  it('Test payload build for open position on wBTC strategy', async function() {
    const blockNumber = await modulesParams.blockchainReader?.getBlockNumber();
    const blockTimestamp = await modulesParams.blockchainReader?.getBlockTimestamp(blockNumber!);
    const payload = await uniSwapPayloadBuilder.getOpenPositionSwapPayload(
        2n,
        '0x7694cd972baa64018e5c6389740832e4c7f2ce9a',
       blockTimestamp!,
    );

    expect(payload).to.be.eq('0x');
  });

  it('Test payload build for close position on wBTC strategy', async function() {
    const blockNumber = await modulesParams.blockchainReader?.getBlockNumber();
    const blockTimestamp = await modulesParams.blockchainReader?.getBlockTimestamp(blockNumber!);
    const payload = await uniSwapPayloadBuilder.getClosePositionSwapPayload(
        '0x7694cd972baa64018e5c6389740832e4c7f2ce9a',
        2,
       blockTimestamp!,
    );

    expect(payload).to.be.eq('0x');
  });
});
