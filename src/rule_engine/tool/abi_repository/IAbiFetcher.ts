export interface IAbiFetcher {
    getAbiByAddress(contractAddress: string): Promise<string>;
}
