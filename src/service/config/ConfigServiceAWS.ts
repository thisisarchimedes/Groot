import {injectable} from 'inversify';

import {AppConfigClient} from './AppConfigClient';
import {ConfigService} from './ConfigService';
import {IConfigServiceAWS} from './interfaces/IConfigServiceAWS';

@injectable()
export class ConfigServiceAWS extends ConfigService implements IConfigServiceAWS {
  private readonly appConfigClient: AppConfigClient;
  private readonly awsRegion: string;

  constructor(environment: string, region: string) {
    super();
    this.environment = environment;
    this.awsRegion = region;
    this.appConfigClient = new AppConfigClient(environment, region);
  }

  public async refreshConfig(): Promise<void> {
    await Promise.all([
      this.refreshRPCURL(),
      this.refreshRules(),
      this.refreshNewRelicConfig(),
      this.refreshSleepTime(),
      this.refreshEtherscanAPIKey(),
      this.refreshAbiStorageConfig(),
    ]);
  }

  public getAWSRegion(): string {
    return this.awsRegion;
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
    this.appConfigClient.fetchConfigRawString;
    this.rules = JSON.parse(rules);
  }

  private async refreshNewRelicConfig(): Promise<void> {
    const newRelicURL = await this.appConfigClient.fetchConfigRawString('NewRelicURL');
    const newRelicAPIKey = await this.appConfigClient.fetchConfigRawString('NewRelicApiKey');

    this.newRelicURL = newRelicURL;
    this.newRelicAPIKey = newRelicAPIKey;
  }

  private async refreshSleepTime(): Promise<void> {
    const sleepTime = await this.appConfigClient.fetchConfigRawString('GrootSleepMillisecondsBetweenCycles');
    this.sleepTimeMS = parseInt(sleepTime, 10);
  }

  private async refreshEtherscanAPIKey(): Promise<void> {
    this.etherscanAPIKey = await this.appConfigClient.fetchConfigRawString('EtherscanApiKey');
  }

  private async refreshAbiStorageConfig(): Promise<void> {
    this.AbiRepoDynamoDBTable = await this.appConfigClient.fetchConfigRawString('AbiRepoDynamoDBTable');
  }
}
