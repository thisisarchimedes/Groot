
import fs from 'fs';
import {LeverageContractAddresses} from '../../../src/types/LeverageContractAddresses';
import {ConfigServiceAWS} from '../../../src/service/config/ConfigServiceAWS';

export class ConfigServiceAdapter extends ConfigServiceAWS {
  private ruleFilePath: string = '';

  constructor() {
    super('DemoApp', 'us-east-1');
  }

  public async refreshConfig(): Promise<void> {
    await Promise.all([
      this.refreshRPCURL(),
      this.refreshRules(),
    ]);
  }

  public setRulesFromFile(filePath: string): void {
    this.ruleFilePath = filePath;
  }

  public setMainRPCURL(url: string): void {
    this.mainRPCURL = url;
  }

  public setAlternativeRPCURL(url: string): void {
    this.altRPCURL = url;
  }

  public setLeverageContractInfo(addresses: LeverageContractAddresses) {
    this.leverageContractAddresses = addresses;
  }

  protected async refreshRPCURL(): Promise<void> {
  }

  public getTransactionsDBURL(): string {
    return '';
  }

  protected refreshRules(): Promise<void> {
    const rules = fs.readFileSync(this.ruleFilePath, 'utf-8');
    this.rules = JSON.parse(rules);
    return Promise.resolve();
  }
}
