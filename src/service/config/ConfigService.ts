import {RuleJSONConfigItem} from '../../rules_engine/TypesRule';

export abstract class ConfigService {
  protected environment: string = '';
  protected mainRPCURL: string = '';
  protected altRPCURL: string = '';
  protected rules: RuleJSONConfigItem[] = [];

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
}
