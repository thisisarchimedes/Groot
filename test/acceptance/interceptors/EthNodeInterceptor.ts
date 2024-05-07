import nock from 'nock';
import {Interceptor} from './Interceptor';

export class EthNodeInterceptor extends Interceptor {
  private readonly mockRpcUrl: string;
  private blockNumber: number = 0; // Property to store the block number
  private ethCallResponse: any = null; // Property to store the response of the eth_call method

  constructor(mockRpcUrl: string) {
    super();
    this.mockRpcUrl = mockRpcUrl;
  }

  public setMockBlockNumber(blockNumber: number): void {
    this.blockNumber = blockNumber;
  }
  public setEthCallResponse(response: any): void {}

  public interceptCalls(): void {
    nock(this.mockRpcUrl)
        .persist()
        .post(/.*/, () => {
          return true;
        })
        .reply(200, (uri, requestBody) => {
          const requests = Array.isArray(requestBody) ?
          requestBody :
          [requestBody];

          const responses = requests.map((request) => {
            if (request.method === 'eth_chainId') {
              return {jsonrpc: '2.0', id: request.id, result: '0x1'};
            } else if (request.method === 'eth_blockNumber') {
              if (!this.blockNumber) {
                this.blockNumber = 100;
              }
              return {
                jsonrpc: '2.0',
                id: request.id,
                result: `0x${this.blockNumber.toString(16)}`,
              };
            }
          // add other methods handlers here
          });

          return Array.isArray(requestBody) ? responses : responses[0];
        });
  }
}
