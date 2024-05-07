import sinon from 'sinon';
import {Interceptor} from './Interceptor';
import {Client} from 'pg';


export class PostgresDBInterceptor extends Interceptor {
  constructor() {
    super();
  }

  public setQueryAlwaysSuccessOnce(): void {
    const postgreeStubQuery = sinon.stub(Client.prototype, 'query');
    postgreeStubQuery.onFirstCall().resolves({
      rows: [{counter: 1}],
    });
  }

  public clearInterceptor(): void {
    sinon.restore();
  }
}
