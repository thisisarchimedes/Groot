import LeveragePosition from '../../../types/LeveragePosition';
import PostgreDataSourceBase from './PostgreDataSourceBase';


export default class LeverageDataSource extends PostgreDataSourceBase {
  public async getPositionsByNftIds(nftIds: number[]): Promise<LeveragePosition[]> {
    const query = {
      text: 'SELECT * FROM "LeveragePosition" WHERE "nftId" = ANY($1::int[])',
      values: [nftIds],
    };
    const resp = await this.executeQuery(query);
    return resp ? (resp.rows as LeveragePosition[]) : [];
  }

  public async getLivePositions(): Promise<LeveragePosition[]> {
    const query = 'SELECT * FROM "LeveragePosition" WHERE "positionState" = \'LIVE\' LIMIT 1000';
    const resp = await this.executeQuery(query);
    return resp ? (resp.rows as LeveragePosition[]) : [];
  }

  public async getLivePositionsNftIds(): Promise<number[]> {
    const resp = await this.executeQuery('SELECT "nftId" FROM "LeveragePosition" WHERE "positionState" = \'LIVE\'');
    return resp ? resp.rows.map((row) => row.nftId) : [];
  }
}