import {AppConfigClient} from './AppConfigClient';
import {ConfigService} from './ConfigService';

export class ConfigServiceAWS extends ConfigService {
  private readonly appConfigClient: AppConfigClient;

  constructor(environment: string, region: string) {
    super();
    this.environment = environment;
    this.appConfigClient = new AppConfigClient(environment, region);
  }

  public async refreshConfig(): Promise<void> {
    await Promise.all([
      this.refreshRPCURL(),
      this.refreshRules(),
      this.refreshNewRelicConfig(),
    ]);
  }

  private async refreshRPCURL(): Promise<void> {
    const [mainRPCURL, altRPCURL] = await Promise.all([
      this.appConfigClient.fetchConfigRawString('RpcUrl'),
      this.appConfigClient.fetchConfigRawString('AltRpcUrl'),
    ]);

    this.mainRPCURL = mainRPCURL;
    this.altRPCURL = altRPCURL;
  }

  private async refreshRules(): Promise<void> {
    const rules = await this.appConfigClient.fetchConfigRawString('GrootRules');
    this.rules = JSON.parse(rules);
  }

  private async refreshNewRelicConfig(): Promise<void> {
    const newRelicURL = await this.appConfigClient.fetchConfigRawString('NewRelicURL');
    const newRelicAPIKey = await this.appConfigClient.fetchConfigRawString('NewRelicApiKey');

    this.newRelicURL = newRelicURL;
    this.newRelicAPIKey = newRelicAPIKey;
  }
}
