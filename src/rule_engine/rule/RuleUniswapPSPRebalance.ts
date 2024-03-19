import { BlockchainReader } from "../../blockchain/blockchain_reader/BlockchainReader";
import { Logger } from "../../service/logger/Logger";
import { ToolStrategyUniswap } from "../tool/ToolStrategyUniswap";
import { Rule, RuleParams } from "./Rule";
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
  constructor(
    logger: Logger,
    blockchainReader: BlockchainReader,
    ruleLabel: string,
    params: RuleParams
  ) {
    super(logger, blockchainReader, ruleLabel, params);
    this.uniswapStrategy = new ToolStrategyUniswap(
      (params as RuleParamsUniswapPSPRebalance).strategyAddress,
      blockchainReader
    );
  }
  public async evaluate(): Promise<void> {
    // if not calculate new lowertick and uppertick based on the currentTick
    // call rebalance function based on the new params
    const params = this.params as RuleParamsUniswapPSPRebalance;
    const currentTick = await this.uniswapStrategy.currentTick();
    const upperTick = await this.uniswapStrategy.upperTick();
    const lowerTick = await this.uniswapStrategy.lowerTick();
    const acceptedUpperTick =
      (params.upperTriggerThresholdPercentage * upperTick) / 100;
    const acceptedLowerTick =
      (params.lowerTriggerThresholdPercentage * lowerTick) / 100;
    if (currentTick <= acceptedUpperTick || currentTick >= acceptedLowerTick) {
      return;
    }
  }

  protected generateUniqueKey(): string {
    throw new Error("Method not implemented.");
  }
}
