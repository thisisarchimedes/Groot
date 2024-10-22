import 'reflect-metadata';

import {AppConfig, GetConfigurationCommandOutput} from '@aws-sdk/client-appconfig';
import {namespace} from '../../constants/constants';

export class AppConfigClient {
  private readonly DEFAULT_APPCONFIG_ENVIRONMENT = 'env';

  private readonly appConfigClient: AppConfig;
  private readonly environment: string;

  constructor(environment: string, region: string) {
    this.appConfigClient = new AppConfig({region: region});
    this.environment = environment;
  }

  public async fetchConfigRawString(configName: string): Promise<string> {
    try {
      const response = await this.getConfigFromAppConfig(configName);
      return response;
    } catch (error) {
      throw new Error(`Error fetching configuration for ${configName}: ${error}`);
    }
  }

  private async getConfigFromAppConfig(configName: string): Promise<string> {
    const params = {
      Application: this.environment,
      Configuration: configName,
      Environment: this.DEFAULT_APPCONFIG_ENVIRONMENT,
      ClientId: namespace,
    };

    const response: GetConfigurationCommandOutput = await this.appConfigClient.getConfiguration(params);

    if (response.Content) {
      return Buffer.from(response.Content).toString('utf-8');
    } else {
      throw new Error(`Configuration ${configName} not found or is empty.`);
    }
  }
}
