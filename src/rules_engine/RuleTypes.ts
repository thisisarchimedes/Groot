export enum RuleType {
    Dummy = 'dummy',
}

export enum UrgencyLevel {
    NORMAL = 0,
    URGENT = 1
}

export interface RuleJSONConfigItem {
    ruleType: RuleType;
    params: unknown;
}
