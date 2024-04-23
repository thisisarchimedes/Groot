
import {SignalAWS} from './SignalAWS';
import {ISignalCriticalFailure} from './interfaces/ISignalCriticalFailure';
import {ModulesParams} from '../../../types/ModulesParams';


export class SignalAWSCriticalFailure extends SignalAWS implements ISignalCriticalFailure {
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

  public sendCriticalFailure(): Promise<boolean> {
    return this.sendSignal(this.namespace);
  }
}
