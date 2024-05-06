import {QueryConfig, QueryConfigValues, QueryResult, QueryResultRow} from 'pg';
import {LoggedClient} from '../../../src/service/db/dbService';
import {Logger} from '../../../src/service/logger/Logger';

export class PGClientAdapter extends LoggedClient {
  private queryResponse: QueryResult | null = null;
  private lastExecutedQuery: string | QueryConfig | null = null;

  constructor(logger: Logger) {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public override query<R extends QueryResultRow = any, I = any[]>(
      queryTextOrConfig: string | QueryConfig<I>,
      values?: QueryConfigValues<I>,
  ): Promise<QueryResult<R>> {
    this.lastExecutedQuery = queryTextOrConfig as string | QueryConfig | null;
    if (this.queryResponse) {
      return Promise.resolve(this.queryResponse);
    }
    return super.query(queryTextOrConfig, values);
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
