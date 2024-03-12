import {IAbiFetcher} from './IAbiFetcher';
import {IAbiStorage} from './IAbiStorage';

export class AbiRepo {
  private readonly abiStorage: IAbiStorage;
  private readonly abiFetcher: IAbiFetcher;

  constructor(abiStorage: IAbiStorage, abiFetcher: IAbiFetcher) {
    this.abiStorage = abiStorage;
    this.abiFetcher = abiFetcher;
  }

  public async getAbiByAddress(contractAddress: string): Promise<string> {
    let abi = await this.abiStorage.getAbiForAddress(contractAddress);
    if (!abi) {
      abi = await this.abiFetcher.getAbiByAddress(contractAddress);
      await this.abiStorage.storeAbiForAddress(contractAddress, abi);
    }
    return abi;
  }
}
