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

  public async setPoolResponse(response: unknown): Promise<void> {
    this.poolAddress = response as string;
  }
  public async setUpperTickResponse(tick: number): Promise<void> {
    this.upperTick = tick;
  }
  public async setLowerTickResponse(tick: number): Promise<void> {
    this.lowerTick = tick;
  }
  public async setCurrentTickResponse(tick: number): Promise<void> {
    this.currentTick = tick;
  }
  public async setTickSpacingResponse(tickSpacing: number): Promise<void> {
    this.tickSpacing = tickSpacing;
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */
