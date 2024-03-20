import { LogLevel } from './LogLevel';

export interface ILogger {
    setLogLevel(level: LogLevel): void;
    debug(message: string): void;
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    flush(): Promise<void>;
    reportCycleTime(cycleTime: number): void;
    reportRuleEvalResults(successfulRuleEval: number, failedRuleEval: number): void;
}