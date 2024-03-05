import {AbiItem} from 'web3';

export class BlockchainNodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocalNodeError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BlockchainNodeError);
    }
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface BlockchainNode {

  startNode(): Promise<void>;
  stopNode(): Promise<void>;
  resetNode(externalProviderRpcUrl: string): Promise<void>;

  getBlockNumber(): Promise<bigint>;

  callViewFunction(
    contractAddress: string,
    abi: AbiItem[],
    functionName: string,
    params: any[],
  ): Promise<any>;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
