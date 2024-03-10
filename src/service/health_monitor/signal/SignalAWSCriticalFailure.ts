import {ConfigService} from '../../config/ConfigService';
import {Logger} from '../../logger/Logger';
import {HostNameProvider} from '../HostNameProvider';
import {ISignalCriticalFailure} from './ISignalCriticalFailure';
import {SignalAWS} from './SignalAWS';

export class SignalAWSCriticalFailure extends SignalAWS implements ISignalCriticalFailure {
  constructor(logger: Logger, configService: ConfigService, hostNameProvider: HostNameProvider) {
    super(logger, configService, hostNameProvider, 'CriticalFailure');
  }

  public sendCriticalFailure(): Promise<boolean> {
    return this.sendSignal('CriticalFailure');
  }
}
