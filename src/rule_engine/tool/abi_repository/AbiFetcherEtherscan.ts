import axios from 'axios';
import { IAbiFetcher } from './IAbiFetcher';

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

    const response = await axios.get<EtherscanResponse>(url);

    if (response.data.status === '1') {
      return response.data.result;
    } else {
      throw new Error(`Failed to fetch ABI: ${response.data.message}`);
    }
  }
}