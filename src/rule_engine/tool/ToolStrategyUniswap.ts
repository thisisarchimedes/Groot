import {ethers} from 'ethers';
import UNISWAPV3_STRATEGY_ABI from '../../constants/abis/UNISWAPV3_STRATEGY_ABI.json';
import {Contract} from 'ethers';
import {RawTransactionData} from '../../blockchain/OutboundTransaction';
import {IBlockchainReader} from '../../blockchain/blockchain_reader/interfaces/IBlockchainReader';
export interface UniswapStrategyPosition {
  liquidity: bigint;
  amount0: bigint;
  amount1: bigint;
}
export class ToolStrategyUniswap {
  private readonly strategyAddress: string;
  private readonly blockchainReader: IBlockchainReader;

  constructor(strategyAddress: string, blockchainReader: IBlockchainReader) {
    this.strategyAddress = strategyAddress;
    this.blockchainReader = blockchainReader;
  }

  public async getPoolAddress(): Promise<string> {
    const ret = await this.blockchainReader.callViewFunction(
        this.strategyAddress,
        new ethers.Interface(UNISWAPV3_STRATEGY_ABI),
        'pool',
    );

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
  public async getPosition(): Promise<UniswapStrategyPosition> {
    const ret = (await this.blockchainReader.callViewFunction(
        this.strategyAddress,
        new ethers.Interface(UNISWAPV3_STRATEGY_ABI),
        'getPosition',
    )) as Array<bigint>;

    const response: UniswapStrategyPosition = {
      liquidity: ret[0],
      amount0: ret[1],
      amount1: ret[2],
    };
    return response;
  }
  public async createRebalanceTransaction(
      newUpperTick: number,
      newLowerTick: number,
      amount0OutMin: bigint,
      amount1OutMin: bigint,
  ): Promise<RawTransactionData> {
    // create transaction
    const strategyContract = new Contract(
        this.strategyAddress,
        UNISWAPV3_STRATEGY_ABI,
    );
    const tx = await strategyContract['rebalance'].populateTransaction(
        newLowerTick,
        newUpperTick,
        amount0OutMin,
        amount1OutMin,
    );
    return {
      to: tx.to,
      value: tx.value || BigInt(0),
      data: tx.data,
    };
  }
}
