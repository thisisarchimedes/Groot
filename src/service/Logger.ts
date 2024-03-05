export enum LogLevel {
  None = 0,
  Error = 1,
  Warn = 2,
  Info = 3,
  Debug = 4,
}

export class Logger {
  private static currentLevel: LogLevel = LogLevel.Debug;

  public static setLogLevel(level: LogLevel): void {
    Logger.currentLevel = level;
  }

  public static debug(message: string): void {
    if (Logger.currentLevel >= LogLevel.Debug) {
      console.debug('\x1b[2;37m%s\x1b[0m', '[DEBUG] ' + message);
    }
  }

  public static info(message: string): void {
    if (Logger.currentLevel >= LogLevel.Info) {
      console.info('\x1b[36m%s\x1b[0m', '[INFO] ' + message);
    }
  }

  public static warn(message: string): void {
    if (Logger.currentLevel >= LogLevel.Warn) {
      console.warn('\x1b[33m%s\x1b[0m', '[WARN] ' + message);
    }
  }

  public static error(message: string): void {
    if (Logger.currentLevel >= LogLevel.Error) {
      console.error('\x1b[31m%s\x1b[0m', '[ERROR] ' + message);
    }
  }
}
