import { IConfigService } from '../../config/IConfigService';
import { ILogger } from '../../logger/ILogger';
import { HostNameProvider } from '../HostNameProvider';
import { ISignalCriticalFailure } from './ISignalCriticalFailure';
import { SignalAWS } from './SignalAWS';

export class SignalAWSCriticalFailure extends SignalAWS implements ISignalCriticalFailure {
  constructor(logger: ILogger, configService: IConfigService, hostNameProvider: HostNameProvider) {
    super(logger, configService, hostNameProvider, 'CriticalFailure');
  }

  public sendCriticalFailure(): Promise<boolean> {
    return this.sendSignal('CriticalFailure');
  }
}
