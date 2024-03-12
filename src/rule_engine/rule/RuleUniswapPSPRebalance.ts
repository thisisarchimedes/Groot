import {BlockchainReader} from '../../blockchain/blockchain_reader/BlockchainReader';
import {Logger} from '../../service/logger/Logger';
import {ToolStrategyUniswap} from '../tool/ToolStrategyUniswap';
import {Rule, RuleParams} from './Rule';
// import {UNISWAPV3_POOL_ABI} from '@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json';
/* eslint-disable max-len */
export interface RuleParamsUniswapPSPRebalance extends RuleParams {
  pperTriggerThresholdPercentage: number; // trigger rebalance when we are more than (upperThreshold% * upper tick)
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
      params: RuleParams,
  ) {
    super(logger, blockchainReader, ruleLabel, params);
    this.uniswapStrategy = new ToolStrategyUniswap(
        (params as RuleParamsUniswapPSPRebalance).strategyAddress,
        blockchainReader,
    );
  }
  public async evaluate(): Promise<void> {
    // check if based on the thresholds if we are in proper range then no action
    // if not calculate new lowertick and uppertick based on the currentTick
    // call rebalance function based on the new params
    // const pool = await this.uniswapStrategy.getPoolAddress();
    // const currentTick = await this.blockchainReader.callViewFunction(
    //     pool,
    //     UNISWAPV3_POOL_ABI,
    //     'slot0',
    // );
    // const upperTick = await this.uniswapStrategy.upperTick();
    // const lowerTick = await this.uniswapStrategy.lowerTick();
  }

  protected generateUniqueKey(): string {
    throw new Error('Method not implemented.');
  }
}
