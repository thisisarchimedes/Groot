export interface ISignalHeartbeat extends ISignalAWS {
    sendHeartbeat(): Promise<boolean>;
}
