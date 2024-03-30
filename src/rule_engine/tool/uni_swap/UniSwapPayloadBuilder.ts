import UniSwap from './UniSwap';
import {ethers} from 'ethers';
import {IBlockchainReader} from '../../../blockchain/blockchain_reader/interfaces/IBlockchainReader';
import {Address} from '../../../types/LeverageContractAddresses';
import {IAbiRepo} from '../abi_repository/interfaces/IAbiRepo';
import {WBTC, WBTC_DECIMALS} from '../../../constants/addresses';

export default class UniSwapPayloadBuilder {
  /**
  * Returns the swap payload to open a position
  * @param blockchainReader blockchain reader class
  * @param abiRepo ABI repository class
  * @param amount open position amount
  * @param strategy strategy address
  * @param currentTimestamp timestamp of the latest block
  * @returns string - swap payload to open the position
  */
  public static readonly getOpenPositionSwapPayload = async (
      blockchainReader: IBlockchainReader,
      abiRepo: IAbiRepo,
      amount: bigint,
      strategy: Address,
      currentTimestamp: number,
  ): Promise<string> => {
    // console.log('Building payload for:', nftId); // Debug
    const strategyAsset = await blockchainReader.callViewFunction( // Optimization: can get from DB
        strategy,
        await abiRepo.getAbiByAddress(strategy),
        'asset',
        [],
    ) as Address;
    const assetDecimals = await blockchainReader.callViewFunction( // Optimization: can get from DB
        strategyAsset,
        await abiRepo.getAbiByAddress(strategyAsset),
        'decimals',
        [],
    ) as bigint;

    const uniSwap = new UniSwap(process.env.MAINNET_RPC_URL!);
    const {payload} = await uniSwap.buildPayload(
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
  * @param blockchainReader blockchain reader class
  * @param abiRepo ABI repository class
  * @param strategy strategy address
  * @param strategyShares shares amount
  * @param currentTimestamp timestamp of the latest block
  * @returns string - swap payload to close the position
  */
  public static readonly getClosePositionSwapPayload = async (
      blockchainReader: IBlockchainReader,
      abiRepo: IAbiRepo,
      strategy: Address,
      strategyShares: number,
      currentTimestamp: number,
  ): Promise<string> => {
    // console.log('Building payload for:', nftId); // Debug
    const strategyAsset = await blockchainReader.callViewFunction( // Optimization: can get from DB
        strategy,
        await abiRepo.getAbiByAddress(strategy),
        'asset',
        [],
    ) as Address;
    const assetDecimals = await blockchainReader.callViewFunction( // Optimization: can get from DB
        strategyAsset,
        await abiRepo.getAbiByAddress(strategyAsset),
        'decimals',
        [],
    ) as bigint;
    const strategySharesN = ethers.parseUnits(
        strategyShares.toFixed(Number(assetDecimals)),
        assetDecimals,
    ); // Converting float to bigint
    const minimumExpectedAssets = await blockchainReader.callViewFunction( // Must query live
        strategy,
        await abiRepo.getAbiByAddress(strategy),
        'convertToAssets',
        [strategySharesN],
    ) as bigint;

    const uniSwap = new UniSwap(process.env.MAINNET_RPC_URL!);
    const {payload} = await uniSwap.buildPayload(
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
