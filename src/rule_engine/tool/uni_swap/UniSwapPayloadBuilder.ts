import UniSwap from './UniSwap';
import {Signer, ethers} from 'ethers';
import {WBTC, WBTC_DECIMALS} from '../constants';
import {Contracts, EthereumAddress} from '@thisisarchimedes/backend-sdk';

export default class UniSwapPayloadBuilder {
  /**
  * Returns the swap payload to open a position
  * @param strategy strategy address
  * @param strategyShares shares amount
  * @returns string - swap payload to open the position
  */
  public static readonly getOpenPositionSwapPayload = async (
      signer: Signer,
      amount: bigint,
      strategy: EthereumAddress,
      currentTimestamp: number,
  ): Promise<string> => {
    // console.log('Building payload for:', nftId); // Debug
    const strategyContract = Contracts.general.multiPoolStrategy(strategy, signer);
    const strategyAsset = new EthereumAddress(await strategyContract.asset()); // Optimization: can get from DB
    const asset = Contracts.general.erc20(strategyAsset, signer);
    const assetDecimals = await asset.decimals(); // Optimization: can get from DB

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
  * @param strategy strategy address
  * @param strategyShares shares amount
  * @returns string - swap payload to close the position
  */
  public static readonly getClosePositionSwapPayload = async (
      signer: Signer,
      strategy: EthereumAddress,
      strategyShares: number,
      currentTimestamp: number,
  ): Promise<string> => {
    // console.log('Building payload for:', nftId); // Debug
    const strategyContract = Contracts.general.multiPoolStrategy(strategy, signer);
    const strategyAsset = new EthereumAddress(await strategyContract.asset()); // Optimization: can get from DB
    const asset = Contracts.general.erc20(strategyAsset, signer);
    const assetDecimals = await asset.decimals(); // Optimization: can get from DB
    const strategySharesN = ethers.parseUnits(
        strategyShares.toFixed(Number(assetDecimals)),
        assetDecimals,
    ); // Converting float to bigint
    const minimumExpectedAssets = await strategyContract.convertToAssets(strategySharesN); // Must query live

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
