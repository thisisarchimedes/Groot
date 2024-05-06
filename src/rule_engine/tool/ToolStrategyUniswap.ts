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
  private readonly uniswapV3StrategyABI: string;
  private readonly blockchainReader: IBlockchainReader;

  constructor(strategyAddress: string, blockchainReader: IBlockchainReader) {
    this.strategyAddress = strategyAddress;
    this.uniswapV3StrategyABI = JSON.stringify(UNISWAPV3_STRATEGY_ABI);
    this.blockchainReader = blockchainReader;
  }

  public async getPoolAddress(): Promise<string> {
    const ret = await this.blockchainReader.callViewFunction(
        this.strategyAddress,
        this.uniswapV3StrategyABI,
        'pool',
    );
    return ret as string;
  }
  public async upperTick(): Promise<number> {
    const ret = await this.blockchainReader.callViewFunction(
        this.strategyAddress,
        this.uniswapV3StrategyABI,
        'upperTick',
    );
    return ret as number;
  }
  public async lowerTick(): Promise<number> {
    const ret = await this.blockchainReader.callViewFunction(
        this.strategyAddress,
        this.uniswapV3StrategyABI,
        'lowerTick',
    );
    return ret as number;
  }
  public async currentTick(): Promise<number> {
    const ret = await this.blockchainReader.callViewFunction(
        this.strategyAddress,
        this.uniswapV3StrategyABI,
        'currentTick',
    );
    return ret as number;
  }
  public async tickSpacing(): Promise<number> {
    const poolAddress = await this.getPoolAddress();
    const ret = await this.blockchainReader.callViewFunction(
        poolAddress,
        this.uniswapV3StrategyABI,
        'tickSpacing',
    );
    return ret as number;
  }
  public async getPosition(): Promise<UniswapStrategyPosition> {
    const ret = (await this.blockchainReader.callViewFunction(
        this.strategyAddress,
        this.uniswapV3StrategyABI,
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
        this.uniswapV3StrategyABI,
    );
    const tx = await strategyContract['rebalance'].populateTransaction(
        newLowerTick,
        newUpperTick,
        amount0OutMin,
        amount1OutMin,
    );
    return {
      to: tx.to,
      value: 0n,
      data: tx.data,
    };
  }
}
