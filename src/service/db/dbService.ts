import {Client, ClientConfig, QueryResult} from 'pg';
import {ConfigServiceAWS} from '../config/ConfigServiceAWS';
import {ILogger} from '../logger/interfaces/ILogger';


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
  public async query(...args: unknown[]): QueryResult<QueryResultRow> {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return await super['query'](...args);
    } catch (e) {
      this.logger.error(`Error executing DB query: ${JSON.stringify(e)}`);
      throw e;
    }
  }
}
