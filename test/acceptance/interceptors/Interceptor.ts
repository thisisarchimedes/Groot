import nock from 'nock';

export class Interceptor {
  public cleanup() {
    nock.cleanAll();
  }
}
