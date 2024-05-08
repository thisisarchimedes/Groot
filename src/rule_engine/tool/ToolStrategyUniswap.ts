import UNISWAPV3_STRATEGY_ABI from '../../constants/abis/UNISWAPV3_STRATEGY_ABI.json';
import UNISWAPV3_POOL_ABI from '../../constants/abis/UNISWAPV3_POOL_ABI.json';
import {Contract} from 'ethers';
import {RawTransactionData} from '../../blockchain/OutboundTransaction';
import {IBlockchainReader} from '../../blockchain/blockchain_reader/interfaces/IBlockchainReader';
export interface UniswapStrategyPosition {
  liquidity: bigint;
  amount0: bigint;
  amount1: bigint;
}
export interface RebalanceParams {
  lowerTick: bigint;
  upperTick: bigint;
  amount0OutMin: bigint;
  amount1OutMin: bigint;
}
export class ToolStrategyUniswap {
  private readonly strategyAddress: string;
  private readonly uniswapV3StrategyABI: string;
  private readonly uniV3PoolABI: string;
  private readonly blockchainReader: IBlockchainReader;

  constructor(strategyAddress: string, blockchainReader: IBlockchainReader) {
    this.strategyAddress = strategyAddress;
    this.uniswapV3StrategyABI = JSON.stringify(UNISWAPV3_STRATEGY_ABI);
    this.uniV3PoolABI = JSON.stringify(UNISWAPV3_POOL_ABI);
    this.blockchainReader = blockchainReader;
  }

  public async getPoolAddress(): Promise<string> {
    const ret = await this.blockchainReader.callViewFunction(
        this.strategyAddress,
        this.uniswapV3StrategyABI,
        'pool',
    );
    return String(ret);
  }
  public async upperTick(): Promise<number> {
    const ret = await this.blockchainReader.callViewFunction(
        this.strategyAddress,
        this.uniswapV3StrategyABI,
        'upperTick',
    );
    return Number(ret);
  }
  public async lowerTick(): Promise<number> {
    const ret = await this.blockchainReader.callViewFunction(
        this.strategyAddress,
        this.uniswapV3StrategyABI,
        'lowerTick',
    );
    return Number(ret);
  }
  public async currentTick(): Promise<number> {
    const ret = await this.blockchainReader.callViewFunction(
        this.strategyAddress,
        this.uniswapV3StrategyABI,
        'currentTick',
    );

    return Number(ret);
  }
  public async tickSpacing(): Promise<number> {
    const poolAddress = await this.getPoolAddress();
    const ret = await this.blockchainReader.callViewFunction(
        poolAddress,
        this.uniV3PoolABI,
        'tickSpacing',
    );
    return Number(ret);
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
    const rebalanceParams: RebalanceParams = {
      upperTick: BigInt(newUpperTick),
      lowerTick: BigInt(newLowerTick),
      amount0OutMin: amount0OutMin,
      amount1OutMin: amount1OutMin,
    };
    const tx = await strategyContract['rebalance'].populateTransaction(
        rebalanceParams,
    );
    return {
      to: tx.to,
      value: 0n,
      data: tx.data,
    };
  }
}
