export class LocalHardhatNode {
    private readonly rpc_url: string;
    
    constructor(rpc_url: string) {
        this.rpc_url = rpc_url;
    }

    public getBlockNumber(): number {
        // Assuming this is a placeholder return value
        return 1934001;
    }
}
