import 'reflect-metadata';

import LeveragePosition from '../../../types/LeveragePosition';
import {ILogger} from '../../../service/logger/interfaces/ILogger';
import DBService from '../../../service/db/dbService';
import {TYPES} from '../../../inversify.types';


export default class PostgreDataSource {
  protected logger: ILogger;
  protected dbService: DBService;

  constructor(
      _logger: ILogger,
      dbService: DBService,
  ) {
    this.logger = _logger;
    this.dbService = dbService;
  }
  async getPositionsByNftIds(nftIds: number[]): Promise<LeveragePosition[]> {
    const query = {
      text: 'SELECT * FROM "LeveragePosition" WHERE "nftId" = ANY($1::int[])',
      values: [nftIds],
    };
    const resp = await this.dbService.getLeverageClient().query(query);
    return resp ? (resp.rows as LeveragePosition[]) : [];
  }
  async getLivePositions(): Promise<LeveragePosition[]> {
    const query = 'SELECT * FROM "LeveragePosition" WHERE "positionState" = \'LIVE\' LIMIT 1000';
    const resp = await this.dbService.getLeverageClient().query(query);
    return resp ? (resp.rows as LeveragePosition[]) : [];
  }
  async getLivePositionsNftIds(): Promise<number[]> {
    const resp = await this.dbService.getLeverageClient().query(
        'SELECT "nftId" FROM "LeveragePosition" WHERE "positionState" = \'LIVE\'',
    );
    return resp ? resp.rows.map((row) => row.nftId) : [];
  }
}
