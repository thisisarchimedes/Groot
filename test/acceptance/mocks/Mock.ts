import nock from 'nock';

export class Mock {
  public cleanup() {
    nock.cleanAll();
  }
}
