import { injectable, inject } from 'inversify';

import { IConfigServiceAWS } from '../../config/interfaces/IConfigServiceAWS';
import { ILoggerAll } from '../../logger/interfaces/ILoggerAll';
import { IHostNameProvider } from '../IHostNameProvider';
import { ISignalHeartbeat } from './interfaces/ISignalHeartbeat';
import { SignalAWS } from './SignalAWS';

@injectable()
export class SignalAWSHeartbeat extends SignalAWS implements ISignalHeartbeat {

  private readonly namespace: string;

  constructor(
    @inject("IConfigServiceAWS") _configService: IConfigServiceAWS,
    @inject("ILoggerAll") _logger: ILoggerAll,
    @inject("IHostNameProvider") _hostNameProvider: IHostNameProvider,
    @inject("MetricNamespaceHeartBeat") namespace: string
  ) {
    super(_logger, _configService, _hostNameProvider, namespace);
    this.namespace = namespace;
  }


  public sendHeartbeat(): Promise<boolean> {
    return this.sendSignal(this.namespace);
  }
}
