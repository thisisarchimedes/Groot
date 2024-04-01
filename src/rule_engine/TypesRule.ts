export enum TypeRule {
    Invalid = 'invalid',
    Dummy = 'dummy',
    UniswapPSPRebalance = 'uniswapPSPRebalance',
    ExpirePositions = 'expirePosition',
    RuleBalanceCurvePoolWithVault = 'balanceCurvePoolWithVault'
}

export enum UrgencyLevel {
    LOW,
    HIGH
}

export interface RuleJSONConfigItem {
    ruleType: TypeRule;
    label: string;
    params: unknown;
}
