import { RuleJSONConfigItem } from '../../rule_engine/TypesRule';
import EthereumAddress from '../../types/EthereumAddress';
import LeverageContract from '../../types/LeverageContract';

export abstract class ConfigService {
  protected environment: string = '';
  protected mainRPCURL: string = '';
  protected altRPCURL: string = '';

  protected rules: RuleJSONConfigItem[] = [];
  protected newRelicURL: string = '';
  protected newRelicAPIKey: string = '';

  protected sleepTimeMS: number = 0;
  protected etherscanAPIKey: string = '';
  protected AbiRepoDynamoDBTable: string = '';

  protected leverageContractAddresses: LeverageContract[] = [];

  abstract refreshConfig(): Promise<void>;

  public getEnvironment(): string {
    return this.environment;
  }

  public getMainRPCURL(): string {
    return this.mainRPCURL;
  }

  public getAlternativeRPCURL(): string {
    return this.altRPCURL;
  }

  public getRules(): RuleJSONConfigItem[] {
    return this.rules;
  }

  public getNewRelicUrl(): string {
    return this.newRelicURL;
  }

  public getNewRelicAPIKey(): string {
    return this.newRelicAPIKey;
  }

  public getSleepMillisecondsBetweenCycles(): number {
    return this.sleepTimeMS;
  }

  public getEtherscanAPIKey(): string {
    return this.etherscanAPIKey;
  }

  public getDynamoDBAbiRepoTable(): string {
    return this.AbiRepoDynamoDBTable;
  }

  public getLeverageContractAddresses(): LeverageContract[] {
    return this.leverageContractAddresses;
  }

  public getLeverageContract(contractName: string): LeverageContract | undefined {
    if (this.leverageContractAddresses.length > 0) {
      return this.leverageContractAddresses.find(a => a.name == contractName);
    }
  }
}
