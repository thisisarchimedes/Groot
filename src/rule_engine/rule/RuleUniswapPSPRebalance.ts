import {inject, injectable} from 'inversify';
import {Rule, RuleParams} from './Rule';
import {ILogger} from '../../service/logger/interfaces/ILogger';
import {IBlockchainReader} from '../../blockchain/blockchain_reader/interfaces/IBlockchainReader';
import {IAbiRepo} from '../tool/abi_repository/interfaces/IAbiRepo';
import {RawTransactionData} from '../../blockchain/OutboundTransaction';

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
  // private uniswapStrategy: ToolStrategyUniswap;
  constructor(
    @inject('ILoggerAll') logger: ILogger,
    @inject('IBlockchainReader') blockchainReader: IBlockchainReader,
    @inject('IAbiRepo') abiRepo: IAbiRepo) {
    super(logger, blockchainReader, abiRepo);
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

