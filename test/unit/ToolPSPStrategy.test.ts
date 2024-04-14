import 'reflect-metadata';
import {expect} from 'chai';
import {ToolStrategyUniswap} from '../../src/rule_engine/tool/ToolStrategyUniswap';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';
import {BlockchainNodeAdapter} from './adapters/BlockchainNodeAdapter';

describe('Check we create the PSP strategy tool correctly', function() {
  let logger: LoggerAdapter;
  let blockchainReader: BlockchainReader;
  let localNodeAlchemy: BlockchainNodeAdapter;
  let localNodeInfura: BlockchainNodeAdapter;

  beforeEach(async function() {
    logger = new LoggerAdapter();

    // Starting nodes
    localNodeAlchemy = new BlockchainNodeAdapter(logger, 'localNodeAlchemy');
    localNodeInfura = new BlockchainNodeAdapter(logger, 'localNodeInfura');
    await Promise.all([localNodeAlchemy.startNode(), localNodeInfura.startNode()]);

    blockchainReader = new BlockchainReader(logger, localNodeAlchemy, localNodeInfura);
  });

  it('should create uniswap strategy object and get pool address', async function() {
    const strategyAddress: string = '0x1234';

    localNodeAlchemy.setReadResponse(strategyAddress);
    localNodeInfura.setReadResponse(strategyAddress);

    const toolStrategyUniswap = new ToolStrategyUniswap(strategyAddress, blockchainReader);
    const poolAddress = await toolStrategyUniswap.getPoolAddress();
    expect(poolAddress).to.be.equal('0x1234');
  });
});
