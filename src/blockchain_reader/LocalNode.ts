import {AbiItem} from 'web3';

export class LocalNodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocalNodeError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LocalNodeError);
    }
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface LocalNode {

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
