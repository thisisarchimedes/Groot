import 'reflect-metadata';
import { Container } from 'inversify';
import { LoggerAll } from './service/logger/LoggerAll';
import { ConfigServiceAWS } from './service/config/ConfigServiceAWS';
import { IConfigServiceAWS } from './service/config/interfaces/IConfigServiceAWS';
import { ILoggerAll } from './service/logger/interfaces/ILoggerAll';
import { Groot } from './Groot'; // Ensure this path is correct

const TYPES = {
    ILoggerAll: "ILoggerAll",
    IConfigServiceAWS: "IConfigServiceAWS",
    Environment: Symbol.for("Environment"),
    Region: Symbol.for("Region"),
    Groot: "Groot",
};

const container = new Container();

// Logger and ConfigServiceAWS bindings
container.bind<ILoggerAll>(TYPES.ILoggerAll).to(LoggerAll).inSingletonScope();
container.bind<string>(TYPES.Environment).toConstantValue(process.env.ENVIRONMENT || "defaultEnvironment");
container.bind<string>(TYPES.Region).toConstantValue(process.env.AWS_REGION || "defaultRegion");

container.bind<IConfigServiceAWS>(TYPES.IConfigServiceAWS).toDynamicValue(ctx => {
    const environment = ctx.container.get<string>(TYPES.Environment);
    const region = ctx.container.get<string>(TYPES.Region);
    return new ConfigServiceAWS(environment, region);
}).inSingletonScope();

// Groot binding
container.bind<Groot>(TYPES.Groot).to(Groot).inSingletonScope();

export { container, TYPES };
