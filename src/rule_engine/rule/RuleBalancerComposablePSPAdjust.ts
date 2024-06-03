import {Rule} from './Rule';
import {RuleConstructorInput, RuleParams} from '../TypesRule';
import {OutboundTransaction} from '../../blockchain/OutboundTransaction';
import {ToolBalancerPSP} from '../tool/balancer/ToolBalancerPSP';
import {ERC20Tool} from '../tool/contracts/ERC20';
import {formatUnits} from 'ethers';

/* eslint-disable max-len */
export interface RuleParamsBalancerComposablePSPAdjust extends RuleParams {
  strategyAddress: string;
  adapterAddress: string;
  adjustInThreshold: bigint; // Adjust in if strategy contract holds more asset than this threshold in underlying token amount and decimals
  adjustOutThreshold: number; // Adjust out if underlying token amount in pool is less than this threshold
  lpSlippage: number; // Slippage for adjust in
  hoursNeedsPassSinceLastAdjustOut: number; // Hours needs to pass since last adjust out
  hoursNeedsPassSinceLastAdjustIn: number; // Hours needs to pass since last adjust in
  adjustOutUnderlyingSlippage: number; // Slippage for adjust out
  maximumPoolOwnershipRatio: number; // Maximum amount of pool that we own
}

/* eslint-enable max-len */

export class RuleBalancerComposablePSPAdjust extends Rule {
  private balancerStrategy: ToolBalancerPSP;
  private strategyAddress: string;
  private erc20Tool: ERC20Tool;

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
    this.erc20Tool = new ERC20Tool(input.blockchainReader);
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
      const adjustOutThresholdPassed = await this.isAdjustOutThresholdPassed();
      const maxPoolOwnershipRatioPassed =
        await this.isMaxPoolOwnershipRatioPassed();
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

  private async isAdjustOutThresholdPassed(): Promise<boolean> {
    const params = this.params as RuleParamsBalancerComposablePSPAdjust;
    const underlyingTokenAddress =
      await this.balancerStrategy.fetchUnderlyingTokenAddress();
    const poolTokens = await this.balancerStrategy.fetchPoolTokens();
    const poolAddress = await this.balancerStrategy.fetchPoolAddress();
    const poolLpIndex = poolTokens.tokens.findIndex(
        (token) => token === poolAddress,
    );
    const underlyingTokenIndex = poolTokens.tokens.findIndex(
        (token) => token === underlyingTokenAddress,
    );
    poolTokens.balances[poolLpIndex] = BigInt(0);
    const tokensDecimals = await Promise.all(
        poolTokens.tokens.map((token) => this.erc20Tool.decimals(token)),
    );
    const poolTotalBalance = poolTokens.balances.reduce(
        (acc, balance, index) =>
          Number(formatUnits(balance, tokensDecimals[index])) + acc,
        0,
    );
    const poolUnderlyingBalancePercentage =
      (Number(
          formatUnits(
              poolTokens.balances[underlyingTokenIndex],
              tokensDecimals[underlyingTokenIndex],
          ),
      ) /
        poolTotalBalance) *
      100;
    return poolUnderlyingBalancePercentage < params.adjustOutThreshold;
  }

  private async isMaxPoolOwnershipRatioPassed(): Promise<boolean> {
    const params = this.params as RuleParamsBalancerComposablePSPAdjust;
    const underlyingTokenAddress =
      await this.balancerStrategy.fetchUnderlyingTokenAddress();
    const poolTokens = await this.balancerStrategy.fetchPoolTokens();
    const poolAddress = await this.balancerStrategy.fetchPoolAddress();
    const poolLpIndex = poolTokens.tokens.findIndex(
        (token) => token === poolAddress,
    );
    const underlyingTokenIndex = poolTokens.tokens.findIndex(
        (token) => token === underlyingTokenAddress,
    );
    const adapterUnderlyingBalance =
      await this.balancerStrategy.fetchAdapterUnderlyingBalance();
    poolTokens.balances[poolLpIndex] = BigInt(0);
    const tokensDecimals = await Promise.all(
        poolTokens.tokens.map((token) => this.erc20Tool.decimals(token)),
    );
    const poolTotalBalance = poolTokens.balances.reduce(
        (acc, balance, index) =>
          Number(formatUnits(balance, tokensDecimals[index])) + acc,
        0,
    );
    const poolOwnershipPercentage =
      (Number(
          formatUnits(
              adapterUnderlyingBalance,
              tokensDecimals[underlyingTokenIndex],
          ),
      ) /
        poolTotalBalance) *
      100;

    return poolOwnershipPercentage > params.maximumPoolOwnershipRatio;
  }
}
