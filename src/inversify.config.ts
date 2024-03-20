import 'reflect-metadata';
import { Container } from 'inversify';
import { LoggerAll } from './service/logger/LoggerAll';
import { ConfigServiceAWS } from './service/config/ConfigServiceAWS';

const container = new Container();
container.bind<ILoggerAll>("ILoggerAll").to(LoggerAll);
container.bind<IConfigServiceAWS>("IConfigServiceAWS").to(ConfigServiceAWS);

// Add other bindings here

export { container };