import {injectable, inject} from 'inversify';

import axios from 'axios';
import {IAbiFetcher} from './interfaces/IAbiFetcher';
import {IConfigService} from '../../../service/config/interfaces/IConfigService';

interface EtherscanResponse {
  status: string;
  message: string;
  result: string;
}

@injectable()
export class AbiFetcherEtherscan implements IAbiFetcher {
  private readonly apiKey: string;
  private readonly baseUrl: string = 'https://api.etherscan.io/api';
  private readonly configService: IConfigService;

  constructor(
    @inject('IConfigServiceAWS') _configService: IConfigService,
  ) {
    this.configService = _configService;
    this.apiKey = this.configService.getEtherscanAPIKey();
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
