import DBService from '../../../src/service/db/dbService';
import {ILogger} from '../../../src/service/logger/interfaces/ILogger';
import {PGClientAdapter} from './PGClientAdapter';
import {ConfigServiceAWS} from '../../../src/service/config/ConfigServiceAWS';

export default class DBServiceAdapter extends DBService {
  private pgClientAdapter: PGClientAdapter;

  constructor(
      logger: ILogger,
      configService: ConfigServiceAWS,
  ) {
    super(logger, configService);
    this.pgClientAdapter = new PGClientAdapter(logger);
  }

  public getTransactionsClient() {
    return this.pgClientAdapter;
  }

  public getLeverageClient() {
    return this.pgClientAdapter;
  }

  connect() {
    return Promise.resolve();
  }

  end() {
    return Promise.resolve();
  }
}
