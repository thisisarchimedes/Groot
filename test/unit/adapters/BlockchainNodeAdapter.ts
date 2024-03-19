import {AbiItem} from 'web3';
import {
  BlockchainNode,
  BlockchainNodeError,
  BlockchainNodeProxyInfo,
} from '../../../src/blockchain/blockchain_nodes/BlockchainNode';

/* eslint-disable @typescript-eslint/no-unused-vars */
export class BlockchainNodeAdapter extends BlockchainNode {
  protected currentBlockNumber: number = 100;
  protected currentReadResponse: unknown = {};
  protected throwErrorOnGetBlockNumber: boolean = false;
  protected throwErrorOnCallViewFunction: boolean = false;
  protected expectRecoverToSucceed: boolean = true;
  protected proxyInfo!: BlockchainNodeProxyInfo;

  public async startNode(): Promise<void> {}

  public async stopNode(): Promise<void> {}

  public async resetNode(externalProviderRpcUrl: string): Promise<void> {}

  // eslint-disable-next-line require-await
  public async recoverNode(): Promise<void> {
    if (this.expectRecoverToSucceed) {
      this.isNodeHealthy = true;
    } else {
      throw new BlockchainNodeError(
          `RecoverNode: Cannot recover ${this.nodeName}`,
      );
    }
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

  public getProxyInfoForAddress(
      proxyAddress: string,
  ): Promise<BlockchainNodeProxyInfo> {
    return Promise.resolve(this.proxyInfo);
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

  public setExpectRecoverToSucceed(expectRecoverToSucceed: boolean): void {
    this.expectRecoverToSucceed = expectRecoverToSucceed;
  }
  public setProxyInfoForAddressResponse(
      proxyInfo: BlockchainNodeProxyInfo,
  ): void {
    this.proxyInfo = proxyInfo;
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */
