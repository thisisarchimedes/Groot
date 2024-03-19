import {AbiItem} from 'web3';
import {BlockchainNodeAdapter} from './BlockchainNodeAdapter';

/* eslint-disable @typescript-eslint/no-unused-vars */
export class BlockchainNodeUniswapAdapter extends BlockchainNodeAdapter {
  poolAddress = '0x1';
  upperTick = 100;
  lowerTick = -100;
  currentTick = 0;

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
    switch (functionName) {
      case 'pool':
        return this.poolAddress;
      case 'upperTick':
        return this.upperTick;
      case 'lowerTick':
        return this.lowerTick;
      case 'currentTick':
        return this.currentTick;
    }
    this.isNodeHealthy = true;
    return this.currentReadResponse;
  }

  public setPoolResponse(response: unknown): void {
    this.poolAddress = response as string;
  }
  public setUpperTickResponse(response: unknown): void {
    this.upperTick = response as number;
  }
  public setLowerTickResponse(response: unknown): void {
    this.lowerTick = response as number;
  }
  public setCurrentTickResponse(response: unknown): void {
    this.currentTick = response as number;
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */
