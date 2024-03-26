import os from 'os';
import {IHostNameProvider} from './IHostNameProvider';
import {ILogger} from '../logger/interfaces/ILogger';
import {ILoggerAll} from '../logger/interfaces/ILoggerAll';
import {injectable, inject} from 'inversify';

@injectable()
export class HostNameProvider implements IHostNameProvider {
  private readonly logger: ILogger;

  constructor(@inject('ILoggerAll') _logger: ILogger) {
    this.logger = _logger;
  }

  public getHostName(): string {
    try {
      const hostName = os.hostname();
      this.logger.debug(`Host name: ${hostName}`);
      return hostName;
    } catch (error) {
      this.logger.error(`Error getting host name: ${error}`);
      throw error;
    }
  }
}
