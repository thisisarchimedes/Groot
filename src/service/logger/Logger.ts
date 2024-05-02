import * as stackTrace from 'stacktrace-parser';
import {LogLevel} from './LogLevel';
import {LogMessageCycleTime} from './TypeLogItem';


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

  protected getCallerInfo(): string {
    const error = new Error();
    const stack = error.stack as string;
    const frames = stackTrace.parse(stack);

    for (const frame of frames) {
      const fileName = frame.file?.split('/').pop();
      if (fileName && !fileName.startsWith('Logger')) {
        const functionName = frame.methodName || '<anonymous>';
        const lineNumber = frame.lineNumber;
        const columnNumber = frame.column;
        return `${fileName}:${lineNumber}:${columnNumber} ${functionName}`;
      }
    }
    return '';
  }
}

export {LogLevel};
