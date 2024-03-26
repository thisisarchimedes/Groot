import {injectable, inject} from 'inversify';
import {IConfigServiceAWS} from '../../config/interfaces/IConfigServiceAWS';
import {ILoggerAll} from '../../logger/interfaces/ILoggerAll';
import {IHostNameProvider} from '../IHostNameProvider';
import {ISignalCriticalFailure} from './interfaces/ISignalCriticalFailure';
import {SignalAWS} from './SignalAWS';

@injectable()
export class SignalAWSCriticalFailure extends SignalAWS implements ISignalCriticalFailure {
  private readonly namespace: string;


  constructor(
    @inject('IConfigServiceAWS') _configService: IConfigServiceAWS,
    @inject('ILoggerAll') _logger: ILoggerAll,
    @inject('IHostNameProvider') _hostNameProvider: IHostNameProvider,
    @inject('MetricNamespaceCriticalFailure') namespace: string) {
    super(_logger, _configService, _hostNameProvider, namespace);
    this.namespace = namespace;
  }

  public sendCriticalFailure(): Promise<boolean> {
    return this.sendSignal(this.namespace);
  }
}
