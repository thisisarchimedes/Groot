import {ConfigServiceAWS} from '../../../src/service/config/ConfigServiceAWS';
import DBService from '../../../src/service/db/dbService';
import {LoggerAll} from '../../../src/service/logger/LoggerAll';
import {PGClientAdapter} from './PGClientAdapter';

export default class DBServiceAdapter extends DBService {
  private pgClientAdapter: PGClientAdapter;

  constructor(
      logger: LoggerAll,
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
