import nock from 'nock';
import {Mock} from './Mock';

export class MockNewRelic extends Mock {
  private baseUrl: string;
  private waitedOnMessage!: string;
  private waitedOnMessageObserved: boolean = false;

  constructor(baseUrl: string) {
    super();
    this.baseUrl = baseUrl;
  }

  public setWaitedOnMessage(message: string): void {
    this.waitedOnMessage = message;
    this.waitedOnMessageObserved = false;

    nock(this.baseUrl)
        .persist()
        .post('/log/v1', () => true)
        .reply(200, (_, requestBody) => {
          const includesWaitedOnMessage = JSON.stringify(requestBody).includes(this.waitedOnMessage);
          if (includesWaitedOnMessage) {
            this.waitedOnMessageObserved = true;
          }
        });
  }

  public isWaitedOnMessageObserved(): boolean {
    return this.waitedOnMessageObserved;
  }
}
