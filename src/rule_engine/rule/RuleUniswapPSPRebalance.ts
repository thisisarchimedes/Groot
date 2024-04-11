import {Rule, RuleParams} from './Rule';
import {RawTransactionData} from '../../blockchain/OutboundTransaction';
import {RuleConstractorInput} from '../TypesRule';

/* eslint-disable max-len */
export interface RuleParamsUniswapPSPRebalance extends RuleParams {
  upperTriggerThresholdPercentage: number, // trigger rebalance when we are more than (upperThreshold% * upper tick)
  lowerTriggerThresholdPercentage: number, // trigger rebalance when we are less than (lowerThreshold% * lower tick)
  upperTargetTickPercentage: number, // Where we want to be after rebalance currentUniswapTick * newUpperTickPercentage = newUpperTick
  lowerTargetTickPercentage: number, // Where we want to be after rebalance currentUniswapTick * newLowerTickPercentage = newLowerTick
  strategyAddress: string,
}
/* eslint-enable max-len */


export class RuleUniswapPSPRebalance extends Rule {
  // private uniswapStrategy: ToolStrategyUniswap;
  constructor(input: RuleConstractorInput) {
    super(input.logger, input.blockchainReader, input.abiRepo);
  }
  public async evaluate(): Promise<void> {
    const blockNumber = await this.blockchainReader.getBlockNumber();

    const dummyTx = {
      urgencyLevel: this.params.urgencyLevel,
      executor: this.params.executor,
      context: `this is a dummy context - block: ${blockNumber}`,
      postEvalUniqueKey: this.generateUniqueKey(),
      lowLevelUnsignedTransaction: {} as RawTransactionData,
      ttlSeconds: this.params.ttlSeconds,
    };

    this.pushTransactionToRuleLocalQueue(dummyTx);
  }

  protected generateUniqueKey(): string {
    return '';
  }
}

