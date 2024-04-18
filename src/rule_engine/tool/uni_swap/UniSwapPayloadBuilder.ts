import UniSwap from './UniSwap';
import {ethers} from 'ethers';
import {Address} from '../../../types/LeverageContractAddresses';
import {WBTC, WBTC_DECIMALS} from '../../../constants/addresses';
import {IBlockchainReader} from '../../../blockchain/blockchain_reader/interfaces/IBlockchainReader';
import {IAbiRepo} from '../abi_repository/interfaces/IAbiRepo';
import {ConfigService} from '../../../service/config/ConfigService';

export default class UniSwapPayloadBuilder {
  private readonly uniSwap: UniSwap;

  constructor(
      configService: ConfigService,
      private readonly blockchainReader: IBlockchainReader,
      private readonly abiRepo: IAbiRepo,
  ) {
    console.log(configService.getMainRPCURL());
    this.uniSwap = new UniSwap(configService.getMainRPCURL());
  }

  /**
    * Returns the swap payload to open a position
    * @param amount open position amount
    * @param strategy strategy address
    * @param currentTimestamp timestamp of the latest block
    * @returns string - swap payload to open the position
    */
  public readonly getOpenPositionSwapPayload = async (
      amount: bigint,
      strategy: Address,
      currentTimestamp: number,
  ): Promise<string> => {
    // console.log('Building payload for:', nftId); // Debug
    const strategyAsset = await this.blockchainReader.callViewFunction( // Optimization: can get from DB
        strategy,
        await this.abiRepo.getAbiByAddress(strategy),
        'asset',
        [],
    ) as Address;
    const assetDecimals = await this.blockchainReader.callViewFunction( // Optimization: can get from DB
        strategyAsset,
        await this.abiRepo.getAbiByAddress(strategyAsset),
        'decimals',
        [],
    ) as bigint;

    const {payload} = await this.uniSwap.buildPayload(
        ethers.formatUnits(amount, WBTC_DECIMALS),
        WBTC,
        WBTC_DECIMALS,
        strategyAsset,
        Number(assetDecimals),
        currentTimestamp,
    );

    return payload;
  };

  /**
    * Returns the swap payload to close the position
    * @param strategy strategy address
    * @param strategyShares shares amount
    * @param currentTimestamp timestamp of the latest block
    * @returns string - swap payload to close the position
    */
  public getClosePositionSwapPayload = async (
      strategy: Address,
      strategyShares: number,
      currentTimestamp: number,
  ): Promise<string> => {
    // console.log('Building payload for:', nftId); // Debug
    const strategyAsset = await this.blockchainReader.callViewFunction( // Optimization: can get from DB
        strategy,
        await this.abiRepo.getAbiByAddress(strategy),
        'asset',
        [],
    ) as Address;
    const assetDecimals = await this.blockchainReader.callViewFunction( // Optimization: can get from DB
        strategyAsset,
        await this.abiRepo.getAbiByAddress(strategyAsset),
        'decimals',
        [],
    ) as bigint;
    const strategySharesN = ethers.parseUnits(
        strategyShares.toFixed(Number(assetDecimals)),
        assetDecimals,
    ); // Converting float to bigint
    const minimumExpectedAssets = await this.blockchainReader.callViewFunction( // Must query live
        strategy,
        await this.abiRepo.getAbiByAddress(strategy),
        'convertToAssets',
        [strategySharesN],
    ) as bigint;

    const {payload} = await this.uniSwap.buildPayload(
        ethers.formatUnits(minimumExpectedAssets, assetDecimals),
        strategyAsset,
        Number(assetDecimals),
        WBTC,
        WBTC_DECIMALS,
        currentTimestamp,
    );

    return payload;
  };
}
