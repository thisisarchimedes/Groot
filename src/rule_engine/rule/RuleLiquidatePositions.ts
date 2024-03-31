import pLimit from 'p-limit';
import {Rule, RuleParams} from './Rule';
import {UrgencyLevel} from '../TypesRule';
import {OutboundTransaction, RawTransactionData} from '../../blockchain/OutboundTransaction';
import LeveragePosition from '../../types/LeveragePosition';
import {Contract} from 'ethers';
import {Address} from '../../types/LeverageContractAddresses';
import {inject, injectable} from 'inversify';
import {ILogger} from '../../service/logger/interfaces/ILogger';
import {IBlockchainReader} from '../../blockchain/blockchain_reader/interfaces/IBlockchainReader';
import {IAbiRepo} from '../tool/abi_repository/interfaces/IAbiRepo';
import {ILeverageDataSource} from '../tool/data_source/interfaces/ILeverageDataSource';
import {IConfigService} from '../../service/config/interfaces/IConfigService';
import {IUniSwapPayloadBuilder} from '../tool/uni_swap/interfaces/IUniSwapPayloadBuilder';

const MAX_CONCURRENCY = 20;

const limit = pLimit(MAX_CONCURRENCY);

export interface RuleParamsLiquidatePositions extends RuleParams {
  message: string;
  numberOfLiquidatePositionsTxs: number;
  evalSuccess: boolean;
}

@injectable()
export class RuleLiquidatePositions extends Rule {
  private leverageDataSource: ILeverageDataSource;
  private positionLiquidator!: Contract;
  private config: IConfigService;
  private uniSwapPayloadBuilder: IUniSwapPayloadBuilder;

  constructor(
    @inject('ILoggerAll') logger: ILogger,
    @inject('IBlockchainReader') blockchainReader: IBlockchainReader,
    @inject('IAbiRepo') abiRepo: IAbiRepo,
    @inject('PostgreDataSource') leverageDataSource: ILeverageDataSource,
    @inject('IConfigServiceAWS') configService: IConfigService,
    @inject('IUniSwapPayloadBuilder') uniSwapPayloadBuilder: IUniSwapPayloadBuilder,
  ) {
    super(logger, blockchainReader, abiRepo);
    this.leverageDataSource = leverageDataSource;
    this.config = configService;
    this.uniSwapPayloadBuilder = uniSwapPayloadBuilder;
    // this.uniswap = new Uniswap('');
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
        .map((result) => (result as PromiseFulfilledResult<{tx: RawTransactionData, nftId: number}>).value);

    params.evalSuccess = true;
    params.numberOfLiquidatePositionsTxs = txs.length;

    for (let i = 0; i < params.numberOfLiquidatePositionsTxs; i++) {
      const liquidatePositionTx = this.createLiquidatePositionsTransaction(i, blockNumber, txs[i].nftId, txs[i].tx);
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
      const payload = await this.uniSwapPayloadBuilder.getClosePositionSwapPayload(
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

  private prepareTransaction = (nftId: number, payload: string): {tx: RawTransactionData, nftId: number} => {
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

    return {tx, nftId};
  };

  private createLiquidatePositionsTransaction(
      txNumber: number,
      currentBlockNumber: number,
      nftId: number,
      tx: RawTransactionData,
  ): OutboundTransaction {
    return {
      urgencyLevel: UrgencyLevel.URGENT,
      context: `this is a liquidatePosition context
        - number: ${txNumber}
        - block: ${currentBlockNumber}
        - nftId: ${nftId}
      `,
      postEvalUniqueKey: this.generateUniqueKey(nftId),
      lowLevelUnsignedTransaction: tx,
    };
  }

  protected generateUniqueKey<T extends unknown[]>(...args: T): string {
    const nftId = args[0];
    return `liquidate-${nftId}`;
  }
}
