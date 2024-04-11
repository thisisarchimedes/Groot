import 'reflect-metadata';

import {AppConfigClient} from './AppConfigClient';
import {ConfigService} from './ConfigService';


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
      this.refreshTransactionsDatabaseURL(),
      this.refreshLeverageDBURL(),
      this.refreshLeverageContractInfo(),
    ]);
  }

  public getAWSRegion(): string {
    return this.awsRegion;
  }

  private async refreshLeverageContractInfo(): Promise<void> {
    const data = JSON.parse(await this.appConfigClient.fetchConfigRawString('LeverageContractInfo'));

    data.forEach((contract: { name: string, address: string }) => {
      switch (contract.name) {
        case 'PositionOpener':
          this.leverageContractAddresses.positionOpener = contract.address;
          break;
        case 'PositionLiquidator':
          this.leverageContractAddresses.positionLiquidator = contract.address;
          break;
        case 'PositionCloser':
          this.leverageContractAddresses.positionCloser = contract.address;
          break;
        case 'PositionExpirator':
          this.leverageContractAddresses.positionExpirator = contract.address;
          break;
        case 'PositionLedger':
          this.leverageContractAddresses.positionLedger = contract.address;
      }
    });
  }

  private async refreshLeverageDBURL(): Promise<void> {
    this.leverageDbUrl = await this.appConfigClient.fetchConfigRawString('LeveragePositionDatabaseURL');
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

  private async refreshTransactionsDatabaseURL(): Promise<void> {
    this.transactionsDatabaseURL = await this.appConfigClient.fetchConfigRawString('TransactionsDatabaseURL');
  }
}
