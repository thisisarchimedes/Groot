import { ethers } from 'ethers';
import { BlockchainNodeProxyInfo } from '../BlockchainNodeProxyInfo';

export interface IBlockchainNode {
    getBlockNumber(): Promise<number>;
    callViewFunction(
        contractAddress: string,
        abi: ethers.Interface,
        functionName: string,
        params?: unknown[]
    ): Promise<unknown>;
    startNode(): Promise<void>;
    stopNode(): Promise<void>;
    resetNode(externalProviderRpcUrl: string): Promise<void>;
    recoverNode(): Promise<void>;
    isHealthy(): boolean;
    getNodeName(): string;
    getProxyInfoForAddress(proxyAddress: string): Promise<BlockchainNodeProxyInfo>;
}