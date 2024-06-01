import {Contract} from 'ethers';
import {RawTransactionData} from '../../blockchain/OutboundTransaction';
import {IBlockchainReader} from '../../blockchain/blockchain_reader/interfaces/IBlockchainReader';
import ERC20_ABI from '../../../constants/abis/ERC20_ABI.json';
export class ERC20Tool {
  private readonly ERC20ABI: string;

  private readonly blockchainReader: IBlockchainReader;

  constructor(blockchainReader: IBlockchainReader) {
    this.ERC20ABI = JSON.stringify(ERC20_ABI);
    this.blockchainReader = blockchainReader;
  }

  public async decimals(tokenAddress: string): Promise<bigint> {
    const res = await this.blockchainReader.callViewFunction(
        tokenAddress,
        this.ERC20ABI,
        'decimals',
    );
    return res;
  }
}
