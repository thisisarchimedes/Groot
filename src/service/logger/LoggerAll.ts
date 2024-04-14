
import {Logger} from './Logger';
import {LoggerNewRelic} from './LoggerNewRelic';
import {ILoggerAll} from './interfaces/ILoggerAll';
import {ILoggerConsole} from './interfaces/ILoggerConsole';
import {ILoggerNewRelic} from './interfaces/ILoggerNewRelic';
import {ConfigServiceAWS} from '../config/ConfigServiceAWS';
import {LoggerConsole} from './LoggerConsole';


export class LoggerAll extends Logger implements ILoggerAll {
  private serviceName = 'Groot';
  private loggerConsole: ILoggerConsole;
  private loggerNewRelic: ILoggerNewRelic;

  constructor(
      configService: ConfigServiceAWS,
  ) {
    super();
    this.loggerConsole = new LoggerConsole();
    this.loggerNewRelic = new LoggerNewRelic(configService, this.serviceName);
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
