
import {IHostNameProvider} from '../IHostNameProvider';
import {ISignalCriticalFailure} from './interfaces/ISignalCriticalFailure';
import {SignalAWS} from './SignalAWS';
import {ILogger} from '../../logger/interfaces/ILogger';
import {ConfigService} from '../../config/ConfigService';


export class SignalAWSCriticalFailure extends SignalAWS implements ISignalCriticalFailure {
  private readonly namespace: string;


  constructor(
      _configService: ConfigService,
      _logger: ILogger,
      _hostNameProvider: IHostNameProvider,
      namespace: string) {
    super(_logger, _configService, _hostNameProvider, namespace);
    this.namespace = namespace;
  }

  public sendCriticalFailure(): Promise<boolean> {
    return this.sendSignal(this.namespace);
  }
}
