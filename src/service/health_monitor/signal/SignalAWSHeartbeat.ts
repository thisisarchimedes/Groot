import { injectable, inject } from 'inversify';

import { IHostNameProvider } from '../IHostNameProvider';
import { ISignalHeartbeat } from './interfaces/ISignalHeartbeat';
import { SignalAWS } from './SignalAWS';
import { IConfigService } from '../../config/interfaces/IConfigService';
import { ILogger } from '../../logger/interfaces/ILogger';

@injectable()
export class SignalAWSHeartbeat extends SignalAWS implements ISignalHeartbeat {
  private readonly namespace: string;

  constructor(
    @inject('IConfigServiceAWS') _configService: IConfigService,
    @inject('ILoggerAll') _logger: ILogger,
    @inject('IHostNameProvider') _hostNameProvider: IHostNameProvider,
    @inject('MetricNamespaceHeartBeat') namespace: string,
  ) {
    super(_logger, _configService, _hostNameProvider, namespace);
    this.namespace = namespace;
  }


  public sendHeartbeat(): Promise<boolean> {
    return this.sendSignal(this.namespace);
  }
}
