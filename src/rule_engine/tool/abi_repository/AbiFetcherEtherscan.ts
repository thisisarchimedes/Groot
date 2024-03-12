import fetch from 'node-fetch';
import { IAbiFetcher } from './IAbiFetcher';

export class AbiFetcherEtherscan implements IAbiFetcher {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  public async getAbiByAddress(contractAddress: string): Promise<string> {
    const url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

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