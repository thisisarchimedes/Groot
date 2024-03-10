import {Logger} from '../logger/Logger';
import {BlockchainNodeHealthMonitor} from './BlockchainNodeHealthMonitor';
import {ISignalCriticalFailure} from './signal/ISignalCriticalFailure';
import {ISignalHeartbeat} from './signal/ISignalHeartbeat';

export class HealthMonitor {
  constructor(
    private readonly logger: Logger,
    private readonly blockchainHealthMonitor: BlockchainNodeHealthMonitor,
    private readonly signalHeartbeat: ISignalHeartbeat,
    private readonly signalCriticalFailure: ISignalCriticalFailure) {}
}

export class ErrorHealthMonitor extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'ErrorHealthMonitor';

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
