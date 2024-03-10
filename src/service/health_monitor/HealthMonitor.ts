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

  public startOfCycleSequence() {
    this.cycleStartTimestamp = new Date();
    this.logger.info(`Cycle start at timestamp: ${this.cycleStartTimestamp}`);

    this.signalHeartbeat.sendHeartbeat();

    try {
      this.blockchainHealthMonitor.checkBlockchainNodesHealth();
    } catch (error) {
      this.logger.error(`Critical failure detected: ${error}`);
      this.signalCriticalFailure.sendCriticalFailure();
    }
  }
}

export class ErrorHealthMonitor extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'ErrorHealthMonitor';

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
