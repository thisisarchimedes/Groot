import {BlockchainNodeAdapter} from './BlockchainNodeAdapter';

/* eslint-disable @typescript-eslint/no-unused-vars */
export class BlockchainNodeBalancerComposableAdapter extends BlockchainNodeAdapter {
  lastAdjustInTimestamp = BigInt(0);
  lastAdjustOutTimestamp = BigInt(0);
  poolTokens = {
    tokens: ['0x1', '0x2'],
    balances: [BigInt(100), BigInt(200)],
    lastChangeBlock: BigInt(0),
  };
  poolId = '0x1';
  adapterUnderlyingBalance = BigInt(0);
  adapterLpBalance = BigInt(0);
  pool = '0x1';
  underlyingToken = '0x1';

  // eslint-disable-next-line
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
      case 'lastAdjustIn':
        return this.lastAdjustInTimestamp;
      case 'lastAdjustOut':
        return this.lastAdjustOutTimestamp;
      case 'getPoolTokens':
        return this.poolTokens;
      case 'poolId':
        return this.poolId;
      case 'underlyingBalance':
        return this.adapterUnderlyingBalance;
      case 'lpBalance':
        return this.adapterLpBalance;
      case 'pool':
        return this.pool;
      case 'underlyingToken':
        return this.underlyingToken;
      case 'decimals':
        return 18;
    }
    this.isNodeHealthy = true;
    return this.currentReadResponse;
  }

  public setLastAdjustInTimestampResponse(timestamp: bigint): void {
    this.lastAdjustInTimestamp = timestamp;
  }
  public setLastAdjustOutTimestampResponse(timestamp: bigint): void {
    this.lastAdjustOutTimestamp = timestamp;
  }
  public setPoolTokensResponse(
      tokens: string[],
      balances: bigint[],
      lastChangeBlock: bigint,
  ): void {
    this.poolTokens = {tokens, balances, lastChangeBlock};
  }
  public setPoolIdResponse(poolId: string): void {
    this.poolId = poolId;
  }
  public setAdapterUnderlyingBalanceResponse(balance: bigint): void {
    this.adapterUnderlyingBalance = balance;
  }
  public setAdapterLpBalanceResponse(balance: bigint): void {
    this.adapterLpBalance = balance;
  }
  public setPoolResponse(pool: string): void {
    this.pool = pool;
  }
  public setUnderlyingTokenResponse(token: string): void {
    this.underlyingToken = token;
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */
