import {expect} from 'chai';
import {ToolStrategyUniswap} from '../../src/rule_engine/tool/ToolStrategyUniswap';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {BlockchainNodeAdapter} from './adapters/BlockchainNodeAdapter';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';

describe('Check we create the PSP strategy tool correctly', function() {
  const logger: LoggerAdapter = new LoggerAdapter();
  let localNodeAlchemy: BlockchainNodeAdapter;
  let localNodeInfura: BlockchainNodeAdapter;
  let blockchainReader: BlockchainReader;

  beforeEach(async function() {
    localNodeAlchemy = new BlockchainNodeAdapter(logger, 'localNodeAlchemy');
    await localNodeAlchemy.startNode();

    localNodeInfura = new BlockchainNodeAdapter(logger, 'localNodeInfura');
    await localNodeInfura.startNode();

    blockchainReader = new BlockchainReader(logger, [localNodeAlchemy, localNodeInfura]);
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
