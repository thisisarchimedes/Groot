import { BlockchainReader } from "../../blockchain/blockchain_reader/BlockchainReader";
import { Logger } from "../../service/logger/Logger";
import { ToolStrategyUniswap } from "../tool/ToolStrategyUniswap";
import { Rule, RuleConstructorInput, RuleParams } from "./Rule";
// import {UNISWAPV3_POOL_ABI} from '@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json';
/* eslint-disable max-len */
export interface RuleParamsUniswapPSPRebalance extends RuleParams {
  upperTriggerThresholdPercentage: number; // trigger rebalance when we are more than (upperThreshold% * upper tick)
  lowerTriggerThresholdPercentage: number; // trigger rebalance when we are less than (lowerThreshold% * lower tick)
  upperTargetTickPercentage: number; // Where we want to be after rebalance currentUniswapTick * newUpperTickPercentage = newUpperTick
  lowerTargetTickPercentage: number; // Where we want to be after rebalance currentUniswapTick * newLowerTickPercentage = newLowerTick
  strategyAddress: string;
}
/* eslint-enable max-len */

export class RuleUniswapPSPRebalance extends Rule {
  private uniswapStrategy: ToolStrategyUniswap;
  constructor(constructorInput: RuleConstructorInput) {
    super(constructorInput);
    this.uniswapStrategy = new ToolStrategyUniswap(
      (
        constructorInput.params as RuleParamsUniswapPSPRebalance
      ).strategyAddress,
      constructorInput.blockchainReader
    );
  }
  public async evaluate(): Promise<void> {
    // if not calculate new lowertick and uppertick based on the currentTick
    // call rebalance function based on the new params
    const isUpperTickThresholdPassed =
      await this.isCurrentTickAboveRebalanceUpperTickThreshold();
    const isLowerTickThresholdPassed =
      await this.isCurrentTickBelowRebalanceLowerTickThreshold();

    if (!isUpperTickThresholdPassed && !isLowerTickThresholdPassed) {
      return;
    }
    const newUpperTick = await this.calculateNewUpperTick();
    this.logger.info(`New upper tick: ${newUpperTick}`);
  }

  private async isCurrentTickAboveRebalanceUpperTickThreshold(): Promise<boolean> {
    const currentTick = await this.uniswapStrategy.currentTick();
    const upperTick = await this.uniswapStrategy.upperTick();
    const params = this.params as RuleParamsUniswapPSPRebalance;
    const acceptedUpperTick =
      (params.upperTriggerThresholdPercentage * upperTick) / 100;
    return currentTick <= acceptedUpperTick;
  }

  private async isCurrentTickBelowRebalanceLowerTickThreshold(): Promise<boolean> {
    const currentTick = await this.uniswapStrategy.currentTick();
    const lowerTick = await this.uniswapStrategy.lowerTick();
    const params = this.params as RuleParamsUniswapPSPRebalance;
    const acceptedLowerTick =
      (params.lowerTriggerThresholdPercentage * lowerTick) / 100;
    return currentTick >= acceptedLowerTick;
  }
  private async calculateNewUpperTick(): Promise<number> {
    const currentTick = await this.uniswapStrategy.currentTick();
    const tickSpacing = await this.uniswapStrategy.tickSpacing();
    const params = this.params as RuleParamsUniswapPSPRebalance;
    let upperTick = Number(
      (currentTick * params.upperTargetTickPercentage) / 100
    );
    upperTick = Math.round(upperTick / tickSpacing) * tickSpacing;
    return upperTick;
  }
  protected generateUniqueKey(): string {
    throw new Error("Method not implemented.");
  }
}
