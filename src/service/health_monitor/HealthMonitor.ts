import {Logger} from '../logger/Logger';
import {BlockchainNodeHealthMonitor} from './BlockchainNodeHealthMonitor';
import {ISignalCriticalFailure} from './signal/ISignalCriticalFailure';
import {ISignalHeartbeat} from './signal/ISignalHeartbeat';

export class HealthMonitor {
  private cycleStartTimestamp!: Date;

  constructor(
    private readonly logger: Logger,
    private readonly blockchainHealthMonitor: BlockchainNodeHealthMonitor,
    private readonly signalHeartbeat: ISignalHeartbeat,
    private readonly signalCriticalFailure: ISignalCriticalFailure) { }

  public async startOfCycleSequence(): Promise<void> {
    this.cycleStartTimestamp = new Date();
    this.logger.info(`Cycle start at timestamp: ${this.cycleStartTimestamp}`);

    this.signalHeartbeat.sendHeartbeat();

    try {
      await this.blockchainHealthMonitor.checkBlockchainNodesHealth();
    } catch (error) {
      this.logger.error(`Critical failure detected: ${error}`);
      this.signalCriticalFailure.sendCriticalFailure();
    }
  }

  public endOfCycleSequence(): void {
    const cycleEndTimestamp: Date = new Date();
    const cycleTime = cycleEndTimestamp.getTime() - this.cycleStartTimestamp.getTime();
    this.logger.reportCycleTime(cycleTime);

    this.signalHeartbeat.sendHeartbeat();
  }
}

export class ErrorHealthMonitor extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'ErrorHealthMonitor';

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
