import { ethers } from 'ethers';
import POSITION_LEDGER_ABI from '../../../constants/abis/POSITION_LEDGER_ABI.json';
import EthereumAddress from '../../../types/EthereumAddress';
import { LedgerEntry, populateLedgerEntry } from '../../../types/LedgerEntry';
import { inject, injectable } from 'inversify';
import { IAbiRepo } from '../abi_repository/interfaces/IAbiRepo';
import { IConfigService } from '../../../service/config/interfaces/IConfigService';


@injectable()
class PositionLedger {
  private contract: ethers.Contract;

  constructor(
    @inject('IAbiRepo') abiRepo: IAbiRepo,
    @inject('IConfigServiceAWS') configService: IConfigService) {
      const positionLedgerAddress = configService.get
    this.contract = new ethers.Contract(contractAddress.toString(), POSITION_LEDGER_ABI);
  }

  async getPosition(nftId: number): Promise<LedgerEntry> {
    const position = await this.contract.getPosition(nftId);
    return populateLedgerEntry(position);
  }
}

export default PositionLedger;
