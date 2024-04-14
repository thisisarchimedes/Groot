import {QueryConfig, QueryResult, QueryResultRow} from 'pg';
import {LoggedClient} from '../../../src/service/db/dbService';
import {LoggerAll} from '../../../src/service/logger/LoggerAll';

export class PGClientAdapter extends LoggedClient {
  private throwErrorOnConnect: boolean = false;
  private errorMessage: string = '';
  private queryResponse: QueryResult | null = null;
  private lastExecutedQuery: string | QueryConfig | null = null;

  constructor(logger: LoggerAll) {
    super({}, logger);
  }

  public connect(): Promise<void> {
    if (this.throwErrorOnConnect) {
      throw new Error(this.errorMessage);
    }
    return Promise.resolve();
  }

  public query(...args: unknown[]): QueryResult<QueryResultRow> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.lastExecutedQuery = args[0] as string | QueryConfig<any[]> | null;
    if (this.queryResponse) {
      return this.queryResponse;
    }
    return super.query(args[0]);
  }

  public setThrowErrorOnConnect(throwError: boolean): void {
    this.throwErrorOnConnect = throwError;
  }

  public setErrorMessage(message: string): void {
    this.errorMessage = message;
  }

  public setQueryResponse(response: QueryResult): void {
    this.queryResponse = response;
  }

  public getLastExecutedQuery(): string | QueryConfig | null {
    return this.lastExecutedQuery;
  }

  public reset(): void {
    this.throwErrorOnConnect = false;
    this.errorMessage = '';
    this.queryResponse = null;
    this.lastExecutedQuery = null;
  }
}
