import {
  BlockchainNodeError,
} from '../../../src/blockchain/blockchain_nodes/BlockchainNode';
import {BlockchainNodeProxyInfo} from '../../../src/blockchain/blockchain_nodes/BlockchainNodeProxyInfo';
import {BlockchainNodeLocal} from '../../../src/blockchain/blockchain_nodes/BlockchainNodeLocal';
import {ModulesParams} from '../../../src/types/ModulesParams';
import {Block} from 'ethers';


/* eslint-disable @typescript-eslint/no-unused-vars */
export class BlockchainNodeAdapter extends BlockchainNodeLocal {
  protected currentBlockNumber: number = 100;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  protected mockBlock: Block = {
    hash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f',
    parentHash: '0xf1e2d3c4b5a6978877665544332211ffeeddccbbaa9988776655443322110000',
    number: 12345678,
    timestamp: Math.floor(Date.now() / 1000),
    nonce: '0x0000000000000042',
    difficulty: 2n ** 22n,
    gasLimit: BigInt(15000000),
    gasUsed: BigInt(735000),
    miner: '0x3f4e0668c20e100d7c2a27d4b177ac65b2875d26',
    extraData: '0xd883010a05846765746888676f312e31352e36856c696e7578',
    transactions: [
      '0xb0620614f3a2b66d36752021f134b077500ca4678b8abcded8e55e4886c758d2',
      '0xd5f9a1230a56e5baf7c025b0ebe04c9abdb13a72bdc8c7905d3b4a3d3e7c641b',
    ],
  };
  protected currentReadResponse: unknown = {};
  protected overlimitReadResponse: unknown = {};
  protected throwErrorOnGetBlockNumber: boolean = false;
  protected throwErrorOnCallViewFunction: boolean = false;
  protected expectRecoverToSucceed: boolean = true;
  protected proxyInfo: Map<string, BlockchainNodeProxyInfo> = new Map();
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

  public override getBlockNumber(): Promise<number> {
    if (this.throwErrorOnGetBlockNumber) {
      throw new Error('getBlockNumber: Error');
    }
    this.isNodeHealthy = true;
    return Promise.resolve(this.currentBlockNumber);
  }

  public override getBlock(blockNumber: number): Promise<Block> {
    return Promise.resolve(this.mockBlock);
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
    const data = this.proxyInfo.get(proxyAddress);
    if (!data) {
      throw new Error(`Proxy info for address ${proxyAddress} not found in the adapter`);
    }
    return Promise.resolve(data);
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

  public resetResponseCount(): void {
    this.responseCount = 0;
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
      address: string,
      proxyInfo: BlockchainNodeProxyInfo,
  ): void {
    this.proxyInfo.set(address, proxyInfo);
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */
