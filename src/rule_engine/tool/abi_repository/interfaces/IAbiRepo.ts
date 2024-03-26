export interface IAbiRepo {
    getAbiByAddress(contractAddress: string): Promise<string>;
}
