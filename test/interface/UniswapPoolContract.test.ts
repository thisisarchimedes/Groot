import {expect} from 'chai';
import {JsonRpcProvider, Contract} from 'ethers';
import UNISWAPV3_STRATEGY_ABI from '../../src/constants/abis/UNISWAPV3_STRATEGY_ABI.json';
import * as dotenv from 'dotenv';
import {ToolStrategyUniswap} from '../../src/rule_engine/tool/ToolStrategyUniswap';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';
import {BlockchainNodeRemoteRPC} from '../../src/blockchain/blockchain_nodes/BlockchainNodeRemoteRPC';
import {LoggerConsole} from '../../src/service/logger/LoggerConsole';
dotenv.config();

describe('Uniswap contract interface', function() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(12000);

  let alchemyRpc: JsonRpcProvider;
  const uniswapStrategyAddress = '0x69209d1bF6A6612d34D03D16a332154A3131212a';
  let uniswapStrategy: Contract;
  let blockchainReader: BlockchainReader;
  let toolStrategyUniswap: ToolStrategyUniswap;

  beforeEach(function() {
    const apiKeyAlchemy = process.env.API_KEY_ALCHEMY;

    alchemyRpc = new JsonRpcProvider(
        `https://eth-mainnet.alchemyapi.io/v2/${apiKeyAlchemy}`,
    );

    // LoggerConsole
    // BlockchainNodeRemoteRPC
    const mainNode = new BlockchainNodeRemoteRPC(
        new LoggerConsole(),
        `https://eth-mainnet.alchemyapi.io/v2/${apiKeyAlchemy}`,
        'alchemyNode',
    );
    const altNode = new BlockchainNodeRemoteRPC(
        new LoggerConsole(),
        `https://mainnet.infura.io/v3/${process.env.API_KEY_INFURA}`,
        'infuraNode',
    );
    uniswapStrategy = new Contract(
        uniswapStrategyAddress,
        UNISWAPV3_STRATEGY_ABI,
        alchemyRpc,
    );

    blockchainReader = new BlockchainReader({
      mainNode: mainNode,
      altNode: altNode,
    });
    toolStrategyUniswap = new ToolStrategyUniswap(
        uniswapStrategyAddress,
        blockchainReader,
    );
  });

  it('should return expected response structure from Uniswap getPosition', async function() {
    const position = await uniswapStrategy.getPosition();
    const testBigIntVar: bigint = BigInt(0);
    expect(typeof position[0]).to.be.eq(typeof testBigIntVar);
    expect(typeof position[1]).to.be.eq(typeof testBigIntVar);
    expect(typeof position[2]).to.be.eq(typeof testBigIntVar);
  });

  it('should return number for upperTick', async function() {
    const upperTick = await toolStrategyUniswap.upperTick();
    expect(typeof upperTick).to.be.eq('number');
  });

  it('should return number for lowerTick', async function() {
    const lowerTick = await toolStrategyUniswap.lowerTick();
    expect(typeof lowerTick).to.be.eq('number');
  });

  it('should return number for currentTick', async function() {
    const currentTick = await toolStrategyUniswap.currentTick();
    expect(typeof currentTick).to.be.eq('number');
  });

  it('should return number for tickSpacing', async function() {
    const tickSpacing = await toolStrategyUniswap.tickSpacing();
    expect(typeof tickSpacing).to.be.eq('number');
  });

  it('should return string for poolAddress', async function() {
    const poolAddress = await toolStrategyUniswap.getPoolAddress();
    expect(typeof poolAddress).to.be.eq('string');
  });

  it('should return uniswap position as UniswapStrategyPosition struct', async function() {
    const position = await toolStrategyUniswap.getPosition();
    expect(typeof position.liquidity).to.be.eq('bigint');
    expect(typeof position.amount0).to.be.eq('bigint');
    expect(typeof position.amount1).to.be.eq('bigint');
  });
});
