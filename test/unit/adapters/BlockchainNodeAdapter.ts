import {
  BlockchainNodeError,
} from '../../../src/blockchain/blockchain_nodes/BlockchainNode';
import {BlockchainNodeProxyInfo} from '../../../src/blockchain/blockchain_nodes/BlockchainNodeProxyInfo';
import {BlockchainNodeLocal} from '../../../src/blockchain/blockchain_nodes/BlockchainNodeLocal';
import {ModulesParams} from '../../../src/types/ModulesParams';


/* eslint-disable @typescript-eslint/no-unused-vars */
export class BlockchainNodeAdapter extends BlockchainNodeLocal {
  protected currentBlockNumber: number = 100;
  protected currentReadResponse: unknown = {};
  protected overlimitReadResponse: unknown = {};
  protected throwErrorOnGetBlockNumber: boolean = false;
  protected throwErrorOnCallViewFunction: boolean = false;
  protected expectRecoverToSucceed: boolean = true;
  protected proxyInfo!: BlockchainNodeProxyInfo;
  protected responseLimit = 0;
  protected responseCount = 0;

  constructor(modulesParams: ModulesParams, nodeName: string) {
    super(modulesParams, '', nodeName);
  }

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
      abi: string,
      functionName: string,
      params?: unknown[],
  ): Promise<unknown> {
    if (this.throwErrorOnCallViewFunction) {
      throw new Error('callViewFunction: Error');
    }
    this.isNodeHealthy = true;
    if (this.responseLimit > 0) {
      if (this.responseCount < this.responseLimit) {
        this.responseCount++;
        return this.currentReadResponse;
      } else {
        return this.overlimitReadResponse;
      }
    }
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

  public setResponseLimit(limit: number): void {
    this.responseLimit = limit;
  }

  public setResponseForOverlimit(response: unknown): void {
    this.overlimitReadResponse = response;
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
