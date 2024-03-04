import {AbiItem} from 'web3';
import {LocalNode} from '../../../src/blockchain_reader/LocalNode';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
export class LocalNodeAdapter implements LocalNode {
  private currentBlockNumber: bigint = BigInt(0);
  private currentReadResponse: any = {};


  public async startNode(): Promise<void> {

  }

  public async stopNode(): Promise<void> {

  }

  public async resetNode(externalProviderRpcUrl: string): Promise<void> {

  }

  // eslint-disable-next-line require-await
  public async getBlockNumber(): Promise<bigint> {
    return BigInt(this.currentBlockNumber);
  }

  // eslint-disable-next-line require-await
  public async callViewFunction(
      contractAddress: string,
      abi: AbiItem[],
      functionName: string,
      params: any[],
  ): Promise<any> {
    return this.currentReadResponse;
  }

  public setBlockNumber(blockNumber: number): void {
    this.currentBlockNumber = BigInt(blockNumber);
  }

  public setReadResponse(response: any): void {
    this.currentReadResponse = response;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
