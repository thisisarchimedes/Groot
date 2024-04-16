import {LogLevel, Logger} from '../../../src/service/logger/Logger';
import { LoggerConsole } from '../../../src/service/logger/LoggerConsole';

export class LoggerAdapter extends LoggerConsole {
  private latestInfoLogLine: string = '';
  private latestErrorLogLine: string = '';

  private expectedLogLineInfo: string = '';
  private expectedLogLineInfoFound: boolean = false;

  public async flush(): Promise<void> {
    // No-op
  }

  public debug(message: string): void {
    super.debug(message);
  }

  public info(message: string): void {
    if (this.currentLevel >= LogLevel.Info) {
      super.info(message);
      this.latestInfoLogLine = message;

      if (this.expectedLogLineInfo && message.includes(this.expectedLogLineInfo)) {
        this.expectedLogLineInfoFound = true;
      }
    }
  }

  public warn(message: string): void {
    super.warn(message);
  }

  public error(message: string): void {
    if (this.currentLevel >= LogLevel.Error) {
      super.error(message);
      this.latestErrorLogLine = message;
    }
  }

  public getLatestInfoLogLine(): string {
    return this.latestInfoLogLine;
  }

  public getLatestErrorLogLine(): string {
    return this.latestErrorLogLine;
  }

  public lookForInfoLogLineContaining(expected: string): void {
    this.expectedLogLineInfo = expected;
  }

  public isExpectedLogLineInfoFound(): boolean {
    return this.expectedLogLineInfoFound;
  }
}
