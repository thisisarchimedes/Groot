import {ethers} from 'ethers';
import {BlockchainReader} from '../../blockchain/blockchain_reader/BlockchainReader';
import UNISWAPV3_STRATEGY_ABI from '../../constants/abis/UNISWAPV3_STRATEGY_ABI.json';
import {Contract, Transaction} from 'ethers';
export class ToolStrategyUniswap {
  private readonly strategyAddress: string;
  private readonly blockchainReader: BlockchainReader;

  constructor(strategyAddress: string, blockchainReader: BlockchainReader) {
    this.strategyAddress = strategyAddress;
    this.blockchainReader = blockchainReader;
  }

  public async getPoolAddress(): Promise<string> {
    const ret = await this.blockchainReader.callViewFunction(this.strategyAddress,
        new ethers.Interface(UNISWAPV3_STRATEGY_ABI), 'pool');
    return ret as string;
  }
  public async upperTick(): Promise<number> {
    const ret = await this.blockchainReader.callViewFunction(
        this.strategyAddress,
        new ethers.Interface(UNISWAPV3_STRATEGY_ABI),
        'upperTick',
    );
    return ret as number;
  }
  public async lowerTick(): Promise<number> {
    const ret = await this.blockchainReader.callViewFunction(
        this.strategyAddress,
        new ethers.Interface(UNISWAPV3_STRATEGY_ABI),
        'lowerTick',
    );
    return ret as number;
  }
  public async currentTick(): Promise<number> {
    const ret = await this.blockchainReader.callViewFunction(
        this.strategyAddress,
        new ethers.Interface(UNISWAPV3_STRATEGY_ABI),
        'currentTick',
    );
    return ret as number;
  }
  public async tickSpacing(): Promise<number> {
    const poolAddress = await this.getPoolAddress();
    const ret = await this.blockchainReader.callViewFunction(
        poolAddress,
        new ethers.Interface(UNISWAPV3_STRATEGY_ABI),
        'tickSpacing',
    );
    return ret as number;
  }
  public createRebalanceTransaction(
      newUpperTick: number,
      newLowerTick: number,
      amount0OutMin: bigint,
      amount1OutMin: bigint,
  ): Promise<Transaction> {
    // create transaction
    const strategyContract = new Contract(
        this.strategyAddress,
        UNISWAPV3_STRATEGY_ABI,
    );
    const tx = strategyContract.rebalance(
        newUpperTick,
        newLowerTick,
        amount0OutMin,
        amount1OutMin,
    );
    return tx;
  }
}
