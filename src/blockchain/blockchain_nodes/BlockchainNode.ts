import {AbiItem} from 'web3';
import {Logger} from '../../service/logger/Logger';

export class BlockchainNodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlockchainNodeError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BlockchainNodeError);
    }
  }
}

export abstract class BlockchainNode {
  protected logger: Logger;
  protected isNodeHealthy: boolean = true;
  protected nodeName: string = '';

  abstract startNode(): Promise<void>;
  abstract stopNode(): Promise<void>;
  abstract resetNode(externalProviderRpcUrl: string): Promise<void>;
  abstract recoverNode(): Promise<void>;

  abstract getBlockNumber(): Promise<number>;

  abstract callViewFunction(
    contractAddress: string,
    abi: AbiItem[],
    functionName: string,
    params: unknown[],
  ): Promise<unknown>;

  public isHealthy(): boolean {
    return this.isNodeHealthy;
  }
}
