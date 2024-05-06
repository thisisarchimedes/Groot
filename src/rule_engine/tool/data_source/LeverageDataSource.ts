import {Logger} from '../../../service/logger/Logger';
import LeveragePosition from '../../../types/LeveragePosition';

export default abstract class LeverageDataSource {
  constructor(protected readonly logger: Logger) { }

  abstract getPositionsByNftIds(nftIds: number[]): Promise<LeveragePosition[]>;

  abstract getLivePositions(): Promise<LeveragePosition[]>;

  abstract getLivePositionsNftIds(): Promise<number[]>;
}
