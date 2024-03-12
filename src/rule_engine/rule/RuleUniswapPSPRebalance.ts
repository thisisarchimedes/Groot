import {Rule, RuleParams} from './Rule';

/* eslint-disable max-len */
export interface RuleParamsUniswapPSPRebalance extends RuleParams {
    pperTriggerThresholdPercentage: number, // trigger rebalance when we are more than (upperThreshold% * upper tick)
    lowerTriggerThresholdPercentage: number, // trigger rebalance when we are less than (lowerThreshold% * lower tick)
    upperTargetTickPercentage: number, // Where we want to be after rebalance currentUniswapTick * newUpperTickPercentage = newUpperTick
    lowerTargetTickPercentage: number, // Where we want to be after rebalance currentUniswapTick * newLowerTickPercentage = newLowerTick
    strategyAddress: string,
}
/* eslint-enable max-len */

export class RuleUniswapPSPRebalance extends Rule {
  public async evaluate(): Promise<void> {

  }

  protected generateUniqueKey(): string {
    throw new Error('Method not implemented.');
  }
}

