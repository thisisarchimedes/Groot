import {ethers} from 'ethers';
import {Address} from '../../../types/LeverageContractAddresses';
import {injectable} from 'inversify';

@injectable()
class PositionLedgerContract {
  public contract: ethers.Contract;

  constructor(
      positionLedgerAddress: Address,
      abi: string) {
    this.contract = new ethers.Contract(positionLedgerAddress, abi, null);
  }
}

export default PositionLedgerContract;
