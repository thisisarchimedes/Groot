

import {ILogger} from '../logger/interfaces/ILogger';
import {ISignalHeartbeat} from './signal/interfaces/ISignalHeartbeat';
import {BlockchainNodeHealthMonitor} from './BlockchainNodeHealthMonitor';
import {SignalAWSCriticalFailure} from './signal/SignalAWSCriticalFailure';


export class HealthMonitor {
  private cycleStartTimestamp!: Date;

  private readonly logger: ILogger;
  private readonly blockchainHealthMonitor: BlockchainNodeHealthMonitor;
  private readonly signalHeartbeat: ISignalHeartbeat;
  private readonly signalCriticalFailure: SignalAWSCriticalFailure;

  constructor(
      _logger: ILogger,
      _blockchainHealthMonitor: BlockchainNodeHealthMonitor,
      signalHeartbeat: ISignalHeartbeat,
      signalCriticalFailure: SignalAWSCriticalFailure,
  ) {
    this.logger = _logger;
    this.blockchainHealthMonitor = _blockchainHealthMonitor;
    this.signalHeartbeat = signalHeartbeat;
    this.signalCriticalFailure = signalCriticalFailure;
  }

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
