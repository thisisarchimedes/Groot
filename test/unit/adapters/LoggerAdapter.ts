import {LogLevel, Logger} from '../../../src/service/logger/Logger';

export class LoggerAdapter extends Logger {
  private latestLogLine: string = '';

  public debug(message: string): void {
    if (this.currentLevel >= LogLevel.Debug) {
      console.debug('\x1b[2;37m%s\x1b[0m', '[DEBUG] ' + message);
      this.latestLogLine = message;
    }
  }

  public info(message: string): void {
    if (this.currentLevel >= LogLevel.Info) {
      console.info('\x1b[36m%s\x1b[0m', '[INFO] ' + message);
      this.latestLogLine = message;
    }
  }

  public warn(message: string): void {
    if (this.currentLevel >= LogLevel.Warn) {
      console.warn('\x1b[33m%s\x1b[0m', '[WARN] ' + message);
      this.latestLogLine = message;
    }
  }

  public error(message: string): void {
    if (this.currentLevel >= LogLevel.Error) {
      console.error('\x1b[31m%s\x1b[0m', '[ERROR] ' + message);
      this.latestLogLine = message;
    }
  }

  public getLatestLogLine(): string {
    return this.latestLogLine;
  }
}
