

import {IHostNameProvider} from '../IHostNameProvider';
import {ISignalHeartbeat} from './interfaces/ISignalHeartbeat';
import {SignalAWS} from './SignalAWS';
import {ILogger} from '../../logger/interfaces/ILogger';
import {ConfigService} from '../../config/ConfigService';


export class SignalAWSHeartbeat extends SignalAWS implements ISignalHeartbeat {
  private readonly namespace: string;

  constructor(
      _configService: ConfigService,
      _logger: ILogger,
      _hostNameProvider: IHostNameProvider,
      namespace: string,
  ) {
    super(_logger, _configService, _hostNameProvider, namespace);
    this.namespace = namespace;
  }


  public sendHeartbeat(): Promise<boolean> {
    return this.sendSignal(this.namespace);
  }
}
