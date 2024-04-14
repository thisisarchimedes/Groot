import { IAbiRepo } from '../../../src/rule_engine/tool/abi_repository/interfaces/IAbiRepo';

export class AbiRepoAdapter implements IAbiRepo {
    getAbiByAddress(contractAddress: string): Promise<string> {
        return Promise.resolve('');
    }
}
