import { expect } from 'chai';
import { ToolStrategyUniswap } from '../../src/rule_engine/tool/ToolStrategyUniswap';
import { LoggerAdapter } from './adapters/LoggerAdapter';
import { BlockchainNodeAdapter } from './adapters/BlockchainNodeAdapter';
import { BlockchainReader } from '../../src/blockchain/blockchain_reader/BlockchainReader';
import { ConfigServiceAWS } from '../../src/service/config/ConfigServiceAWS';

describe('Check we create the PSP strategy tool correctly', function () {
  const logger: LoggerAdapter = new LoggerAdapter();
  let localNodeAlchemy: BlockchainNodeAdapter;
  let localNodeInfura: BlockchainNodeAdapter;
  let blockchainReader: BlockchainReader;

  const configService = createConfigService();

  function createConfigService(): ConfigServiceAWS {
    const environment = process.env.ENVIRONMENT as string;
    const region = process.env.AWS_REGION as string;
    return new ConfigServiceAWS(environment, region);
  }

  beforeEach(async function () {
    localNodeAlchemy = new BlockchainNodeAdapter(logger, 'localNodeAlchemy', configService.getMainRPCURL());
    await localNodeAlchemy.startNode();

    localNodeInfura = new BlockchainNodeAdapter(logger, 'localNodeInfura', configService.getMainRPCURL());
    await localNodeInfura.startNode();

    blockchainReader = new BlockchainReader(logger, [localNodeAlchemy, localNodeInfura]);
  });

  it('should create uniswap strategy object and get pool address', async function () {
    const strategyAddress: string = '0x1234';

    localNodeAlchemy.setReadResponse(strategyAddress);
    localNodeInfura.setReadResponse(strategyAddress);

    const toolStrategyUniswap = new ToolStrategyUniswap(strategyAddress, blockchainReader);

    const poolAddress = await toolStrategyUniswap.getPoolAddress();
    expect(poolAddress).to.be.equal('0x1234');
  });
});
