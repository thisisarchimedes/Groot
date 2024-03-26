import { RuleJSONConfigItem } from '../../../rule_engine/TypesRule';

export interface IConfigService {
    refreshConfig(): Promise<void>;
    getEnvironment(): string;
    getMainRPCURL(): string;
    getAlternativeRPCURL(): string;
    getRules(): RuleJSONConfigItem[];
    getNewRelicUrl(): string;
    getNewRelicAPIKey(): string;
    getSleepMillisecondsBetweenCycles(): number;
    getEtherscanAPIKey(): string;
    getDynamoDBAbiRepoTable(): string;
    getTransactionsDBURL(): string;
}
