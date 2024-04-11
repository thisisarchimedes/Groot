import {injectable, inject} from 'inversify';
import {Logger} from './Logger';
import {LoggerNewRelic} from './LoggerNewRelic';
import {IConfigServiceAWS} from '../config/interfaces/IConfigServiceAWS';
import {ILoggerAll} from './interfaces/ILoggerAll';
import {TYPES} from '../../inversify.types';
import {ILoggerConsole} from './interfaces/ILoggerConsole';
import {ILoggerNewRelic} from './interfaces/ILoggerNewRelic';

@injectable()
export class LoggerAll extends Logger implements ILoggerAll {
  private loggerConsole: ILoggerConsole;
  private loggerNewRelic: ILoggerNewRelic;

  constructor(
    @inject(TYPES.IConfigServiceAWS) configService: IConfigServiceAWS,
    @inject(TYPES.ILoggerConsole) loggerConsole: ILoggerConsole,
    @inject(TYPES.ServiceName) serviceName: string,
  ) {
    super();
    this.loggerConsole = loggerConsole;
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
