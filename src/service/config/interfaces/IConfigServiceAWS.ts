import {IConfigService} from './IConfigService';

export interface IConfigServiceAWS extends IConfigService {
    getAWSRegion(): string;
    getLeverageDBURL(): string;
}
