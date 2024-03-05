import {AbiItem} from 'web3';
import {BlockchainNode} from '../../../src/blockchain_nodes/BlockchainNode';

/* eslint-disable @typescript-eslint/no-unused-vars */
export class BlockchainNodeAdapter implements BlockchainNode {
  private currentBlockNumber: number = 0;
  private currentReadResponse: unknown = {};


  public async startNode(): Promise<void> {

  }

  public async stopNode(): Promise<void> {

  }

  public async resetNode(externalProviderRpcUrl: string): Promise<void> {

  }

  // eslint-disable-next-line require-await
  public async getBlockNumber(): Promise<number> {
    return this.currentBlockNumber;
  }

  // eslint-disable-next-line require-await
  public async callViewFunction(
      contractAddress: string,
      abi: AbiItem[],
      functionName: string,
      params: unknown[],
  ): Promise<unknown> {
    return this.currentReadResponse;
  }

  public setBlockNumber(blockNumber: number): void {
    this.currentBlockNumber = blockNumber;
  }

  public setReadResponse(response: unknown): void {
    this.currentReadResponse = response;
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */
