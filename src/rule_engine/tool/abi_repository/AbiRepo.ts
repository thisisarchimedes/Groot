import {BlockchainReader} from '../../../blockchain/blockchain_reader/BlockchainReader';
import {IAbiFetcher} from './IAbiFetcher';
import {IAbiStorage} from './IAbiStorage';

export class AbiRepo {
  private readonly abiStorage: IAbiStorage;
  private readonly abiFetcher: IAbiFetcher;
  private readonly blockchainReader: BlockchainReader;

  constructor(blockchainReader: BlockchainReader, abiStorage: IAbiStorage, abiFetcher: IAbiFetcher) {
    this.abiStorage = abiStorage;
    this.abiFetcher = abiFetcher;
    this.blockchainReader = blockchainReader;
  }

  public async getAbiByAddress(contractAddress: string): Promise<string> {
    const proxyInfo = await this.blockchainReader.getProxyInfoForAddress(contractAddress);
    if (proxyInfo.isProxy) {
      contractAddress = proxyInfo.implementationAddress;
    }

    let abi = await this.abiStorage.getAbiForAddress(contractAddress);
    if (!abi) {
      abi = await this.abiFetcher.getAbiByAddress(contractAddress);
      await this.abiStorage.storeAbiForAddress(contractAddress, abi);
    }
    return abi;
  }
}
