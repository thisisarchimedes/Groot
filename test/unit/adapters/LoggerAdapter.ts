import {LogLevel, Logger} from '../../../src/service/logger/Logger';

export class LoggerAdapter extends Logger {
  private latestInfoLogLine: string = '';
  private latestErrorLogLine: string = '';

  private expectedLogLineInfo: string = '';
  private expectedLogLineInfoFound: boolean = false;

  public async flush(): Promise<void> {
    // No-op
  }

  public debug(message: string): void {
    if (this.currentLevel >= LogLevel.Debug) {
      console.debug('\x1b[2;37m%s\x1b[0m', '[DEBUG] ' + message);
    }
  }

  public info(message: string): void {
    if (this.currentLevel >= LogLevel.Info) {
      console.info('\x1b[36m%s\x1b[0m', '[INFO] ' + message);
      this.latestInfoLogLine = message;

      if (this.expectedLogLineInfo && message.includes(this.expectedLogLineInfo)) {
        this.expectedLogLineInfoFound = true;
      }
    }
  }

  public warn(message: string): void {
    if (this.currentLevel >= LogLevel.Warn) {
      console.warn('\x1b[33m%s\x1b[0m', '[WARN] ' + message);
    }
  }

  public error(message: string): void {
    if (this.currentLevel >= LogLevel.Error) {
      console.error('\x1b[31m%s\x1b[0m', '[ERROR] ' + message);
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
