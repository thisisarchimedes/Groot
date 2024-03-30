import pLimit from 'p-limit';
import {Rule, RuleConstructorInput, RuleParams} from './Rule';
import {UrgencyLevel} from '../TypesRule';
import {OutboundTransaction, RawTransactionData} from '../../blockchain/OutboundTransaction';
import LeverageDataSource from '../tool/data_source/LeverageDataSource';
import LeveragePosition from '../../types/LeveragePosition';
import UniSwapPayloadBuilder from '../tool/uni_swap/UniSwapPayloadBuilder';
import {Contract} from 'ethers';
import {Address} from '../../types/LeverageContractAddresses';

const MAX_CONCURRENCY = 20;

const limit = pLimit(MAX_CONCURRENCY);

export interface RuleParamsLiquidatePositions extends RuleParams {
  message: string;
  numberOfLiquidatePositionsTxs: number;
  evalSuccess: boolean;
}

export class RuleLiquidatePositions extends Rule {
  private leverageDataSource: LeverageDataSource;
  private positionLiquidator!: Contract;

  constructor(constractorInput: RuleConstructorInput) {
    super(constractorInput);
    this.leverageDataSource = new LeverageDataSource(this.logger, this.config);
  }

  public async evaluate(): Promise<void> {
    const params = this.params as RuleParamsLiquidatePositions;
    this.logger.info('RuleLiquidatePositions.evaluate() called: ' + params.message);

    // Initialize
    const blockNumber = await this.blockchainReader.getBlockNumber();
    const currentTimestamp = await this.blockchainReader.getBlockTimestamp(blockNumber);

    this.positionLiquidator = new Contract(
        this.config.getLeverageContractInfo().positionLiquidator,
        await this.abiRepo.getAbiByAddress(this.config.getLeverageContractInfo().positionLiquidator),
    );

    // Query to get all live positions data
    const res = await this.leverageDataSource.getLivePositionsForLiquidaton();

    // Looping through the positions and preparing the semaphore with the liquidation process
    const promises = [];
    for (const position of res) {
      try {
        const {nftId, strategy, strategyShares} = this.validatePositionData(position); // Throws

        const promise = this.pushToSemaphore(nftId, strategy, strategyShares, currentTimestamp);
        promises.push(promise);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        this.logger.error(`Position ${position.nftId} liquidation errored with [2]:`);
        this.logger.error(error);
      }
    }

    // Await for all the processes to finish and filter out the failed ones
    const txs = (await Promise.allSettled(promises))
        .filter((result) => result.status === 'fulfilled')
        .map((result) => (result as PromiseFulfilledResult<RawTransactionData>).value);

    params.evalSuccess = true;
    params.numberOfLiquidatePositionsTxs = txs.length;

    for (let i = 0; i < params.numberOfLiquidatePositionsTxs; i++) {
      const liquidatePositionTx = this.createLiquidatePositionsTransaction(i, blockNumber, txs[i]);
      this.pushTransactionToRuleLocalQueue(liquidatePositionTx);
    }
  }

  private validatePositionData = (position: LeveragePosition) => {
    const nftId: number = Number(position.nftId);
    const strategyShares: number = Number(position.strategyShares);
    if (isNaN(nftId)) {
      throw new Error(`Position nftId is not a number`);
    }

    if (isNaN(strategyShares)) {
      throw new Error(`Position strategyShares is not a number`);
    }

    return {
      nftId,
      strategy: position.strategy,
      strategyShares,
    };
  };

  private pushToSemaphore = (
      nftId: number,
      strategy: Address,
      strategyShares: number,
      currentTimestamp: number,
  ) => {
    const promise = limit(() => this.createLiquidateTransaction(nftId, strategy, strategyShares, currentTimestamp));
    return promise;
  };

  private createLiquidateTransaction = async (
      nftId: number,
      strategy: Address,
      strategyShares: number,
      currentTimestamp: number,
  ) => {
    try {
      const payload = await UniSwapPayloadBuilder.getClosePositionSwapPayload(
          this.blockchainReader,
          this.abiRepo,
          strategy,
          strategyShares,
          currentTimestamp,
      );
      return this.prepareTransaction(nftId, payload);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      this.logger.error(`Position ${nftId} liquidation errored with [1]:`);
      this.logger.error(error);
      return Promise.reject(error);
    }
  };

  private prepareTransaction = (nftId: number, payload: string): RawTransactionData => {
    const data = this.positionLiquidator.interface.encodeFunctionData('liquidatePosition', [{
      nftId,
      minWBTC: 0,
      swapRoute: '0',
      swapData: payload,
      exchange: '0x0000000000000000000000000000000000000000',
    }]);

    // Create a transaction object
    const tx = {
      to: this.config.getLeverageContractInfo().positionLiquidator,
      value: 0n,
      data,
    };

    return tx;
  };

  private createLiquidatePositionsTransaction(
      txNumber: number,
      currentBlockNumber: number,
      tx: RawTransactionData,
  ): OutboundTransaction {
    return {
      urgencyLevel: UrgencyLevel.URGENT,
      context: `this is a liquidatePosition context - number: ${txNumber} - block: ${currentBlockNumber}`,
      postEvalUniqueKey: this.generateUniqueKey(),
      lowLevelUnsignedTransaction: tx,
    };
  }

  protected generateUniqueKey(): string {
    return 'liquidatePositionKey'; // !TODO: Implement a unique key generator
  }
}
