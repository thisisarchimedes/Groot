import 'reflect-metadata';

import {injectable, inject} from 'inversify';

import {IBlockchainReader} from '../../../blockchain/blockchain_reader/interfaces/IBlockchainReader';
import {IAbiFetcher} from './interfaces/IAbiFetcher';
import {IAbiStorage} from './interfaces/IAbiStorage';
import {IAbiRepo} from './interfaces/IAbiRepo';

@injectable()
export class AbiRepo implements IAbiRepo {
  private readonly blockchainReader: IBlockchainReader;
  private readonly abiStorage: IAbiStorage;
  private readonly abiFetcher: IAbiFetcher;


  constructor(
    @inject('IBlockchainReader') _blockchainReader: IBlockchainReader,
    @inject('IAbiStorageDynamoDB') _abiStorage: IAbiStorage,
    @inject('IAbiFetcherEtherScan') _abiFetcher: IAbiFetcher,
  ) {
    this.blockchainReader = _blockchainReader;
    this.abiStorage = _abiStorage;
    this.abiFetcher = _abiFetcher;
  }

  public async getAbiByAddress(contractAddress: string): Promise<string> {
    const implementationAddress = await this.getImplementationAddress(contractAddress);
    const abi = await this.getAbi(implementationAddress);
    return abi;
  }

  private async getImplementationAddress(contractAddress: string): Promise<string> {
    const proxyInfo = await this.blockchainReader.getProxyInfoForAddress(contractAddress);
    return proxyInfo.isProxy ? proxyInfo.implementationAddress : contractAddress;
  }

  private async getAbi(contractAddress: string): Promise<string> {
    const abi = await this.abiStorage.getAbiForAddress(contractAddress);
    return abi || await this.fetchAndStoreAbi(contractAddress);
  }

  private async fetchAndStoreAbi(contractAddress: string): Promise<string> {
    const abi = await this.abiFetcher.getAbiByAddress(contractAddress);
    await this.abiStorage.storeAbiForAddress(contractAddress, abi);
    return abi;
  }
}
