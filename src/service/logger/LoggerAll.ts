import { ConfigService } from '../config/ConfigService';
import { Logger } from './Logger';
import { LoggerConsole } from './LoggerConsole';
import { LoggerNewRelic } from './LoggerNewRelic';

export class LoggerAll extends Logger {
  private loggerConsole: LoggerConsole;
  private loggerNewRelic: LoggerNewRelic;

  constructor(
    configService: ConfigService,
    serviceName: string,
  ) {
    super();
    this.loggerConsole = new LoggerConsole();
    this.loggerNewRelic = new LoggerNewRelic(configService, serviceName);
  }

  public async flush(): Promise<void> {
    await Promise.all([
      this.loggerConsole.flush(),
      this.loggerNewRelic.flush(),
    ]);
  }

  public debug(message: string): void {
    this.loggerConsole.debug(message);
    this.loggerNewRelic.debug(message);
  }

  public info(message: string): void {
    this.loggerConsole.info(message);
    this.loggerNewRelic.info(message);
  }

  public warn(message: string): void {
    this.loggerConsole.warn(message);
    this.loggerNewRelic.warn(message);
  }

  public error(error: unknown): void {
    if (error instanceof Error) {
      this.loggerConsole.error((error as Error).message);
      this.loggerConsole.error((error as Error).stack ?? '');

      this.loggerNewRelic.error((error as Error).message);
      this.loggerNewRelic.error((error as Error).stack ?? '');
    }
  }
}

