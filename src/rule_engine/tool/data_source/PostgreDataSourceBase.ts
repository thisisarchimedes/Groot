import pg from 'pg'; // Import Client instead of Pool
import {ILogger} from '../../../service/logger/interfaces/ILogger';
import {IConfigServiceAWS} from '../../../service/config/interfaces/IConfigServiceAWS';

export default class PostgreDataSourceBase {
  private client: pg.Client | null = null;

  constructor(private logger: ILogger, private configService: IConfigServiceAWS) {}

  private async connect() {
    if (!this.client) {
      this.client = new pg.Client(this.configService.getLeverageDBURL()); // Initialize a new Client
      await this.client.connect().catch((err) => {
        this.logger.error(`Could not connect to the database: ${(err as Error).message}`);
        process.exit(-1);
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async executeQuery(query: string | { text: string, values: any[] }): Promise<pg.QueryResult> {
    await this.connect();
    try {
      if (this.client) {
        return await this.client.query(query);
      } else {
        throw new Error('DB client is not initialized');
      }
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }
  }
}
