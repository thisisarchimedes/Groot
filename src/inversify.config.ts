// InversifyConfig.ts
import 'reflect-metadata';
import { Container } from 'inversify';
import { LoggerAll } from './service/logger/LoggerAll';
import { IConfigServiceAWS } from './service/config/interfaces/IConfigServiceAWS';
import { ILoggerAll } from './service/logger/interfaces/ILoggerAll';
import { Groot } from './Groot';
import { TYPES } from './inversify.types';

export class InversifyConfig {
    private container: Container;

    constructor(configServiceAWS: IConfigServiceAWS) {
        this.container = new Container();

        this.container.bind<string>(TYPES.ServiceName).toConstantValue("Groot");

        // Bind the pre-initialized ConfigServiceAWS instance
        this.container.bind<IConfigServiceAWS>(TYPES.IConfigServiceAWS).toConstantValue(configServiceAWS);

        this.container.bind<ILoggerAll>(TYPES.ILoggerAll).to(LoggerAll).inSingletonScope();

        this.container.bind<Groot>(TYPES.Groot).to(Groot).inSingletonScope();
    }

    public getContainer(): Container {
        return this.container;
    }
}
