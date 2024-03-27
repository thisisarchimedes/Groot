import {Rule, RuleParams} from './Rule';
import {ILeverageDataSource} from '../tool/data_source/interfaces/ILeverageDataSource';
import {inject, injectable} from 'inversify';
import {ILogger} from '../../service/logger/interfaces/ILogger';
import {IBlockchainReader} from '../../blockchain/blockchain_reader/interfaces/IBlockchainReader';
import {IAbiRepo} from '../tool/abi_repository/interfaces/IAbiRepo';

export interface RuleParamsDummy extends RuleParams {
  message: string;
  NumberOfDummyTxs: number;
  evalSuccess: boolean;
}


// const WBTC_ADDRESS = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';
// const WBTC_DECIMALS = 8;

@injectable()
export class RuleExpirePositions extends Rule {
  private leverageDataSource: ILeverageDataSource;
  // private uniswap: Uniswap;
  // private positionLedger: PositionLedger;

  constructor(
    @inject('ILoggerAll') logger: ILogger,
    @inject('IBlockchainReader') blockchainReader: IBlockchainReader,
    @inject('IAbiRepo') abiRepo: IAbiRepo,
    @inject('ILeverageDataSource') leverageDataSource: ILeverageDataSource) {
    super(logger, blockchainReader, abiRepo);
    this.leverageDataSource = leverageDataSource;
    // this.uniswap = new Uniswap('');
  }

  public async evaluate(): Promise<void> {
    const blockNumber = await this.blockchainReader.getBlockNumber();
    const livePositions = await this.leverageDataSource.getLivePositions();

    for (const position of livePositions) {
      if (position.positionExpireBlock < blockNumber) {
        // const tx = this.createExpireTransaction(position);
        // this.pushTransactionToRuleLocalQueue(tx);
      }
    }

    // if (params.evalSuccess === false) {
    //   throw new Error('RuleExpirePositions.evaluate() failed');
    // }
  }

  /**
 * Preview the expiration of a position
 * @param position - The position to preview
 * @returns The minimum WBTC and payload
 */
  // public async previewExpirePosition(position: LeveragePosition): Promise<{
  //   minimumWBTC: bigint;
  //   payload: string;
  // }> {
  //   const strategyInstance = new MultiPoolStrategy(new EthereumAddress(position.strategy));
  //   const positionLedger = new PositionLedger(new EthereumAddress(position.strategy))

  //   // get blockchain position
  //   const blockchainPosition = await positionLedger.getPosition(position.nftId);

  //   const minimumExpectedAssets = await strategyInstance.convertToAssets(blockchainPosition.strategyShares);

  //   const strategyAsset = await strategyInstance.asset();
  //   const assetDecimals = await strategyInstance.decimals();

  //   const { payload, swapOutputAmount } = await this.uniswap.buildPayload(
  //     ethers.formatUnits(minimumExpectedAssets, assetDecimals),
  //     new EthereumAddress(strategyAsset),
  //     Number(assetDecimals),
  //     new EthereumAddress(WBTC_ADDRESS),
  //     WBTC_DECIMALS,
  //   );

  //   return {
  //     minimumWBTC: BigInt(ethers.parseUnits(swapOutputAmount, WBTC_DECIMALS)),
  //     payload,
  //   };
  // }

  // private createExpireTransaction(position: LeveragePosition): OutboundTransaction {
  //   // //call uniswap and generate ClosePositionParamsStruct
  //   // this.uniswap.buildPayload(0)

  //   // //generate tx
  //   // const tx = this.expirationContract.methods.expirePosition(position.nftId, null) as Transaction;

  //   return {
  //     urgencyLevel: UrgencyLevel.NORMAL,
  //     context: `Position expired transaction`,
  //     postEvalUniqueKey: this.generateUniqueKey(),
  //     lowLevelUnsignedTransaction: { to: '', value: BigInt(0), data: '' } as RawTransactionData,
  //   };
  // }

  protected generateUniqueKey(): string {
    // return `${position.nftId}-${position.strategy}`;
    return '';
  }
}
