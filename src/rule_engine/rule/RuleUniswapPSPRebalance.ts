import { inject, injectable } from 'inversify';
import { ToolStrategyUniswap } from '../tool/ToolStrategyUniswap';
import { Rule, RuleParams } from './Rule';
import { ILogger } from '../../service/logger/interfaces/ILogger';
import { IBlockchainReader } from '../../blockchain/blockchain_reader/interfaces/IBlockchainReader';
import { IAbiRepo } from '../tool/abi_repository/interfaces/IAbiRepo';

/* eslint-disable max-len */
export interface RuleParamsUniswapPSPRebalance extends RuleParams {
  upperTriggerThresholdPercentage: number, // trigger rebalance when we are more than (upperThreshold% * upper tick)
  lowerTriggerThresholdPercentage: number, // trigger rebalance when we are less than (lowerThreshold% * lower tick)
  upperTargetTickPercentage: number, // Where we want to be after rebalance currentUniswapTick * newUpperTickPercentage = newUpperTick
  lowerTargetTickPercentage: number, // Where we want to be after rebalance currentUniswapTick * newLowerTickPercentage = newLowerTick
  strategyAddress: string,
}
/* eslint-enable max-len */


@injectable()
export class RuleUniswapPSPRebalance extends Rule {
  private uniswapStrategy: ToolStrategyUniswap;
  constructor(
    @inject('ILoggerAll') logger: ILogger,
    @inject('IBlockchainReader') blockchainReader: IBlockchainReader,
    @inject('IAbiRepo') abiRepo: IAbiRepo) {
    super(logger, blockchainReader, abiRepo);
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

