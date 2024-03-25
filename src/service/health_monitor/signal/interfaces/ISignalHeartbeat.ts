import { ISignalAWS } from "./ISignalAWS";

export interface ISignalHeartbeat extends ISignalAWS {
    sendHeartbeat(): Promise<boolean>;
}
