import { injectable, inject } from 'inversify';

import { ILogger } from '../logger/interfaces/ILogger';
import { ISignalCriticalFailure } from './signal/interfaces/ISignalCriticalFailure';
import { ISignalHeartbeat } from './signal/interfaces/ISignalHeartbeat';
import { ILoggerAll } from '../logger/interfaces/ILoggerAll';
import { IHealthMonitor } from './signal/interfaces/IHealthMonitor';
import { IBlockchainNodeHealthMonitor } from './interfaces/BlockchainNodeHealthMonitor';

@injectable()
export class HealthMonitor implements IHealthMonitor {
  private cycleStartTimestamp!: Date;

  private readonly logger: ILogger;
  private readonly blockchainHealthMonitor: IBlockchainNodeHealthMonitor;
  private readonly signalHeartbeat: ISignalHeartbeat;
  private readonly signalCriticalFailure: ISignalCriticalFailure;

  constructor(
    @inject('ILoggerAll') _logger: ILoggerAll,
    @inject('IBlockchainNodeHealthMonitor') blockchainHealthMonitor: IBlockchainNodeHealthMonitor,
    @inject('ISignalHeartbeat') signalHeartbeat: ISignalHeartbeat,
    @inject('ISignalCriticalFailure') signalCriticalFailure: ISignalCriticalFailure) {
    this.logger = _logger;
    this.blockchainHealthMonitor = blockchainHealthMonitor;
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
