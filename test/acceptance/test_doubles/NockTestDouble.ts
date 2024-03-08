import nock from 'nock';

export class NockTestDouble {
  public cleanup() {
    nock.cleanAll();
  }
}
