import { BlockchainReader } from "../../blockchain/blockchain_reader/BlockchainReader";
import { Logger } from "../../service/logger/Logger";
import UNISWAPV3_STRATEGY_ABI from "../../constants/abis/UNISWAPV3_STRATEGY_ABI.json";

export class ToolStrategyUniswap {
  private readonly strategyAddress: string;
  private readonly blockchainReader: BlockchainReader;

  constructor(strategyAddress: string, blockchainReader: BlockchainReader) {
    this.strategyAddress = strategyAddress;
    this.blockchainReader = blockchainReader;
  }

  public async getPoolAddress(): Promise<string> {
    const ret = await this.blockchainReader.callViewFunction(
      this.strategyAddress,
      UNISWAPV3_STRATEGY_ABI,
      "pool"
    );
    return ret as string;
  }
  public async upperTick(): Promise<number> {
    const ret = await this.blockchainReader.callViewFunction(
      this.strategyAddress,
      UNISWAPV3_STRATEGY_ABI,
      "upperTick"
    );
    return ret as number;
  }
  public async lowerTick(): Promise<number> {
    const ret = await this.blockchainReader.callViewFunction(
      this.strategyAddress,
      UNISWAPV3_STRATEGY_ABI,
      "lowerTick"
    );
    return ret as number;
  }
  public async currentTick(): Promise<number> {
    const ret = await this.blockchainReader.callViewFunction(
      this.strategyAddress,
      UNISWAPV3_STRATEGY_ABI,
      "currentTick"
    );
    return ret as number;
  }
}
