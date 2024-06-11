import UniSwap from './UniSwap';
import {ethers} from 'ethers';
import {Address} from '../../../types/LeverageContractAddresses';
import {WBTC, WBTC_DECIMALS} from '../../../constants/addresses';
import {IBlockchainReader} from '../../../blockchain/blockchain_reader/interfaces/IBlockchainReader';
import {IAbiRepo} from '../abi_repository/interfaces/IAbiRepo';
import {ConfigService} from '../../../service/config/ConfigService';
import ERC20_ABI from '../../../constants/abis/ERC20_ABI.json';
import MULTIPOOL_STRATEGY_ABI from '../../../constants/abis/MULTI_POOL_STRATEGY_ABI.json';

export default class UniSwapPayloadBuilder {
  private readonly uniSwap: UniSwap;

  constructor(
      configService: ConfigService,
      private readonly blockchainReader: IBlockchainReader,
      private readonly abiRepo: IAbiRepo,
  ) {
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
        JSON.stringify(MULTIPOOL_STRATEGY_ABI),
        'asset',
        [],
    ) as Address;

    if (strategyAsset === WBTC) {
      return '0x';
    }

    const assetDecimals = await this.blockchainReader.callViewFunction( // Optimization: can get from DB
        strategyAsset,
        JSON.stringify(ERC20_ABI),
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
        JSON.stringify(MULTIPOOL_STRATEGY_ABI),
        'asset',
        [],
    ) as Address;

    if (strategyAsset === WBTC) {
      return '0x';
    }

    const assetDecimals = await this.blockchainReader.callViewFunction( // Optimization: can get from DB
        strategyAsset,
        JSON.stringify(ERC20_ABI),
        'decimals',
        [],
    ) as bigint;

    const minimumExpectedAssets = await this.blockchainReader.callViewFunction( // Must query live
        strategy,
        JSON.stringify(MULTIPOOL_STRATEGY_ABI),
        'convertToAssets',
        [strategyShares],
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
