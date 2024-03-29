import pLimit from 'p-limit';
import {Contracts, EthereumAddress, PositionLiquidator} from '@thisisarchimedes/backend-sdk';
import {Rule, RuleConstructorInput, RuleParams} from './Rule';
import {UrgencyLevel} from '../TypesRule';
import {OutboundTransaction} from '../../blockchain/OutboundTransaction';
import LeverageDataSource from '../tool/data_source/LeverageDataSource';
import LeveragePosition from '../../types/LeveragePosition';
import UniSwapPayloadBuilder from '../tool/uni_swap/UniSwapPayloadBuilder';

const MAX_CONCURRENCY = 20;

const limit = pLimit(MAX_CONCURRENCY);

export interface RuleParamsLiquidatePositions extends RuleParams {
  message: string;
  NumberOfLiquidatePositionsTxs: number;
  evalSuccess: boolean;
}

export class RuleLiquidatePositions extends Rule {
  private leverageDataSource: LeverageDataSource;
  private positionLiquidator!: PositionLiquidator;

  constructor(constractorInput: RuleConstructorInput) {
    super(constractorInput);
    this.leverageDataSource = new LeverageDataSource();
    this.positionLiquidator = Contracts.leverage.positionLiquidator(
        this.config.getLeverageContractInfo().positionLiquidator,
        this.blockchainReader,
    );
  }

  public async evaluate(): Promise<void> {
    const params = this.params as RuleParamsLiquidatePositions;
    const blockNumber = await this.blockchainReader.getBlockNumber();

    this.logger.info('RuleLiquidatePositions.evaluate() called: ' + params.message);

    // Query to get all live positions data
    const res = await this.leverageDataSource.getLivePositionsForLiquidaton();

    let liquidatedCount = 0;

    // Looping through the positions and preparing the semaphore with the liquidation process
    const promises = [];
    for (const position of res) {
      try {
        const {nftId, strategy, strategyShares} = this.validatePositionData(position); // Throws

        const promise = this.pushToSemaphore(nftId, strategy, strategyShares, currentTimestamp, () => {
          liquidatedCount++;
        });
        promises.push(promise);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        this.logger.error(`Position ${position.nftId} liquidation errored with [2]:`);
        this.logger.error(error);
      }
    }

    // Await for all the processes to finish
    const answers = await Promise.allSettled(promises);

    this.logRunResult(liquidatedCount, res.length);

    if (params.evalSuccess === false) {
      throw new Error('RuleLiquidatePositions.evaluate() failed');
    }

    for (let i = 0; i < params.NumberOfLiquidatePositionsTxs; i++) {
      const liquidatePositionTx = this.createLiquidatePositionsTransaction(i, blockNumber);
      this.pushTransactionToRuleLocalQueue(liquidatePositionTx);
    }
  }

  private validatePositionData = (position: LeveragePosition) => {
    const nftId: number = Number(position.nftId);
    const strategyShares: number = Number(position.strategyShares);
    const strategy = new EthereumAddress(position.strategy); // Throws
    if (isNaN(nftId)) {
      throw new Error(`Position nftId is not a number`);
    }

    if (isNaN(strategyShares)) {
      throw new Error(`Position strategyShares is not a number`);
    }

    return {
      nftId,
      strategy,
      strategyShares,
    };
  };

  private pushToSemaphore = (
      nftId: number,
      strategy: EthereumAddress,
      strategyShares: number,
      currentTimestamp: number,
      cb: () => void,
  ) => {
    const promise = limit(() => this.tryLiquidate(nftId, strategy, strategyShares, currentTimestamp).then(cb));
    return promise;
  };

  private tryLiquidate = async (
      nftId: number,
      strategy: EthereumAddress,
      strategyShares: number,
      currentTimestamp: number,
  ) => {
    try {
      const payload = await UniSwapPayloadBuilder.getClosePositionSwapPayload(
          this.signer,
          strategy,
          strategyShares,
          currentTimestamp,
      );
      const tx = this.prepareTransaction(nftId, gasPrice, payload);
      await this.txSimulator.simulateAndRunTransaction(tx);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      this.errorLogger(nftId, error);
      return Promise.reject(error);
    }
  };

  private errorLogger = (nftId: number, error: any) => {
    if (error.data === '0x5e6797f9') { // NotEligibleForLiquidation selector
      this.logger.info(`Position ${nftId} is not eligible for liquidation`);
    } else {
      this.logger.error(`Position ${nftId} liquidation errored with [1]:`);
      this.logger.error(error);
    }
  };

  private logRunResult = (liquidatedCount: number, total: number) => {
    if (liquidatedCount === 0) {
      this.logger.info(`No positions liquidated`);
    } else {
      this.logger.warn(`${liquidatedCount} out of ${total} positions liquidated`);
    }
  };

  private prepareTransaction = (nftId: number, gasPrice: bigint | null, payload: string): TransactionRequest => {
    const data = this.positionLiquidator.interface.encodeFunctionData('liquidatePosition', [{
      nftId,
      minWBTC: 0,
      swapRoute: '0',
      swapData: payload,
      exchange: '0x0000000000000000000000000000000000000000',
    }]);

    // Create a transaction object
    const tx = {
      to: this.config.positionLiquidator.toString(),
      data,
      gasPrice,
    };

    return tx;
  };

  private createLiquidatePositionsTransaction(txNumber: number, currentBlockNumber: number): OutboundTransaction {
    return {
      urgencyLevel: UrgencyLevel.NORMAL,
      context: `this is a liquidatePosition context - number: ${txNumber} - block: ${currentBlockNumber}`,
      postEvalUniqueKey: this.generateUniqueKey(),
      lowLevelUnsignedTransaction: {},
    };
  }

  protected generateUniqueKey(): string {
    return 'liquidatePositionKey';
  }
}
