import { Block, ethers } from 'ethers';
import { BlockchainNodeProxyInfo } from '../BlockchainNodeProxyInfo';

export interface IBlockchainNode {
    getBlock(blockNumber: number): Promise<Block>;
    getBlockNumber(): Promise<number>;
    callViewFunction(
        contractAddress: string,
        abi: string,
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
    getProvider(): ethers.Provider;
}
