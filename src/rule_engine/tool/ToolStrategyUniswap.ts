import { ethers } from 'ethers';
import { BlockchainReader } from '../../blockchain/blockchain_reader/BlockchainReader';
import UNISWAPV3_STRATEGY_ABI from '../../constants/abis/UNISWAPV3_STRATEGY_ABI.json';
import { IBlockchainReader } from '../../blockchain/blockchain_reader/interfaces/IBlockchainReader';

export class ToolStrategyUniswap {
  private readonly strategyAddress: string;
  private readonly blockchainReader: IBlockchainReader;

  constructor(strategyAddress: string, blockchainReader: IBlockchainReader) {
    this.strategyAddress = strategyAddress;
    this.blockchainReader = blockchainReader;
  }

  public async getPoolAddress(): Promise<string> {
    const ret = await this.blockchainReader.callViewFunction(this.strategyAddress,
      new ethers.Interface(UNISWAPV3_STRATEGY_ABI), 'pool');
    return ret as string;
  }
}


