import {BlockchainReader} from '../../blockchain/blockchain_reader/BlockchainReader';
import {Logger} from '../../service/logger/Logger';
import UNISWAPV3_STRATEGY_ABI from '../../constants/abis/UNISWAPV3_STRATEGY_ABI.json';

export class ToolStrategyUniswap {
  private readonly strategyAddress: string;
  private readonly blockchainReader: BlockchainReader;
  private readonly logger: Logger;

  constructor(strategyAddress: string, blockchainReader: BlockchainReader, logger: Logger) {
    this.strategyAddress = strategyAddress;
    this.blockchainReader = blockchainReader;
    this.logger = logger;
  }

  public async getPoolAddress(): Promise<string> {
    const ret = await this.blockchainReader.callViewFunction(this.strategyAddress, UNISWAPV3_STRATEGY_ABI, 'pool');
    return ret as string;
  }
}


