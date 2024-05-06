import {LogLevel} from './LogLevel';
import {Logger} from './Logger';

export class LoggerConsole extends Logger {
  public async flush(): Promise<void> {
    // No-op
  }

  public debug(message: string): void {
    if (this.currentLevel >= LogLevel.Debug) {
      const callerInfo = this.getCallerInfo();
      console.debug('\x1b[2;37m%s\x1b[0m', `[DEBUG] [${callerInfo}] ${message}`);
    }
  }

  public info(message: string): void {
    if (this.currentLevel >= LogLevel.Info) {
      const callerInfo = this.getCallerInfo();
      console.info('\x1b[36m%s\x1b[0m', `[INFO] [${callerInfo}] ${message}`);
    }
  }

  public warn(message: string): void {
    if (this.currentLevel >= LogLevel.Warn) {
      const callerInfo = this.getCallerInfo();
      console.warn('\x1b[33m%s\x1b[0m', `[WARN] [${callerInfo}] ${message}`);
    }
  }

  public error(message: string): void {
    if (this.currentLevel >= LogLevel.Error) {
      const callerInfo = this.getCallerInfo();
      console.error('\x1b[31m%s\x1b[0m', `[ERROR] [${callerInfo}] ${message}`);
    }
  }
}
