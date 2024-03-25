import {injectable} from 'inversify';
import {resolve} from 'path';
import { IAbiRepo } from '../../../src/rule_engine/tool/abi_repository/interfaces/IAbiRepo';

@injectable()
export class AbiRepoAdapter implements IAbiRepo {
  getAbiByAddress(contractAddress: string): Promise<string> {
    return Promise.resolve('');
  }
}
