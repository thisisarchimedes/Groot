import {Client} from 'pg';
import {ConfigService} from '../config/ConfigService';

export default class dbService {
  private transactionsClient:Client;
  private leverageClient:Client;

  constructor(configService: ConfigService) {
    this.transactionsClient = new Client({
      connectionString: configService.getTransactionsDBURL(),
      ssl: {
        rejectUnauthorized: false,
      },
    });

    this.leverageClient = new Client({
      connectionString: configService.getLeverageDBURL(),
      ssl: {
        rejectUnauthorized: false,
      },
    });
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
