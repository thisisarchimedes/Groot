export interface IAppConfigClient {
    fetchConfigRawString(configName: string): Promise<string>;
}
