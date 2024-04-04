import 'reflect-metadata';

import pg, {Client} from 'pg'; // Import Client instead of Pool
import LeveragePosition from '../../../types/LeveragePosition';
import {ILogger} from '../../../service/logger/interfaces/ILogger';
import {inject, injectable} from 'inversify';
import {ILeverageDataSource} from './interfaces/ILeverageDataSource';


@injectable()
export default class PostgreDataSource implements ILeverageDataSource {
  private client: pg.Client;
  protected logger: ILogger;

  constructor(@inject('ILoggerAll') _logger: ILogger,
    @inject('LeverageDBClient') _client: Client) {
    this.logger = _logger;
    this.client = _client;
  }
  async getPositionsByNftIds(nftIds: number[]): Promise<LeveragePosition[]> {
    const query = {
      text: 'SELECT * FROM "LeveragePosition" WHERE "nftId" = ANY($1::int[])',
      values: [nftIds],
    };
    const resp = await this.executeQuery(query);
    return resp ? (resp.rows as LeveragePosition[]) : [];
  }
  async getLivePositions(): Promise<LeveragePosition[]> {
    const query = 'SELECT * FROM "LeveragePosition" WHERE "positionState" = \'LIVE\' LIMIT 1000';
    const resp = await this.executeQuery(query);
    return resp ? (resp.rows as LeveragePosition[]) : [];
  }
  async getLivePositionsNftIds(): Promise<number[]> {
    const resp = await this.executeQuery('SELECT "nftId" FROM "LeveragePosition" WHERE "positionState" = \'LIVE\'');
    return resp ? resp.rows.map((row) => row.nftId) : [];
  }

  private async connect() {
    await this.client.connect().catch((e) => {
      this.logger.error('Database connection failed');
      throw e;
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async executeQuery(query: string | { text: string, values: any[] }): Promise<pg.QueryResult | null> {
    await this.connect();
    try {
      if (this.client) {
        return await this.client.query(query);
      }
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }

    return null;
  }
}
