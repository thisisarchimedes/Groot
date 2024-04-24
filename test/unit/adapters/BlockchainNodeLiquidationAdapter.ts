import {WBTC} from '../../../src/constants/addresses';
import {BlockchainNodeAdapter} from './BlockchainNodeAdapter';

/* eslint-disable @typescript-eslint/no-unused-vars */
export class BlockchainNodeLiquidationAdapter extends BlockchainNodeAdapter {
  private getPositionResponse = '';

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
      case 'asset':
        return WBTC;
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

  public setGetPositionResponse(response: string): void {
    this.getPositionResponse = response;
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */
