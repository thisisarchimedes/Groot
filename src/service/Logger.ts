export enum LogLevel {
    None = 0,
    Error = 1,
    Debug = 2,
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

  public static error(message: string): void {
    if (Logger.currentLevel >= LogLevel.Error) {
      console.error('\x1b[31m%s\x1b[0m', '[ERROR] ' + message);
    }
  }
}
