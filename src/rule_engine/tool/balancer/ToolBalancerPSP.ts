import MULTI_POOL_STRATEGY_ABI from '../../../constants/abis/MULTI_POOL_STRATEGY_ABI.json';
import {Contract} from 'ethers';
import {RawTransactionData} from '../../../blockchain/OutboundTransaction';
import {IBlockchainReader} from '../../../blockchain/blockchain_reader/interfaces/IBlockchainReader';
import {BALANCER_VAULT} from '../../../constants/addresses';
import BALANCER_VAULT_ABI from '../../../constants/abis/BALANCER_VAULT_ABI.json';
import AURA_ADAPTER_BASE_ABI from '../../../constants/abis/AURA_ADAPTER_BASE_ABI.json';

type PoolTokens = {
  tokens: string[];
  balances: bigint[];
  lastChangeBlock: bigint;
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
}
