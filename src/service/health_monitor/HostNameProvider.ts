import os from 'os';
import {Logger} from '../logger/Logger';
import {IHostNameProvider} from './IHostNameProvider';

export class HostNameProvider implements IHostNameProvider {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
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