export interface IAbiStorage {
    storeAbiForAddress(contractAddress: string, abi: string): Promise<void>;
    getAbiForAddress(contractAddress: string): Promise<string | null>;
}
