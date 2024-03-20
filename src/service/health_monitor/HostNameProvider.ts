import os from 'os';
import { Logger } from '../logger/Logger';
import { IHostNameProvider } from './IHostNameProvider';
import { ILogger } from '../logger/interfaces/ILogger';

export class HostNameProvider implements IHostNameProvider {
  private readonly logger: ILogger;

  constructor(logger: ILogger) {
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
