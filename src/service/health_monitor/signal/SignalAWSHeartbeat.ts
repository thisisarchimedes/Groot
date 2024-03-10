import {ConfigService} from '../../config/ConfigService';
import {Logger} from '../../logger/Logger';
import {HostNameProvider} from '../HostNameProvider';
import {ISignalHeartbeat} from './ISignalHeartbeat';
import {SignalAWS} from './SignalAWS';

export class SignalAWSHeartbeat extends SignalAWS implements ISignalHeartbeat {
  constructor(logger: Logger, configService: ConfigService, hostNameProvider: HostNameProvider) {
    super(logger, configService, hostNameProvider, 'Heartbeat');
  }

  public sendHeartbeat(): Promise<boolean> {
    return this.sendSignal('Heartbeat');
  }
}
