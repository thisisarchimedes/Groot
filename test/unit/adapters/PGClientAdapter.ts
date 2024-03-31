import { Client, QueryConfig, QueryResult } from 'pg';

export class PGClientAdapter extends Client {
    private throwErrorOnConnect: boolean = false;
    private errorMessage: string = '';
    private queryResponse: QueryResult | null = null;
    private lastExecutedQuery: string | QueryConfig | null = null;

    public async connect(): Promise<void> {
        if (this.throwErrorOnConnect) {
            throw new Error(this.errorMessage);
        }
        await super.connect();
    }

    public async query(queryConfig: string | QueryConfig): Promise<QueryResult> {
        this.lastExecutedQuery = queryConfig;
        if (this.queryResponse) {
            return this.queryResponse;
        }
        return super.query(queryConfig);
    }

    public setThrowErrorOnConnect(throwError: boolean): void {
        this.throwErrorOnConnect = throwError;
    }

    public setErrorMessage(message: string): void {
        this.errorMessage = message;
    }

    public setQueryResponse(response: QueryResult): void {
        this.queryResponse =  response;
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