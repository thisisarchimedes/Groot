import {Rule} from './Rule';
import {RuleConstructorInput, RuleParams} from '../TypesRule';
import {OutboundTransaction} from '../../blockchain/OutboundTransaction';
import {ToolStrategyUniswap} from '../tool/ToolStrategyUniswap';

/* eslint-disable max-len */
export interface RuleParamsUniswapPSPRebalance extends RuleParams {
  upperTriggerThresholdPercentage: number; // trigger rebalance when we are more than (upperThreshold% * upper tick)
  lowerTriggerThresholdPercentage: number; // trigger rebalance when we are less than (lowerThreshold% * lower tick)
  upperTargetTickPercentage: number; // Where we want to be after rebalance currentUniswapTick * newUpperTickPercentage = newUpperTick
  lowerTargetTickPercentage: number; // Where we want to be after rebalance currentUniswapTick * newLowerTickPercentage = newLowerTick
  strategyAddress: string;
  slippagePercentage: number; // slippage percentage for the rebalance in 10000 scale
}

export interface MinOutputAmounts {
  minOut0Amount: bigint;
  minOut1Amount: bigint;
}
/* eslint-enable max-len */

export class RuleUniswapPSPRebalance extends Rule {
  private uniswapStrategy: ToolStrategyUniswap;
  private strategyAddress: string;

  constructor(input: RuleConstructorInput) {
    super(input);
    this.uniswapStrategy = new ToolStrategyUniswap(
        (input.params as RuleParamsUniswapPSPRebalance).strategyAddress,
        input.blockchainReader,
    );
    this.strategyAddress = (
      input.params as RuleParamsUniswapPSPRebalance
    ).strategyAddress;
  }

  public async evaluate(): Promise<void> {
    this.logger.info('RuleUniswapPSPRebalance.evaluate() called');

    // call rebalance function based on the new params
    const isUpperTickThresholdNotPassed =
      await this.isCurrentTickBelowRebalanceUpperTickThreshold();
    const isLowerTickThresholdNotPassed =
      await this.isCurrentTickAboveRebalanceLowerTickThreshold();

    if (isUpperTickThresholdNotPassed && isLowerTickThresholdNotPassed) {
      this.logger.info('RuleUniswapPSPRebalance: Tick is within the range');
      return;
    }

    const newUpperTick = await this.calculateNewUpperTick();
    const newLowerTick = await this.calculateNewLowerTick();
    const minOutputAmounts = await this.calculateMinOOutAndMin1Out();
    const tx: OutboundTransaction = {
      urgencyLevel: this.params.urgencyLevel,
      context: 'UniswapPSPRebalance',
      executor: this.params.executor,
      postEvalUniqueKey: this.generateUniqueKey(),
      lowLevelUnsignedTransaction:
        await this.uniswapStrategy.createRebalanceTransaction(
            newUpperTick,
            newLowerTick,
            minOutputAmounts.minOut0Amount,
            minOutputAmounts.minOut1Amount,
        ),
      ttlSeconds: this.params.ttlSeconds,
    };

    this.logger.info(`Rebalancing Uniswap PSP strategy ${this.strategyAddress} [
      ${newUpperTick},
      ${newLowerTick},
      ${minOutputAmounts.minOut0Amount},
      ${minOutputAmounts.minOut1Amount}
    ]`);

    this.pushTransactionToRuleLocalQueue(tx);
  }

  private async isCurrentTickBelowRebalanceUpperTickThreshold(): Promise<boolean> {
    const currentTick = await this.uniswapStrategy.currentTick();
    const upperTick = await this.uniswapStrategy.upperTick();
    const params = this.params as RuleParamsUniswapPSPRebalance;
    const acceptedUpperTick =
      (params.upperTriggerThresholdPercentage * upperTick) / 100;
    return currentTick <= acceptedUpperTick;
  }

  private async isCurrentTickAboveRebalanceLowerTickThreshold(): Promise<boolean> {
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
        (currentTick * params.upperTargetTickPercentage) / 100,
    );
    upperTick = Math.round(upperTick / tickSpacing) * tickSpacing;

    this.logger.info(`New upper tick: ${upperTick}`);

    return upperTick;
  }

  private async calculateNewLowerTick(): Promise<number> {
    const currentTick = await this.uniswapStrategy.currentTick();
    const tickSpacing = await this.uniswapStrategy.tickSpacing();

    const params = this.params as RuleParamsUniswapPSPRebalance;
    let lowerTick = Number(
        (currentTick * params.lowerTargetTickPercentage) / 100,
    );

    lowerTick = Math.round(lowerTick / tickSpacing) * tickSpacing;

    this.logger.info(`New lower tick: ${lowerTick}`);

    return lowerTick;
  }

  protected generateUniqueKey(): string {
    return `uniswap-psp-rebalance-${this.strategyAddress}`;
  }
  private async calculateMinOOutAndMin1Out(): Promise<MinOutputAmounts> {
    const position = await this.uniswapStrategy.getPosition();
    const params = this.params as RuleParamsUniswapPSPRebalance;
    let minOut0Amount;
    let minOut1Amount;
    const slippagePercentage = BigInt(params.slippagePercentage);

    try {
      minOut0Amount =
        position.amount0 -
        (position.amount0 * slippagePercentage) / BigInt(10000);
      minOut1Amount =
        position.amount1 -
        (position.amount1 * slippagePercentage) / BigInt(10000);
    } catch (error) {
      this.logger.error(
          `Error in calculating minOut0Amount and minOut1Amount: ${error}`,
      );
      throw error;
    }
    return {minOut0Amount, minOut1Amount};
  }
}
