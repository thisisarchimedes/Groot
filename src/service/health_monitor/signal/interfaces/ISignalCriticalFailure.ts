export interface ISignalCriticalFailure {
  sendCriticalFailure(): Promise<boolean>;
}
