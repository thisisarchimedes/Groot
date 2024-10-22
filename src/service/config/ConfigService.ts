import {RuleJSONConfigItem} from '../../rule_engine/TypesRule';
import {LeverageContractAddresses} from '../../types/LeverageContractAddresses';


export abstract class ConfigService {
  protected environment: string = '';
  protected mainRPCURL: string = '';
  protected altRPCURL: string = '';
  protected transactionsDatabaseURL: string = '';

  protected rules: RuleJSONConfigItem[] = [];
  protected newRelicURL: string = '';
  protected newRelicAPIKey: string = '';

  protected sleepTimeMS: number = 0;
  protected etherscanAPIKey: string = '';

  protected leverageDbUrl: string = '';


  protected leverageContractAddresses: LeverageContractAddresses = {
    positionOpener: '',
    positionLiquidator: '',
    positionCloser: '',
    positionExpirator: '',
    positionLedger: '',
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

  public getTransactionsDBURL(): string {
    return this.transactionsDatabaseURL;
  }

  public getEtherscanAPIKey(): string {
    return this.etherscanAPIKey;
  }

  public getLeverageContractInfo(): LeverageContractAddresses {
    return this.leverageContractAddresses;
  }

  public getLeverageDBURL(): string {
    return this.leverageDbUrl;
  }
}
