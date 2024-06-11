

import axios from 'axios';
import {IAbiFetcher} from './interfaces/IAbiFetcher';
import {ConfigService} from '../../../service/config/ConfigService';
import {ModulesParams} from '../../../types/ModulesParams';

interface EtherscanResponse {
  status: string;
  message: string;
  result: string;
}


export class AbiFetcherEtherscan implements IAbiFetcher {
  private readonly apiKey: string;
  private readonly baseUrl: string = 'https://api.etherscan.io/api';
  private readonly configService: ConfigService;

  constructor(
      modulesParams: ModulesParams,
  ) {
    this.configService = modulesParams.configService!;
    this.apiKey = this.configService.getEtherscanAPIKey();
  }

  public async getAbiByAddress(contractAddress: string): Promise<string> {
    const url = `${this.baseUrl}?module=contract&action=getabi&address=${contractAddress}&apikey=${this.apiKey}`;
    // console.log(url); // Debug
    const response = await axios.get<EtherscanResponse>(url);

    if (response.data.status === '1') {
      return response.data.result;
    } else {
      throw new Error(`Failed to fetch ABI for address ${contractAddress}: ${response.data.message}`);
    }
  }
}
