export interface IHealthMonitor {
    startOfCycleSequence(): Promise<void>;
    endOfCycleSequence(): void;
}
