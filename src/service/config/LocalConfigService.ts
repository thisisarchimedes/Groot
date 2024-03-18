import { ConfigService } from './ConfigService';
import fs from 'fs';

export class LocalConfigService extends ConfigService {
    async refreshConfig(): Promise<void> {
        this.refreshRules();

    }

    private async refreshRules(): Promise<void> {
        const rules = fs.readFileSync("./local_rules.json", 'utf-8');
        this.rules = JSON.parse(rules);
    }
}
