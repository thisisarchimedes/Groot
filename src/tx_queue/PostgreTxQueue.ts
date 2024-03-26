import { injectable } from 'inversify';
import { OutboundTransaction } from '../blockchain/OutboundTransaction';
import { ILogger } from '../service/logger/interfaces/ILogger';
import { ITxQueue } from './ITxQueue';

@injectable()
export class PostgreTransactionQueue implements ITxQueue {

    constructor() {

    }

    

    addTransactionToQueue(tx: OutboundTransaction): void {
        throw new Error('Method not implemented.');
    }
}