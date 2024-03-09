export interface IHeartbeat {
    sendHeartbeat(): Promise<boolean>;
}
