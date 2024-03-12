import fetch from 'node-fetch';
import {IAbiFetcher} from './IAbiFetcher';

interface EtherscanResponse {
  status: string;
  message: string;
  result: string;
}

export class AbiFetcherEtherscan implements IAbiFetcher {
  private readonly apiKey: string;
  private readonly baseUrl: string = 'https://api.etherscan.io/api';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  public async getAbiByAddress(contractAddress: string): Promise<string> {
    const url = `${this.baseUrl}?module=contract&action=getabi&address=${contractAddress}&apikey=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data: EtherscanResponse = await response.json() as EtherscanResponse;

      if (data.status === '1') {
        return data.result;
      } else {
        throw new Error(`Failed to fetch ABI: ${data.message}`);
      }
    } catch (error) {
      console.error('Error fetching ABI:', error);
      throw error;
    }
  }
}
