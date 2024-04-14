import os from 'os';
import {ILogger} from '../logger/interfaces/ILogger';


export class HostNameProvider {
  private readonly logger: ILogger;

  constructor( _logger: ILogger) {
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
