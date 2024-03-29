import {injectable} from 'inversify';
import {RuleJSONConfigItem} from '../../rule_engine/TypesRule';
import {LeverageContractAddresses} from '../../types/LeverageContractAddresses';
import {EthereumAddress} from '@thisisarchimedes/backend-sdk';

@injectable()
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

  protected leverageContractAddresses: LeverageContractAddresses = {
    positionOpener: new EthereumAddress(''),
    positionLiquidator: new EthereumAddress(''),
    positionCloser: new EthereumAddress(''),
    positionExpirator: new EthereumAddress(''),
  };

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

  public getLeverageContractInfo(): LeverageContractAddresses {
    return this.leverageContractAddresses;
  }
}
