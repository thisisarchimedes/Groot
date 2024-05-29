import {Rule} from './Rule';
import {RuleConstructorInput, RuleParams} from '../TypesRule';
import {OutboundTransaction} from '../../blockchain/OutboundTransaction';
import {ToolBalancerPSP} from '../tool/ToolBalancerPSP';

/* eslint-disable max-len */
export interface RuleParamsBalancerComposablePSPAdjust extends RuleParams {
  strategyAddress: string;
  adapterAddress: string;
  adjustInThreshold: bigint;
  adjustOutThreshold: bigint;
  lpSlippage: number;
  hoursNeedsPassSinceLastAdjustOut: number;
  hoursNeedsPassSinceLastAdjustIn: number;
  adjustOutUnderlyingSlippage: number;
  maximumPoolOwnershipRatio: number;
}

/* eslint-enable max-len */

export class RuleBalancerComposablePSPAdjust extends Rule {
  private balancerStrategy: ToolBalancerPSP;
  private strategyAddress: string;

  constructor(input: RuleConstructorInput) {
    super(input);
    this.balancerStrategy = new ToolBalancerPSP(
        (input.params as RuleParamsBalancerComposablePSPAdjust).strategyAddress,
        (input.params as RuleParamsBalancerComposablePSPAdjust).adapterAddress,
        input.blockchainReader,
    );
    this.strategyAddress = (
      input.params as RuleParamsBalancerComposablePSPAdjust
    ).strategyAddress;
  }

  public async evaluate(): Promise<void> {
    const params = this.params as RuleParamsBalancerComposablePSPAdjust;
    const currentTimestamp = BigInt(Date.now() / 1000);
    const lastAdjustIn = await this.balancerStrategy.lastAdjustInTimestamp();
    const lastAdjustOut = await this.balancerStrategy.lastAdjustOutTimestamp();
    // if enough time has passed since last adjust out check if we need to adjust out
    if (
      (currentTimestamp - lastAdjustOut) / BigInt(60) >=
      params.hoursNeedsPassSinceLastAdjustOut
    ) {
    }

    // if enough time has passed since last adjust in check if we need to adjust in
    if (
      (currentTimestamp - lastAdjustIn) / BigInt(60) >=
      params.hoursNeedsPassSinceLastAdjustIn
    ) {
    }

    // this.logger.info(`Rebalancing Uniswap PSP strategy ${this.strategyAddress} [
    //   ${newUpperTick},
    //   ${newLowerTick},
    //   ${minOutputAmounts.minOut0Amount},
    //   ${minOutputAmounts.minOut1Amount}
    // ]`);
    // this.pushTransactionToRuleLocalQueue(tx);
  }

  protected generateUniqueKey(): string {
    return `balancer-composable-psp-${this.strategyAddress}`;
  }
}
