import { injectable, inject } from 'inversify';

import { LogLevel } from './LogLevel';
import { Logger } from './Logger';
import { ILoggerConsole } from './ILoggerConsole';

@injectable()
export class LoggerConsole extends Logger implements ILoggerConsole {
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
    }
  }
}
