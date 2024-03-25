import 'reflect-metadata';
import { expect } from 'chai';
import { ToolStrategyUniswap } from '../../src/rule_engine/tool/ToolStrategyUniswap';
import { LoggerAdapter } from './adapters/LoggerAdapter';
import { BlockchainReader } from '../../src/blockchain/blockchain_reader/BlockchainReader';
import { TYPES } from '../../src/inversify.types';
import { createTestContainer } from '../testContainer';
import { Container } from 'inversify';
import { BlockchainNodeAdapter } from './adapters/BlockchainNodeAdapter';

describe('Check we create the PSP strategy tool correctly', function () {
  let container: Container;
  let logger: LoggerAdapter;
  let blockchainReader: BlockchainReader;

  beforeEach(async function () {
    container = createTestContainer();
    logger = container.get<LoggerAdapter>(TYPES.ILoggerAll);
    blockchainReader = container.get<BlockchainReader>(TYPES.IBlockchainReader);

    const localNodeAlchemy = container.get<BlockchainNodeAdapter>(TYPES.BlockchainNodeLocalMain);
    const localNodeInfura = container.get<BlockchainNodeAdapter>(TYPES.BlockchainNodeLocalAlt);
    await Promise.all([localNodeAlchemy.startNode(), localNodeInfura.startNode()]);
  });

  it('should create uniswap strategy object and get pool address', async function () {
    const strategyAddress: string = '0x1234';

    const localNodeAlchemy = container.get<BlockchainNodeAdapter>(TYPES.BlockchainNodeLocalMain);
    const localNodeInfura = container.get<BlockchainNodeAdapter>(TYPES.BlockchainNodeLocalAlt);
    localNodeAlchemy.setReadResponse(strategyAddress);
    localNodeInfura.setReadResponse(strategyAddress);

    const toolStrategyUniswap = new ToolStrategyUniswap(strategyAddress, blockchainReader);
    const poolAddress = await toolStrategyUniswap.getPoolAddress();
    expect(poolAddress).to.be.equal('0x1234');
  });
});