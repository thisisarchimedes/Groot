import {BlockchainNodeAdapter} from './BlockchainNodeAdapter';

/* eslint-disable @typescript-eslint/no-unused-vars */
export class BlockchainNodeUniswapAdapter extends BlockchainNodeAdapter {
  poolAddress = '0x1';
  upperTick = 100;
  lowerTick = -100;
  currentTick = 0;
  tickSpacing = 10;
  currentPosition = [BigInt(0), BigInt(0), BigInt(0)];

  // eslint-disable-next-line require-await
  public override async callViewFunction(
      contractAddress: string,
      abi: string,
      functionName: string,
      params?: unknown[],
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
      case 'getPosition':
        return this.currentPosition;
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
  public setCurrentPositionResponse(
      liquidity: bigint,
      amount0: bigint,
      amount1: bigint,
  ): void {
    this.currentPosition = [liquidity, amount0, amount1];
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */
