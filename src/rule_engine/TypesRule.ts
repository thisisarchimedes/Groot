import {RuleParams} from './rule/Rule';

export enum TypeRule {
    Invalid = 'invalid',
    Dummy = 'dummy',
    UniswapPSPRebalance = 'uniswapPSPRebalance',
    ExpirePositions = 'expirePosition',
    LiquidatePositions = 'liquidatePosition',
    RuleBalanceCurvePoolWithVault = 'balanceCurvePoolWithVault'
}


export enum Executor {
    PSP = 'PSP',
    LEVERAGE = 'LEVERAGE'
}

export enum UrgencyLevel {
    LOW = 'LOW',
    HIGH = 'HIGH'
}

export interface RuleJSONConfigItem {
    ruleType: TypeRule;
    label: string;
    params: RuleParams;
}
