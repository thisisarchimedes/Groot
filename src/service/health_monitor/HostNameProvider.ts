import os from 'os';
import {Logger} from '../logger/Logger';
import {ModulesParams} from '../../types/ModulesParams';


export class HostNameProvider {
  private readonly logger: Logger;

  constructor(modulesParams: ModulesParams) {
    this.logger = modulesParams.logger!;
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
