import EthereumAddress from '../../types/EthereumAddress';
import LeverageContract from '../../types/LeverageContract';
import { AppConfigClient } from './AppConfigClient';
import { ConfigService } from './ConfigService';

export class ConfigServiceAWS extends ConfigService {
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
      this.refreshLeverageContractAddresses()
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
    this.rules = JSON.parse(rules);
  }

  private async refreshNewRelicConfig(): Promise<void> {
    const newRelicURL = await this.appConfigClient.fetchConfigRawString('NewRelicURL');
    const newRelicAPIKey = await this.appConfigClient.fetchConfigRawString('NewRelicApiKey');

    this.newRelicURL = newRelicURL;
    this.newRelicAPIKey = newRelicAPIKey;
  }

  private async refreshLeverageContractAddresses(): Promise<void> {
    const leverageContractsConfig = await this.appConfigClient.fetchConfigRawString('LeverageContractInfo');
    const leverageContractsJson = JSON.parse(leverageContractsConfig);
    const leverageContracts = leverageContractsJson.map((e: any) => {
      return {
        name: e.name,
        address: new EthereumAddress(e.address)
      } as LeverageContract
    })

    this.leverageContractAddresses = leverageContracts;
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
