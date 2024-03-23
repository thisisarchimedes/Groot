interface IGroot {
    initalizeGroot(): Promise<void>;
    shutdownGroot(): Promise<void>;
    prepareForAnotherCycle(): Promise<void>;
    runOneGrootCycle(): Promise<void>;
}