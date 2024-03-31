import { Interface } from 'ethers';
import { BlockchainNodeProxyInfo } from '../../blockchain_nodes/BlockchainNodeProxyInfo';

export interface IBlockchainReader {
    getBlockNumber(): Promise<number>;
    callViewFunction(
        contractAddress: string,
        abi: Interface,
        functionName: string,
        params?: unknown[]
    ): Promise<unknown>;
    getProxyInfoForAddress(proxyAddress: string): Promise<BlockchainNodeProxyInfo>;
}
