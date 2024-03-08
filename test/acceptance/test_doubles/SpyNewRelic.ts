import nock from 'nock';
import {NockTestDouble} from './NockTestDouble';

export class SpyNewRelic extends NockTestDouble {
  private baseUrl: string;
  private waitedOnMessage!: string;
  private waitedOnMessageObserved: boolean = false;

  constructor(baseUrl: string) {
    super();
    this.baseUrl = baseUrl;
  }

  /* public spyLogEndpoint() {
     nock(this.baseUrl)
         .persist()
         .post('/log/v1', () => true)
         .reply(200, (_, requestBody) => {
           console.log('requestBody:', JSON.stringify(requestBody));
           console.log('this.waitedOnMessage:', this.waitedOnMessage);
           if (JSON.stringify(requestBody).includes(this.waitedOnMessage)) {
             this.waitedOnMessageObserved = true;
           }
           return {};
         });
   }*/

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
