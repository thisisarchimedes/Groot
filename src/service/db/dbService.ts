import {Client, ClientConfig, QueryConfig, QueryConfigValues, QueryResult} from 'pg';
import {ILogger} from '../logger/interfaces/ILogger';
import {ConfigServiceAWS} from '../config/ConfigServiceAWS';


export default class DBService {
  private transactionsClient:LoggedClient;
  private leverageClient:LoggedClient;

  constructor(
      private logger: ILogger,
      configService: ConfigServiceAWS,
  ) {
    this.transactionsClient = new LoggedClient({
      connectionString: configService.getTransactionsDBURL(),
      ssl: {
        rejectUnauthorized: false,
      },
    },
    this.logger,
    );

    this.leverageClient = new LoggedClient({
      connectionString: configService.getLeverageDBURL(),
      ssl: {
        rejectUnauthorized: false,
      },
    },
    this.logger,
    );
  }

  public getTransactionsClient() {
    return this.transactionsClient;
  }

  public getLeverageClient() {
    return this.leverageClient;
  }

  async connect() {
    await this.transactionsClient.connect();
    await this.leverageClient.connect();
  }

  async end() {
    await this.transactionsClient.end();
    await this.leverageClient.end();
  }
}

export class LoggedClient extends Client {
  constructor(config: ClientConfig, private logger: ILogger) {
    super(config);
  }

  public async connect() {
    try {
      return await super.connect();
    } catch (e) {
      this.logger.error(`Error connecting to database: ${JSON.stringify(e)}`);
      throw e;
    }
  }

  public async end() {
    try {
      return await super.end();
    } catch (e) {
      this.logger.error(`Error ending connection to database: ${JSON.stringify(e)}`);
      throw e;
    }
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async override query<R extends QueryResultRow = any, I = any[]>(
      queryTextOrConfig: string | QueryConfig<I>,
      values?: QueryConfigValues<I>,
  ): Promise<QueryResult<R>> {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return await super.query(queryTextOrConfig, values);
    } catch (e) {
      this.logger.error(`Error executing DB query: ${JSON.stringify(e)}`);
      throw e;
    }
  }
}
