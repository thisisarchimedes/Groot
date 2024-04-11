import {Client, ClientConfig} from 'pg';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../inversify.types';
import {ConfigServiceAWS} from '../config/ConfigServiceAWS';
import {ILogger} from '../logger/interfaces/ILogger';

@injectable()
export default class DBService {
  private transactionsClient:LoggedClient;
  private leverageClient:LoggedClient;

  constructor(
    @inject('ILoggerAll') private logger: ILogger,
    @inject(TYPES.ConfigServiceAWS) configService: ConfigServiceAWS,
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

class LoggedClient extends Client {
  constructor(config: ClientConfig, private logger: ILogger) {
    super(config);
  }

  public connect() {
    try {
      return super.connect();
    } catch (e) {
      this.logger.error(`Error connecting to database: ${JSON.stringify(e)}`);
      throw e;
    }
  }

  public end() {
    try {
      return super.end();
    } catch (e) {
      this.logger.error(`Error ending connection to database: ${JSON.stringify(e)}`);
      throw e;
    }
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public query(...args: unknown[]) {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return super['query'](...args);
    } catch (e) {
      this.logger.error(`Error executing DB query: ${JSON.stringify(e)}`);
      throw e;
    }
  }
}
