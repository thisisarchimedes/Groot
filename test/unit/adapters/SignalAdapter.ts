import { ISignalCriticalFailure } from "../../../src/service/health_monitor/signal/interfaces/ISignalCriticalFailure";
import { ISignalHeartbeat } from "../../../src/service/health_monitor/signal/interfaces/ISignalHeartbeat";

export class SignalAdapter implements ISignalHeartbeat, ISignalCriticalFailure {
  private heatbeatSent: boolean = false;
  private criticalFailureSent: boolean = false;

  public sendHeartbeat(): Promise<boolean> {
    this.heatbeatSent = true;
    return Promise.resolve(true);
  }

  public sendCriticalFailure(): Promise<boolean> {
    this.criticalFailureSent = true;
    return Promise.resolve(true);
  }

  public isHeartbeatSent(): boolean {
    return this.heatbeatSent;
  }

  public isCriticalFailureSent(): boolean {
    return this.criticalFailureSent;
  }
}
