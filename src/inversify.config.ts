import 'reflect-metadata';
import { Container } from 'inversify';
import { LoggerAll } from './service/logger/LoggerAll';
import { ConfigServiceAWS } from './service/config/ConfigServiceAWS';
import { IConfigServiceAWS } from './service/config/IConfigServiceAWS';
import { ILoggerAll } from './service/logger/ILoggerAll';

const container = new Container();
container.bind<ILoggerAll>("ILoggerAll").to(LoggerAll);
container.bind<IConfigServiceAWS>("IConfigServiceAWS").to(ConfigServiceAWS);

// Add other bindings here

export { container };