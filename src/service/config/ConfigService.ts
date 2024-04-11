import {injectable} from 'inversify';
import {RuleJSONConfigItem} from '../../rule_engine/TypesRule';
import {LeverageContractAddresses} from '../../types/LeverageContractAddresses';
import {IConfigService} from './interfaces/IConfigService';

@injectable()
export abstract class ConfigService implements IConfigService {
  protected environment: string = '';
  protected mainRPCURL: string = '';
  protected altRPCURL: string = '';
  protected transactionsDatabaseURL: string = '';

  protected rules: RuleJSONConfigItem[] = [];
  protected newRelicURL: string = '';
  protected newRelicAPIKey: string = '';

  protected sleepTimeMS: number = 0;
  protected etherscanAPIKey: string = '';
  protected AbiRepoDynamoDBTable: string = '';

  abstract refreshConfig(): Promise<void>;

  protected leverageContractAddresses: LeverageContractAddresses = {
    positionOpener: '',
    positionLiquidator: '',
    positionCloser: '',
    positionExpirator: '',
    positionLedger: '',
  };

  protected leverageDbUrl: string = '';


  public getLeverageContractInfo(): LeverageContractAddresses {
    return this.leverageContractAddresses;
  }

  public getLeverageDBURL(): string {
    return this.leverageDbUrl;
  }

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

  public getTransactionsDBURL(): string {
    return this.transactionsDatabaseURL;
  }

  public getEtherscanAPIKey(): string {
    return this.etherscanAPIKey;
  }

  public getDynamoDBAbiRepoTable(): string {
    return this.AbiRepoDynamoDBTable;
  }
}
