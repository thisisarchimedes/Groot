import { Web3 } from 'web3';

export class LocalHardhatNode {
    private web3: Web3;
    private rpcUrl: string;

    constructor(rpc_url: string) {
        this.rpcUrl = rpc_url;
        this.web3 = new Web3(rpc_url);
    }

    public async getBlockNumber(): Promise<bigint> {
        let blockNumber: Promise<bigint>;
        
        blockNumber = this.web3.eth.getBlockNumber();
        
        return blockNumber;
    }

    public async resetHardhatNode() {

        await this.sendJsonRpcRequest(this.rpcUrl, 'hardhat_reset', [{
                forking: {
                    jsonRpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/pPpHjtxSDGQxVHCjatsahkR0Ie79w_Qu',
                },
            }] as any); 

        while (true) {
            if (await this.isNodeReady()) {
                console.log('Node is ready.');
                break;
            } else {
                console.log('Waiting for the node to be ready...');
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
            }
            }
    }

    private async  sendJsonRpcRequest(url: string, method: string, params = []) {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: method,
            params: params,
            id: new Date().getTime() // Use timestamp for a unique ID
          }),
        });
      
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      
        return response.json();
      }

      private async isNodeReady() {
        try {
          await this.sendJsonRpcRequest(this.rpcUrl, 'eth_chainId');
          return true; // Node responded successfully
        } catch (error) {
          return false; // Node response indicated not ready
        }
      }
}
