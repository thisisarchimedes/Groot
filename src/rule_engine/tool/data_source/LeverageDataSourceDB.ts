import 'reflect-metadata';

import LeveragePosition from '../../../types/LeveragePosition';
import DBService from '../../../service/db/dbService';
import LeverageDataSource from './LeverageDataSource';
import {ModulesParams} from '../../../types/ModulesParams';

export default class LeverageDataSourceDB extends LeverageDataSource {
  private dbService: DBService;

  constructor(
      modulesParams: ModulesParams,
  ) {
    super(modulesParams.logger!);
    this.dbService = modulesParams.dbService!;
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
