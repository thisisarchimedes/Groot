import {ILoggerAll} from '../service/logger/interfaces/ILoggerAll';

export interface IGroot {
    initalizeGroot(): Promise<void>;
    shutdownGroot(): Promise<void>;
    prepareForAnotherCycle(): Promise<void>;
    sleepBetweenCycles(): Promise<void>;
    runOneGrootCycle(): Promise<void>;
    logger: ILoggerAll;
}
