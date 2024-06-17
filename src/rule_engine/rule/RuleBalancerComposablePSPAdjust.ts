import {Rule} from './Rule';
import {RuleConstructorInput, RuleParams} from '../TypesRule';
import {OutboundTransaction} from '../../blockchain/OutboundTransaction';
import {
  AdjustStruct,
  ToolBalancerPSP,
} from '../tool/balancer/ToolBalancerPSP';
import {ERC20Tool} from '../tool/contracts/ERC20';
import {formatUnits, parseUnits} from 'ethers';

/* eslint-disable max-len */
export interface RuleParamsBalancerComposablePSPAdjust extends RuleParams {
  strategyAddress: string;
  adapterAddress: string;
  adjustInThreshold: number; // Adjust in if strategy contract holds more asset than this threshold in underlying token amount and decimals
  adjustOutThreshold: number; // Adjust out if underlying token amount in pool is less than this threshold
  lpSlippage: number; // Slippage for adjust in 10000 = 100%
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
    const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
    const lastAdjustIn = await this.balancerStrategy.lastAdjustInTimestamp();
    const lastAdjustOut = await this.balancerStrategy.lastAdjustOutTimestamp();
    let adjustOut: AdjustStruct | undefined;
    let adjustIn: AdjustStruct | undefined;
    // if enough time has passed since last adjust out check if we need to adjust out
    if (
      (currentTimestamp - lastAdjustOut) / BigInt(60) >=
      params.hoursNeedsPassSinceLastAdjustOut
    ) {
      adjustOut = await this.adjustOutCheck();
    }

    // if enough time has passed since last adjust in check if we need to adjust in
    if (
      (currentTimestamp - lastAdjustIn) / BigInt(60) >=
        params.hoursNeedsPassSinceLastAdjustIn &&
      adjustOut === undefined
    ) {
      adjustIn = await this.adjustInCheck();
    }
    if (adjustIn === undefined && adjustOut === undefined) {
      this.logger.info(`BalancerComposableAdjust: No need to adjust in or out for ${params.adapterAddress}`);
      return;
    }

    const tx: OutboundTransaction = {
      urgencyLevel: this.params.urgencyLevel,
      context: 'BalancerComposablePspAdjust',
      executor: this.params.executor,
      postEvalUniqueKey: this.generateUniqueKey(),
      lowLevelUnsignedTransaction:
          await this.balancerStrategy.createAdjustTransaction(adjustIn, adjustOut),
      ttlSeconds: this.params.ttlSeconds,
    };
    this.pushTransactionToRuleLocalQueue(tx);
  }

  protected generateUniqueKey(): string {
    return `balancer-composable-psp-${this.strategyAddress}`;
  }

  private async isAdjustInThresholdPassed(): Promise<boolean> {
    const params = this.params as RuleParamsBalancerComposablePSPAdjust;
    const underlyingTokenAddress =
      await this.balancerStrategy.fetchUnderlyingTokenAddress();
    const underlyingTokenDecimals =
      await this.erc20Tool.decimals(underlyingTokenAddress);
    const strategyBalance = await this.erc20Tool.balanceOf(
        underlyingTokenAddress,
        this.strategyAddress,
    );
    const minimumPercentage =
      await this.balancerStrategy.fetchMinimumPercentage();
    const strategyBalanceWithoutIdleAmount =
      strategyBalance -
      (strategyBalance * BigInt(minimumPercentage)) / BigInt(10000);
    if (
      await this.isAdjustOutThresholdPassed(
          true,
          strategyBalanceWithoutIdleAmount,
      )
    ) {
      return false;
    }
    const maxOwnershipResult =await this.isMaxPoolOwnershipRatioPassed(
        true,
        strategyBalanceWithoutIdleAmount,
    );
    if (
      maxOwnershipResult[0]
    ) {
      return false;
    }
    return strategyBalanceWithoutIdleAmount > parseUnits(params.adjustInThreshold.toString(), underlyingTokenDecimals);
  }

  private async isAdjustOutThresholdPassed(
      isAdjustInCalculation = false,
      extraAmount = BigInt(0),
  ): Promise<boolean> {
    const params = this.params as RuleParamsBalancerComposablePSPAdjust;
    const underlyingBalance =
      await this.balancerStrategy.fetchAdapterUnderlyingBalance();
    if (underlyingBalance === BigInt(0)) {
      return false;
    }
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

    let poolTotalBalance = poolTokens.balances.reduce(
        (acc, balance, index) =>
          Number(formatUnits(balance, tokensDecimals[index])) + acc,
        0,
    );
    if (isAdjustInCalculation) {
      poolTotalBalance += Number(
          formatUnits(extraAmount, tokensDecimals[underlyingTokenIndex]),
      );
    }
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

  private async isMaxPoolOwnershipRatioPassed(
      isAdjustInCheck = false,
      extraAmount = BigInt(0),
  ): Promise<[boolean, bigint]> {
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
    let adapterUnderlyingBalance =
      await this.balancerStrategy.fetchAdapterUnderlyingBalance();
    const poolTokensBalances = [...poolTokens.balances];
    poolTokensBalances[poolLpIndex] = BigInt(0);
    const tokensDecimals = await Promise.all(
        poolTokens.tokens.map((token) => this.erc20Tool.decimals(token)),
    );
    let poolTotalBalance = poolTokensBalances.reduce(
        (acc, balance, index) =>
          Number(formatUnits(balance, tokensDecimals[index])) + acc,
        0,
    );
    if (isAdjustInCheck) {
      poolTotalBalance += Number(
          formatUnits(extraAmount, tokensDecimals[underlyingTokenIndex]),
      );
      adapterUnderlyingBalance += extraAmount;
    }

    const poolOwnershipPercentage =
      (Number(
          formatUnits(
              adapterUnderlyingBalance,
              tokensDecimals[underlyingTokenIndex],
          ),
      ) /
        poolTotalBalance) *
      100;
    if (poolOwnershipPercentage > params.maximumPoolOwnershipRatio) {
      // calculate the amount of underlying token that needs to be adjusted out
      const maxOwnershipAmount =
        (poolTotalBalance * params.maximumPoolOwnershipRatio) / 100;
      const amountToAdjustOut =
        adapterUnderlyingBalance -
        parseUnits(
            maxOwnershipAmount.toString(),
            tokensDecimals[underlyingTokenIndex],
        );
      return [true, amountToAdjustOut];
    }

    return [false, BigInt(0)];
  }

  private async createAdjustOutData(
      useFullBalance = true,
      amount = BigInt(0),
  ): Promise<AdjustStruct> {
    const params = this.params as RuleParamsBalancerComposablePSPAdjust;
    const lpBalance = await this.balancerStrategy.fetchAdapterLpBalance();
    let underlyingBalance;
    if (useFullBalance) {
      underlyingBalance =
        await this.balancerStrategy.fetchAdapterUnderlyingBalance();
    } else {
      underlyingBalance = amount;
    }
    const minOutAmount =
      (underlyingBalance *
        BigInt(Math.floor(100 - params.adjustOutUnderlyingSlippage))) /
      BigInt(100);
    const adjustOutStruct = this.balancerStrategy.createAdjustOutStruct(
        params.adapterAddress,
        lpBalance,
        minOutAmount,
    );
    return adjustOutStruct;
  }

  private async createAdjustInData(): Promise<AdjustStruct> {
    const params = this.params as RuleParamsBalancerComposablePSPAdjust;
    const underlyingTokenAddress =
      await this.balancerStrategy.fetchUnderlyingTokenAddress();
    const strategyBalance = await this.erc20Tool.balanceOf(
        underlyingTokenAddress,
        this.strategyAddress,
    );
    const minimumPercentage =
      await this.balancerStrategy.fetchMinimumPercentage();
    const strategyBalanceWithoutIdleAmount =
      strategyBalance -
      (strategyBalance * BigInt(minimumPercentage)) / BigInt(10000);
    const minimumLpAmount = await this.balancerStrategy.calculateMinimumLpAmountComposable(
        strategyBalanceWithoutIdleAmount,
        BigInt(params.lpSlippage),
    );
    const adjustInStruct : AdjustStruct = {
      adapter: params.adapterAddress,
      amount: strategyBalanceWithoutIdleAmount,
      minReceive: minimumLpAmount,
    };

    return adjustInStruct;
  }

  private async adjustOutCheck(): Promise<AdjustStruct | undefined> {
    const adjustOutThresholdPassed = await this.isAdjustOutThresholdPassed();
    this.logger.info(
        `Adjust Out Threshold Passed: ${adjustOutThresholdPassed}`,
    );
    const maxPoolOwnershipRatioPassed =
      await this.isMaxPoolOwnershipRatioPassed();
    this.logger.info(
        `Max Pool Ownership Ratio Passed: ${maxPoolOwnershipRatioPassed[0]}`,
    );
    if (adjustOutThresholdPassed) {
      return await this.createAdjustOutData();
    }
    if (maxPoolOwnershipRatioPassed[0]) {
      return await this.createAdjustOutData(
          false,
          maxPoolOwnershipRatioPassed[1],
      );
    }
    return undefined;
  }
  private async adjustInCheck(): Promise<AdjustStruct | undefined> {
    const adjustInThresholdPassed = await this.isAdjustInThresholdPassed();
    this.logger.info(`Adjust In Threshold Passed: ${adjustInThresholdPassed}`);
    if (adjustInThresholdPassed) {
      return await this.createAdjustInData();
    }
  }
}
