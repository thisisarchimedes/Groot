import {AbiItem} from 'web3';
import {BlockchainNode} from '../../../src/blockchain/blockchain_nodes/BlockchainNode';

/* eslint-disable @typescript-eslint/no-unused-vars */
export class BlockchainNodeAdapter extends BlockchainNode {
  private currentBlockNumber: number = 100;
  private currentReadResponse: unknown = {};
  private throwErrorOnGetBlockNumber: boolean = false;
  private throwErrorOnCallViewFunction: boolean = false;


  public async startNode(): Promise<void> {

  }

  public async stopNode(): Promise<void> {

  }

  public async resetNode(externalProviderRpcUrl: string): Promise<void> {

  }

  // eslint-disable-next-line require-await
  public async recoverNode(): Promise<void> {
    this.isNodeHealthy = true;
  }

  // eslint-disable-next-line require-await
  public async getBlockNumber(): Promise<number> {
    if (this.throwErrorOnGetBlockNumber) {
      throw new Error('getBlockNumber: Error');
    }
    this.isNodeHealthy = true;
    return this.currentBlockNumber;
  }

  // eslint-disable-next-line require-await
  public async callViewFunction(
      contractAddress: string,
      abi: AbiItem[],
      functionName: string,
      params: unknown[],
  ): Promise<unknown> {
    if (this.throwErrorOnCallViewFunction) {
      throw new Error('callViewFunction: Error');
    }
    this.isNodeHealthy = true;
    return this.currentReadResponse;
  }

  public setThrowErrorOnCallViewFunction(throwError: boolean): void {
    this.throwErrorOnCallViewFunction = throwError;
  }

  public setThrowErrorOnGetBlockNumber(throwError: boolean): void {
    this.throwErrorOnGetBlockNumber = throwError;
  }

  public setBlockNumber(blockNumber: number): void {
    this.currentBlockNumber = blockNumber;
  }

  public setReadResponse(response: unknown): void {
    this.currentReadResponse = response;
  }

  public setNodeHealthy(healthy: boolean): void {
    this.isNodeHealthy = healthy;
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */