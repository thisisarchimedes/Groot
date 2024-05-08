import nock from 'nock';
import {Interceptor} from './Interceptor';

const FUNCTION_SELECTORS = {
  currentTick: '0x065e5360',
  upperTick: '0x727dd228',
  lowerTick: '0x9b1344ac',
  tickSpacing: '0xd0c93a7c',
  pool: '0x16f0115b',
  getPosition: '0x7398ab18',
};
export class EthNodeInterceptor extends Interceptor {
  private readonly mockRpcUrl: string;
  private blockNumber: number = 0; // Property to store the block number
  private ethCallResponse: Record<string, string> = {}; // Property to store the response of the eth_call method

  constructor(mockRpcUrl: string) {
    super();
    this.mockRpcUrl = mockRpcUrl;
  }

  public setMockBlockNumber(blockNumber: number): void {
    this.blockNumber = blockNumber;
  }
  public setEthCallResponse(key: string, response: string): void {
    this.ethCallResponse[key] = response;
  }

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
          // eslint-disable-next-line
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
            } else if (request.method === 'eth_call') {
              let result = '0x';
              switch (request.params[0].data.slice(0, 10)) {
                case FUNCTION_SELECTORS.currentTick:
                  result = this.ethCallResponse.currentTick;
                  break;
                case FUNCTION_SELECTORS.upperTick:
                  result = this.ethCallResponse.upperTick;
                  break;
                case FUNCTION_SELECTORS.lowerTick:
                  result = this.ethCallResponse.lowerTick;
                  break;
                case FUNCTION_SELECTORS.pool:
                  result = this.ethCallResponse.pool;
                  break;
                case FUNCTION_SELECTORS.getPosition:
                  result = this.ethCallResponse.getPosition;
                  break;
                case FUNCTION_SELECTORS.tickSpacing:
                  result = this.ethCallResponse.tickSpacing;
                  break;
                default:
                  break;
              }
              return {
                jsonrpc: '2.0',
                id: request.id,
                result: result,
              };
            }
          // add other methods handlers here
          });

          return Array.isArray(requestBody) ? responses : responses[0];
        });
  }
}
