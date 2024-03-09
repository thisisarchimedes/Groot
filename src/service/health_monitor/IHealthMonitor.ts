export interface IHealthMonitor {
    sendHeartBeat(): Promise<void>;
}
