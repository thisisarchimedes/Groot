import {AbiItem} from 'web3';
import {BlockchainNodeAdapter} from './BlockchainNodeAdapter';

/* eslint-disable @typescript-eslint/no-unused-vars */
export class BlockchainNodeUniswapAdapter extends BlockchainNodeAdapter {
  poolAddress = '0x1';
  upperTick = 100;
  lowerTick = -100;
  currentTick = 0;
  tickSpacing = 10;

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
      case 'tickSpacing':
        return this.tickSpacing;
    }
    this.isNodeHealthy = true;
    return this.currentReadResponse;
  }

  public setPoolResponse(response: unknown): void {
    this.poolAddress = response as string;
  }
  public setUpperTickResponse(tick: number): void {
    this.upperTick = tick;
  }
  public setLowerTickResponse(tick: number): void {
    this.lowerTick = tick;
  }
  public setCurrentTickResponse(tick: number): void {
    this.currentTick = tick;
  }
  public setTickSpacingResponse(tickSpacing: number): void {
    this.tickSpacing = tickSpacing;
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */
