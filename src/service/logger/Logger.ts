import {LogMessageCycleTime} from './TypeLogItem';

export enum LogLevel {
  None = 0,
  Error = 1,
  Warn = 2,
  Info = 3,
  Debug = 4,
}

export abstract class Logger {
  protected currentLevel: LogLevel = LogLevel.Debug;

  public setLogLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  abstract debug(message: string): void;
  abstract info(message: string): void;
  abstract warn(message: string): void;
  abstract error(message: string): void;
  abstract flush(): Promise<void>;

  public reportCycleTime(cycleTime: number): void {
    const message: LogMessageCycleTime = {
      message: 'Cycle time (milliseconds)',
      cycleTime: cycleTime,
    };

    this.info(JSON.stringify(message));
  }

  public reportRuleEvalResults(successfulRuleEval: number, failedRuleEval: number): void {
    const message = {
      message: 'Rule Eval Results',
      successfulRuleEval: successfulRuleEval,
      failedRuleEval: failedRuleEval,
    };

    this.info(JSON.stringify(message));
  }
}
