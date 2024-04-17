import LeveragePosition, {PositionState} from '../../../types/LeveragePosition';
import LeverageDataSource from './LeverageDataSource';
import {ILogger} from '../../../service/logger/interfaces/ILogger';
import {BlockchainReader} from '../../../blockchain/blockchain_reader/BlockchainReader';
import {ConfigService} from '../../../service/config/ConfigService';
import {IAbiRepo} from '../abi_repository/interfaces/IAbiRepo';

const UNINITIALIZED_POSITIONS_THRESHOLD = 5;

export default class LeverageDataSourceNode extends LeverageDataSource {
  private positionLedger:string;

  constructor(
      logger: ILogger,
      configService: ConfigService,
      private blockchainReader: BlockchainReader,
      private abiRepo: IAbiRepo,
  ) {
    super(logger);
    this.positionLedger = configService.getLeverageContractInfo().positionLedger;
  }

  getPositionsByNftIds(): Promise<LeveragePosition[]> {
    throw new Error('Method not implemented.');
  }

  async getLivePositions(limit = Number.POSITIVE_INFINITY): Promise<LeveragePosition[]> {
    const positionLedgerAbi = await this.abiRepo.getAbiByAddress(this.positionLedger);
    // TODO: Pagination
    const positions: LeveragePosition[] = [];
    let uninitializedPositionsCount = 0;
    let nftId = 0;
    while (
      uninitializedPositionsCount < UNINITIALIZED_POSITIONS_THRESHOLD &&
      nftId < limit
    ) {
      // console.log('Checking position:', nftId); // Debug

      const position:LedgerEntry = await this.blockchainReader.callViewFunction(
          this.positionLedger,
          positionLedgerAbi,
          'getPosition',
          [nftId],
      ) as LedgerEntry;

      // console.log('Position:', position); // Debug
      // console.log('Position state:', position.state); // Debug

      if (Number(position.state) === PositionState.LIVE) {
        positions.push({
          nftId,
          debtAmount: Number(position.wbtcDebtAmount),
          strategyShares: Number(position.strategyShares),
          strategy: position.strategyAddress,
          blockNumber: Number(position.positionOpenBlock),
          positionExpireBlock: Number(position.positionExpirationBlock),
          positionState: Number(position.state),
          collateralAmount: Number(position.collateralAmount),
          claimableAmount: Number(position.claimableAmount),
        });
      }

      if (Number(position.state) === PositionState.UNINITIALIZED) {
        uninitializedPositionsCount++;
      } else {
        uninitializedPositionsCount = 0;
      }

      nftId++;
    }

    return positions;
  }

  getLivePositionsNftIds(): Promise<number[]> {
    throw new Error('Method not implemented.');
  }
}

// As implemented in the contract on-chain
export interface LedgerEntry {
  collateralAmount: bigint;
  strategyAddress: string;
  strategyShares: bigint;
  wbtcDebtAmount: bigint;
  positionOpenBlock: bigint;
  positionExpirationBlock: bigint;
  liquidationBuffer: bigint;
  state: bigint;
  claimableAmount: bigint;
}
