import {ethers} from 'ethers';
import {LedgerEntry, populateLedgerEntry} from '../../../types/LedgerEntry';
import {Address} from '../../../types/LeverageContractAddresses';
import {injectable} from 'inversify';

@injectable()
class PositionLedgerContract {
  private contract: ethers.Contract;

  constructor(
      positionLedgerAddress: Address,
      abi: string) {
    this.contract = new ethers.Contract(positionLedgerAddress, abi);
  }

  async getPosition(nftId: number): Promise<LedgerEntry> {
    const position = await this.contract.getPosition(nftId);
    return populateLedgerEntry(position);
  }
}

export default PositionLedgerContract;
