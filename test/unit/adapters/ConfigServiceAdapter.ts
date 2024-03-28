
import fs from 'fs';
import { ConfigService } from '../../../src/service/config/ConfigService';

export class ConfigServiceAdapter extends ConfigService {
  private ruleFilePath: string = '';

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

  private async refreshRPCURL(): Promise<void> {
  }

  public getTransactionsDBURL(): string {
    return '';
  }

  private refreshRules(): void {
    const rules = fs.readFileSync(this.ruleFilePath, 'utf-8');
    this.rules = JSON.parse(rules);
  }
}
