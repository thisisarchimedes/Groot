export interface LogMessageCycleTime {
    message: string;
    cycleTime: number;
}

export interface RuleEvalResult {
    message: string;
    successfulRuleEval: number;
    failedRuleEval: number;
}
