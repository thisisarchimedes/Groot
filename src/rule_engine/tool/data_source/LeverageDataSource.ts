import {ILogger} from '../../../service/logger/interfaces/ILogger';
import LeveragePosition from '../../../types/LeveragePosition';

export default abstract class LeverageDataSource {
  constructor(protected readonly logger: ILogger) { }

  abstract getPositionsByNftIds(nftIds: number[]): Promise<LeveragePosition[]>;

  abstract getLivePositions(): Promise<LeveragePosition[]>;

  abstract getLivePositionsNftIds(): Promise<number[]>;
}
