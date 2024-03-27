export enum TypeRule {
    Invalid = 'invalid',
    Dummy = 'dummy',
    UniswapPSPRebalance = 'uniswapPSPRebalance',
    ExpirePositions = 'expirePosition',
    RuleBalanceCurvePoolWithVault = 'balanceCurvePoolWithVault'
}

export enum UrgencyLevel {
    NORMAL = 0,
    URGENT = 1
}

export interface RuleJSONConfigItem {
    ruleType: TypeRule;
    label: string;
    params: unknown;
}
