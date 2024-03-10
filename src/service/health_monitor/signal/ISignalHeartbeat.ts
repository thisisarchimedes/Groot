export interface ISignalHeartbeat {
    sendHeartbeat(): Promise<boolean>;
}
