import {AbiItem} from 'web3';

export class BlockchainNodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlockchainNodeError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BlockchainNodeError);
    }
  }
}

export interface BlockchainNode {

  startNode(): Promise<void>;
  stopNode(): Promise<void>;
  resetNode(externalProviderRpcUrl: string): Promise<void>;
  recoverNode(): Promise<void>;

  getBlockNumber(): Promise<number>;

  callViewFunction(
    contractAddress: string,
    abi: AbiItem[],
    functionName: string,
    params: unknown[],
  ): Promise<unknown>;
}
