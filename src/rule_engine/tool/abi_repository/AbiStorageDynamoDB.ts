import { injectable, inject } from 'inversify';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import { IAbiStorage } from './interfaces/IAbiStorage';
import { IConfigServiceAWS } from '../../../service/config/interfaces/IConfigServiceAWS';

@injectable()
export class AbiStorageDynamoDB implements IAbiStorage {
  private readonly tableName: string;
  private dynamoDB: DynamoDB.DocumentClient;
  private readonly configService: IConfigServiceAWS


  constructor(
    @inject("IConfigServiceAWS") _configService: IConfigServiceAWS,
  ) {
    this.configService = _configService;
    this.tableName = this.configService.getDynamoDBAbiRepoTable();
    const region = this.configService.getAWSRegion()
    this.dynamoDB = new DynamoDB.DocumentClient({ region });
  }

  public async storeAbiForAddress(contractAddress: string, abi: string): Promise<void> {
    const params: DynamoDB.DocumentClient.PutItemInput = {
      TableName: this.tableName,
      Item: {
        address: contractAddress,
        abi,
      },
    };

    await this.dynamoDB.put(params).promise();
  }

  public async getAbiForAddress(contractAddress: string): Promise<string | null> {
    const params: DynamoDB.DocumentClient.GetItemInput = {
      TableName: this.tableName,
      Key: {
        address: contractAddress,
      },
    };

    const result = await this.dynamoDB.get(params).promise();
    return result.Item ? result.Item.abi : null;
  }
}
