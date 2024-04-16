import {QueryConfig, QueryResult, QueryResultRow} from 'pg';
import {LoggedClient} from '../../../src/service/db/dbService';
import {LoggerAll} from '../../../src/service/logger/LoggerAll';

export class PGClientAdapter extends LoggedClient {
  private queryResponse: QueryResult | null = null;
  private lastExecutedQuery: string | QueryConfig | null = null;

  constructor(logger: LoggerAll) {
    super({
      query_timeout: 1000,
      connectionTimeoutMillis: 1000,
      statement_timeout: 1000,
    }, logger);
  }

  public async connect(): Promise<void> {
    await super.connect();
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

  public setQueryResponse(response: QueryResult): void {
    this.queryResponse = response;
  }

  public getLastExecutedQuery(): string | QueryConfig | null {
    return this.lastExecutedQuery;
  }

  public reset(): void {
    this.queryResponse = null;
    this.lastExecutedQuery = null;
  }
}
