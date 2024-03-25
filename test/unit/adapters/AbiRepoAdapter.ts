import { injectable } from 'inversify';
import { resolve } from 'path';

@injectable()
export class AbiRepoAdapter implements IAbiRepo {
    getAbiByAddress(contractAddress: string): Promise<string> {
        return Promise.resolve('');
    }
}