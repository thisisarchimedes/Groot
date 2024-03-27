import {ToolStrategyUniswap} from '../tool/ToolStrategyUniswap';
import {Rule, RuleConstructorInput, RuleParams} from './Rule';

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
  private uniswapStrategy: ToolStrategyUniswap;
  constructor(constractorInput: RuleConstructorInput) {
    super(constractorInput);
    this.uniswapStrategy = new ToolStrategyUniswap(
        (this.params as RuleParamsUniswapPSPRebalance).strategyAddress,
        this.blockchainReader);
  }
  public async evaluate(): Promise<void> {
    // fetch the pool address from strategy
    // fetch the currentTick from uniswap pool
    // fetch the upper and lower tick from strategy
    // check if based on the thresholds if we are in proper range then no action
    // if not calculate new lowertick and uppertick based on the currentTick
    // call rebalance function based on the new params

    // const pool = await this.uniswapStrategy.getPoolAddress();
    // --> this.abiRepo.getAbiByAddress(pool);
  }

  protected generateUniqueKey(): string {
    throw new Error('Method not implemented.');
  }
}

