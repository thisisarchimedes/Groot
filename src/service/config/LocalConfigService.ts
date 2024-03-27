import {ConfigService} from './ConfigService';
import fs from 'fs';

export class LocalConfigService extends ConfigService {
  async refreshConfig(): Promise<void> {
    await this.refreshRules();
  }

  private refreshRules(): void {
    const rules = fs.readFileSync('./local_rules.json', 'utf-8');
    this.rules = JSON.parse(rules);
  }
}
