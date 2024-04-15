
import {HostNameProvider} from '../HostNameProvider';
import {SignalAWS} from './SignalAWS';
import {ILogger} from '../../logger/interfaces/ILogger';
import {ConfigService} from '../../config/ConfigService';
import {ISignalCriticalFailure} from './interfaces/ISignalCriticalFailure';


export class SignalAWSCriticalFailure extends SignalAWS implements ISignalCriticalFailure {
  private readonly namespace: string;

  constructor(
      _configService: ConfigService,
      _logger: ILogger,
      _hostNameProvider: HostNameProvider,
      namespace: string) {
    super(_logger, _configService, _hostNameProvider, namespace);
    this.namespace = namespace;
  }

  public sendCriticalFailure(): Promise<boolean> {
    return this.sendSignal(this.namespace);
  }
}
