interface IConfigServiceAWS {
    refreshConfig(): Promise<void>;
    getAWSRegion(): string;
}