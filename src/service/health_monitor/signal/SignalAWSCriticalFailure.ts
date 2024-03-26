import { injectable, inject } from 'inversify';
import { IHostNameProvider } from '../IHostNameProvider';
import { ISignalCriticalFailure } from './interfaces/ISignalCriticalFailure';
import { SignalAWS } from './SignalAWS';
import { IConfigService } from '../../config/interfaces/IConfigService';
import { ILogger } from '../../logger/interfaces/ILogger';

@injectable()
export class SignalAWSCriticalFailure extends SignalAWS implements ISignalCriticalFailure {
  private readonly namespace: string;


  constructor(
    @inject('IConfigServiceAWS') _configService: IConfigService,
    @inject('ILoggerAll') _logger: ILogger,
    @inject('IHostNameProvider') _hostNameProvider: IHostNameProvider,
    @inject('MetricNamespaceCriticalFailure') namespace: string) {
    super(_logger, _configService, _hostNameProvider, namespace);
    this.namespace = namespace;
  }

  public sendCriticalFailure(): Promise<boolean> {
    return this.sendSignal(this.namespace);
  }
}
