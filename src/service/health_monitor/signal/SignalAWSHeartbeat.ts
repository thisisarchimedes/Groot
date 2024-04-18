

import {ISignalHeartbeat} from './interfaces/ISignalHeartbeat';
import {SignalAWS} from './SignalAWS';
import {ModulesParams} from '../../../types/ModulesParams';


export class SignalAWSHeartbeat extends SignalAWS implements ISignalHeartbeat {
  private readonly namespace: string;

  constructor(
      modulesParams: ModulesParams,
      namespace: string,
  ) {
    super(
      modulesParams.logger!,
      modulesParams.configService!,
      modulesParams.hostnameProvider!,
      namespace,
    );
    this.namespace = namespace;
  }


  public sendHeartbeat(): Promise<boolean> {
    return this.sendSignal(this.namespace);
  }
}
