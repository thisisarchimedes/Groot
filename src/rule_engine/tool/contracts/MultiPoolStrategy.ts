import {ethers} from 'ethers';
import MULTI_POOL_STRATEGY_ABI from '../../../constants/abis/MULTI_POOL_STRATEGY_ABI.json';
import EthereumAddress from '../../../types/EthereumAddress';

class MultiPoolStrategy {
  private contract: ethers.Contract;

  constructor(contractAddress: EthereumAddress) {
    this.contract = new ethers.Contract(contractAddress.toString(), MULTI_POOL_STRATEGY_ABI);
  }

  async convertToAssets(shares: bigint): Promise<bigint> {
    return await this.contract.convertToAssets(shares);
  }

  async decimals(): Promise<number> {
    return await this.contract.decimals();
  }

  async asset(): Promise<string> {
    return await this.contract.asset();
  }
}

export default MultiPoolStrategy;
