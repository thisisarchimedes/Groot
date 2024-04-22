import 'reflect-metadata';
import {expect} from 'chai';
import {ToolStrategyUniswap} from '../../src/rule_engine/tool/ToolStrategyUniswap';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {BlockchainReader} from '../../src/blockchain/blockchain_reader/BlockchainReader';
import {BlockchainNodeAdapter} from './adapters/BlockchainNodeAdapter';
import {ModulesParams} from '../../src/types/ModulesParams';

describe('Check we create the PSP strategy tool correctly', function() {
  const modulesParams: ModulesParams = {};

  beforeEach(async function() {
    modulesParams.logger = new LoggerAdapter();

    // Starting nodes
    modulesParams.mainNode = new BlockchainNodeAdapter(modulesParams, 'localNodeAlchemy');
    modulesParams.altNode = new BlockchainNodeAdapter(modulesParams, 'localNodeInfura');
    await Promise.all([modulesParams.mainNode.startNode(), modulesParams.altNode.startNode()]);

    modulesParams.blockchainReader = new BlockchainReader(modulesParams);
  });

  it('should create uniswap strategy object and get pool address', async function() {
    const strategyAddress: string = '0x1234';

    (modulesParams.mainNode! as BlockchainNodeAdapter).setReadResponse(strategyAddress);
    (modulesParams.altNode! as BlockchainNodeAdapter).setReadResponse(strategyAddress);

    const toolStrategyUniswap = new ToolStrategyUniswap(strategyAddress, modulesParams.blockchainReader!);
    const poolAddress = await toolStrategyUniswap.getPoolAddress();
    expect(poolAddress).to.be.equal('0x1234');
  });
});
