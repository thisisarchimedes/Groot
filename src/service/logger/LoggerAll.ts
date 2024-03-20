import { injectable, inject } from 'inversify';

import { ConfigService } from '../config/ConfigService';
import { Logger } from './Logger';
import { LoggerConsole } from './LoggerConsole';
import { LoggerNewRelic } from './LoggerNewRelic';
import { IConfigServiceAWS } from '../config/IConfigServiceAWS';
import { ILoggerAll } from './ILoggerAll';

@injectable()
export class LoggerAll extends Logger implements ILoggerAll {

  private loggerConsole: LoggerConsole;
  private loggerNewRelic: LoggerNewRelic;

  constructor(
    configService: IConfigServiceAWS,
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

  public error(message: string): void {
    this.loggerConsole.error(message);
    this.loggerNewRelic.error(message);
  }
}
