import {BlockchainNodeProxyInfo} from '../../blockchain_nodes/BlockchainNodeProxyInfo';

export interface IBlockchainReader {
    getBlockNumber(): Promise<number>;
    getBlockTimestamp(blockNumber: number): Promise<number>;
    callViewFunction(
        contractAddress: string,
        abi: string,
        functionName: string,
        params?: unknown[]
    ): Promise<unknown>;
    getProxyInfoForAddress(proxyAddress: string): Promise<BlockchainNodeProxyInfo>;
}
