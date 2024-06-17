import MULTI_POOL_STRATEGY_ABI from '../../../constants/abis/MULTI_POOL_STRATEGY_ABI.json';
import {Contract, toBeHex, zeroPadValue} from 'ethers';
import {RawTransactionData} from '../../../blockchain/OutboundTransaction';
import {IBlockchainReader} from '../../../blockchain/blockchain_reader/interfaces/IBlockchainReader';
import {BALANCER_VAULT, STORAGE_SLOTS_OF_BALANCE} from '../../../constants/addresses';
import BALANCER_VAULT_ABI from '../../../constants/abis/BALANCER_VAULT_ABI.json';
import AURA_ADAPTER_BASE_ABI from '../../../constants/abis/AURA_ADAPTER_BASE_ABI.json';
import {solidityPackedKeccak256} from 'ethers';
import axios from 'axios';
type PoolTokens = {
  tokens: string[];
  balances: bigint[];
  lastChangeBlock: bigint;
};

export type AdjustStruct = {
  adapter: string;
  amount: bigint;
  minReceive: bigint;
};
export class ToolBalancerPSP {
  private readonly strategyAddress: string;
  private readonly adapterAddress: string;
  private readonly multiPoolStrategyABI: string;
  private readonly balancerVaultABI: string;
  private readonly blockchainReader: IBlockchainReader;
  private readonly adapterABI: string;

  constructor(
      strategyAddress: string,
      adapterAddress: string,
      blockchainReader: IBlockchainReader,
  ) {
    this.strategyAddress = strategyAddress;
    this.multiPoolStrategyABI = JSON.stringify(MULTI_POOL_STRATEGY_ABI);
    this.balancerVaultABI = JSON.stringify(BALANCER_VAULT_ABI);
    this.blockchainReader = blockchainReader;
    this.adapterAddress = adapterAddress;
    this.adapterABI = JSON.stringify(AURA_ADAPTER_BASE_ABI);
  }

  public async lastAdjustInTimestamp(): Promise<bigint> {
    const ret = await this.blockchainReader.callViewFunction(
        this.strategyAddress,
        this.multiPoolStrategyABI,
        'lastAdjustIn',
    );
    return BigInt(Number(ret));
  }

  public async lastAdjustOutTimestamp(): Promise<bigint> {
    const ret = await this.blockchainReader.callViewFunction(
        this.strategyAddress,
        this.multiPoolStrategyABI,
        'lastAdjustOut',
    );
    return BigInt(Number(ret));
  }

  public async fetchPoolTokens(): Promise<PoolTokens> {
    const poolId = await this.getPoolId();
    const result = await this.blockchainReader.callViewFunction(
        BALANCER_VAULT,
        this.balancerVaultABI,
        'getPoolTokens',
        [poolId],
    );
    return result as PoolTokens;
  }

  public async getPoolId(): Promise<string> {
    const ret = await this.blockchainReader.callViewFunction(
        this.adapterAddress,
        this.adapterABI,
        'poolId',
    );

    return String(ret);
  }

  public async fetchAdapterUnderlyingBalance(): Promise<bigint> {
    const result = await this.blockchainReader.callViewFunction(
        this.adapterAddress,
        this.adapterABI,
        'underlyingBalance',
    );
    return BigInt(result);
  }

  public async fetchAdapterLpBalance(): Promise<bigint> {
    const result = await this.blockchainReader.callViewFunction(
        this.adapterAddress,
        this.adapterABI,
        'lpBalance',
    );
    return BigInt(result);
  }

  public async fetchPoolAddress(): Promise<string> {
    const result = await this.blockchainReader.callViewFunction(
        this.adapterAddress,
        this.adapterABI,
        'pool',
    );
    return String(result);
  }
  public async fetchUnderlyingTokenAddress(): Promise<string> {
    const result = await this.blockchainReader.callViewFunction(
        this.adapterAddress,
        this.adapterABI,
        'underlyingToken',
    );
    return String(result);
  }
  public async fetchMinimumPercentage(): Promise<bigint> {
    const result = await this.blockchainReader.callViewFunction(
        this.strategyAddress,
        this.multiPoolStrategyABI,
        'minPercentage',
    );
    return BigInt(result);
  }

  public createAdjustOutStruct(
      adapterAddress: string,
      lpAmount: bigint,
      minOutAmount: bigint,
  ): AdjustStruct {
    const struct = {
      adapter: adapterAddress,
      amount: lpAmount,
      minReceive: minOutAmount,
    };
    return struct;
  }

  public async calculateMinimumLpAmountComposable(depositAmount:bigint, slippage:bigint) :Promise<bigint> {
    const underlyingToken = await this.fetchUnderlyingTokenAddress();
    const storageSlotOfBalance = STORAGE_SLOTS_OF_BALANCE[underlyingToken as keyof typeof STORAGE_SLOTS_OF_BALANCE];

    const storageKey = this.calculateStorageKey(BigInt(storageSlotOfBalance), this.adapterAddress, false);

    const poolToken = await this.fetchPoolAddress();
    const poolId = await this.getPoolId();
    const hexDepositAmount = zeroPadValue(toBeHex(depositAmount), 32);

    // const overrides = {
    //   'from': this.adapterAddress,
    //   [underlyingToken]:
    //   {
    //     storage: {[storageKey]: hexDepositAmount},
    //   },
    // };

    const swapStruct = {
      poolId,
      kind: 0,
      assetIn: underlyingToken,
      assetOut: poolToken,
      amount: depositAmount,
      userData: '0x',
    };

    const fundStruct = {
      sender: this.adapterAddress,
      fromInternalBalance: false,
      recipient: this.adapterAddress,
      toInternalBalance: true,
    };
    // deadline is timestamp in seconds
    const deadline = Math.floor(Date.now() / 1000) + 1000;
    const vaultContract = new Contract(
        BALANCER_VAULT,
        this.balancerVaultABI,
    );
    const tx = await vaultContract['swap'].populateTransaction(
        swapStruct,
        fundStruct,
        0,
        deadline,
    );
    // TODO change this logic back to node rather than tenderly
    const options = {
      method: 'POST',
      url: 'https://api.tenderly.co/api/v1/account/ArchimedesFinance/project/cicd/simulate',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Access-Key': 'WZKCU6PUBonvgiGqfJagMr0btOqKzXOq',
      },
      data: {
        network_id: '1',
        from: this.adapterAddress,
        to: BALANCER_VAULT,
        input: tx.data,
        value: '0',
        save: true,
        save_if_fails: true,
        simulation_type: 'quick',
        state_objects: {
          [underlyingToken]: {
            storage: {[storageKey]: hexDepositAmount}},
        },
      },
    };
    let lpOutAmount = BigInt(0);
    try {
      const {data} = await axios.request(options);
      lpOutAmount = BigInt(data.transaction.transaction_info.call_trace.output);
    } catch (error) {
      console.error(error);
    }
    // const result = await this.blockchainReader.callViewFunction(
    //     BALANCER_VAULT,
    //     this.balancerVaultABI,
    //     'swap',
    //     [swapStruct, fundStruct, 0, deadline],
    //     true, overrides,
    // );
    // console.log('result', result);
    if (lpOutAmount === BigInt(0)) {
      return BigInt(0);
    }
    return lpOutAmount - (lpOutAmount * slippage / BigInt(10000));
  }

  public async createAdjustTransaction(
      adjustIns : AdjustStruct | undefined,
      adjustOuts : AdjustStruct | undefined,
  ): Promise<RawTransactionData> {
    const adjustInArr = adjustIns !== undefined ? [adjustIns] : [];
    const adjustOutArr = adjustOuts !== undefined ? [adjustOuts] : [];
    const sortedAdapters = [this.adapterAddress];
    // create transaction
    const strategyContract = new Contract(
        this.strategyAddress,
        this.multiPoolStrategyABI,
    );

    const tx = await strategyContract['adjust'].populateTransaction(
        adjustInArr,
        adjustOutArr,
        sortedAdapters,
    );
    return {
      to: tx.to,
      value: 0n,
      data: tx.data,
    };
  }

  /**
   * Calculates the storage key for accessing mappings in contract storage,
   * especially for ERC20 token balances and similar mappings.
   *
   * @param mappingSlot The storage slot of the mapping itself.
   * @param userAddress The address used as a key in the mapping.
   * @param isVyper Boolean indicating if the contract is written in Vyper (affects key calculation).
   * @returns The calculated storage key as a hex string.
   */
  private calculateStorageKey(
      mappingSlot: bigint,
      userAddress: string,
      isVyper: boolean,
  ): string {
    const keyComponents = isVyper ?
    [mappingSlot, userAddress.toString()] :
    [userAddress.toString(), mappingSlot];
    return solidityPackedKeccak256(['uint256', 'uint256'], keyComponents);
  }
}
