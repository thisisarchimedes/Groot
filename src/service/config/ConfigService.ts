
export abstract class ConfigService {
  protected environment: string = '';
  protected MainRPCURL: string = '';
  protected AltRPCURL: string = '';

  abstract refreshConfig(): Promise<void>;

  public getEnvironment(): string {
    return this.environment;
  }

  
  public getMainRPCURL(): string {
    return this.MainRPCURL;
  }

  public getAlternativeRPCURL(): string {
    return this.AltRPCURL;
  }
}
