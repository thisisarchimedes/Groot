import { ConfigService } from '../../config/ConfigService';
import { IConfigService } from '../../config/IConfigService';
import { ILogger } from '../../logger/ILogger';
import { Logger } from '../../logger/Logger';
import { HostNameProvider } from '../HostNameProvider';
import { ISignalHeartbeat } from './ISignalHeartbeat';
import { SignalAWS } from './SignalAWS';

export class SignalAWSHeartbeat extends SignalAWS implements ISignalHeartbeat {
  constructor(logger: ILogger, configService: IConfigService, hostNameProvider: HostNameProvider) {
    super(logger, configService, hostNameProvider, 'Heartbeat');
  }

  public sendHeartbeat(): Promise<boolean> {
    return this.sendSignal('Heartbeat');
  }
}
