export interface IHealthMonitor {
    sendHeartBeat(): Promise<boolean>;
}
