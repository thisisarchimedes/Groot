import nock from 'nock';
import {Mock} from './Mock';

export class MockEthNode extends Mock {
  private readonly mockRpcUrl: string;
  constructor(mockRpcUrl: string) {
    super();
    this.mockRpcUrl = mockRpcUrl;
  }

  public setupETHNodeBlocknumber(blockNumber: number): void {
    nock(this.mockRpcUrl)
        .persist()
        .post('/', (body) => {
          return (
            body.jsonrpc === '2.0' &&
          body.method === 'eth_blockNumber' &&
          Array.isArray(body.params) &&
          body.params.length === 0
          );
        })
        .reply(200, (uri, requestBody: { id: string }) => {
          return {
            jsonrpc: '2.0',
            id: requestBody.id,
            result: `0x${blockNumber.toString(16)}`,
          };
        });
  }

  public setupReset(): void {
    nock(this.mockRpcUrl)
        .persist()
        .post('/')
        .reply(200, (uri, requestBody: { id: number }) => {
          return {
            jsonrpc: '2.0',
            id: requestBody.id,
            result: true,
          };
        });
  }
}
