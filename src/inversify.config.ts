import 'reflect-metadata';
import { Container } from 'inversify';
import { LoggerAll } from './service/logger/LoggerAll';
import { ConfigServiceAWS } from './service/config/ConfigServiceAWS';
import { IConfigServiceAWS } from './service/config/interfaces/IConfigServiceAWS';
import { ILoggerAll } from './service/logger/interfaces/ILoggerAll';
import { Groot } from './Groot';
import { TYPES } from './inversify.types'; // Adjust the path as necessary

const container = new Container();

// Logger and ConfigServiceAWS bindings
container.bind<ILoggerAll>(TYPES.ILoggerAll).to(LoggerAll).inSingletonScope();
container.bind<string>(TYPES.Environment).toConstantValue(process.env.ENVIRONMENT || "defaultEnvironment");
container.bind<string>(TYPES.Region).toConstantValue(process.env.AWS_REGION || "defaultRegion");
container.bind<string>(TYPES.ServiceName).toConstantValue("Groot");
container.bind<IConfigServiceAWS>(TYPES.IConfigServiceAWS).toDynamicValue(ctx => {
    const environment = ctx.container.get<string>(TYPES.Environment);
    const region = ctx.container.get<string>(TYPES.Region);
    return new ConfigServiceAWS(environment, region);
}).inSingletonScope();

// Groot binding
container.bind<Groot>(TYPES.Groot).to(Groot).inSingletonScope();

export { container, TYPES };