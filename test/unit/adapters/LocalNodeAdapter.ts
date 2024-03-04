import {AbiItem} from 'web3';
import {LocalNode} from '../../../src/blockchain_reader/LocalNode';

/* eslint-disable @typescript-eslint/no-explicit-any */
export class LocalNodeAdapter implements LocalNode {
  private currentBlockNumber: bigint = BigInt(0);


  public async startNode(): Promise<void> {

  }

  public async stopNode(): Promise<void> {

  }

  public async resetNode(externalProviderRpcUrl: string): Promise<void> {

  }

  public async getBlockNumber(): Promise<bigint> {
    return BigInt(this.currentBlockNumber);
  }

  public async callViewFunction(
      contractAddress: string,
      abi: AbiItem[],
      functionName: string,
      params: any[],
  ): Promise<any> {
    return Promise.resolve({});
  }

  public setBlockNumber(blockNumber: number): void {
    this.currentBlockNumber = BigInt(blockNumber);
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
