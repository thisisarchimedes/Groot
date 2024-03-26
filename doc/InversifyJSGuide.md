
# Dependency Injection in TypeScript with InversifyJS

This guide provides detailed instructions on how to add new objects to the InversifyJS container and inject dependencies in your TypeScript project using string literals for type identifiers. It assumes that `reflect-metadata` is already part of your project setup.

## Prerequisites

- Basic understanding of TypeScript and dependency injection principles.
- Your project is set up with InversifyJS and TypeScript.
- `reflect-metadata` is included in your project's `package.json`.

## Setting Up the Inversify Container

The Inversify container is crucial for managing our application's dependencies. Here's how to set it up with string literals for type identifiers:

### 1. Define Types in `inversify.types.ts`

Instead of using `Symbol.for()`, we will use string literals directly as identifiers.

```typescript
export const TYPES = {
  ILoggerAll: "ILoggerAll",
  IBlockchainReader: "IBlockchainReader",
  IAbiRepo: "IAbiRepo",
  // Add new identifiers here
};
```

### 2. Configure the Container in `inversify.config.ts`

Import necessary modules and types, and bind interfaces to their concrete implementations using the string literals.

```typescript
import { Container } from 'inversify';
import "reflect-metadata";
import { TYPES } from './inversify.types';
import { ILoggerAll, IBlockchainReader, IAbiRepo } from './interfaces';
import { LoggerAll, BlockchainReader, AbiRepo } from './implementations';

const myContainer = new Container();
myContainer.bind<ILoggerAll>(TYPES.ILoggerAll).to(LoggerAll);
myContainer.bind<IBlockchainReader>(TYPES.IBlockchainReader).to(BlockchainReader);
myContainer.bind<IAbiRepo>(TYPES.IAbiRepo).to(AbiRepo);
// Add more bindings as needed
```

Remember to export the container so it can be utilized throughout your application.

### Adding a New Object to the Container

To add a new object:

1. Define its interface and implementation.
2. Update `inversify.types.ts` by adding a new string literal identifier for your object.
3. Bind the new type in `inversify.config.ts`.

### Injecting Dependencies

Use the `@injectable()` decorator for classes and the `@inject()` decorator for constructor parameters, referencing the string literal identifiers.

```typescript
import { injectable, inject } from 'inversify';
import { TYPES } from './inversify.types';

@injectable()
export class MyService {
  constructor(@inject(TYPES.ILoggerAll) private logger: ILoggerAll) {
    // Your constructor logic here
  }
}
```

## Example Usage

Define interfaces and their implementations, bind them in the container, and inject dependencies as needed. This approach simplifies dependency management in your TypeScript project using InversifyJS.

## Unit Testing with InversifyJS

For unit testing, we use a separate Inversify configuration file named `inversify.config.unit_test.ts`. This allows us to mock different objects for testing purposes, ensuring that our tests are isolated and independent of the actual implementations.

The mocks are typically stored in the `./test/unit/adapter` directory. Here’s how to set up and use this configuration:

1. **Create `inversify.config.unit_test.ts`**: This file will closely resemble your main `inversify.config.ts` but will bind interfaces to their mock implementations instead of the actual ones.

2. **Mock Implementations**: Place your mock classes or objects inside the `./test/unit/adapter` directory. These mocks will replace the real implementations during unit testing.

3. **Configure the Test Container**: Bind your interfaces to the mock implementations in `inversify.config.unit_test.ts`. 

```typescript
// Example mock binding in inversify.config.unit_test.ts
myContainer.bind<ILoggerAll>(TYPES.ILoggerAll).to(MockLoggerAll);
```

4. **Use in Tests**: When writing tests, use `inversify.config.unit_test.ts` to inject dependencies. This ensures your unit tests are using the mocks instead of the actual implementations.

By maintaining a separate Inversify configuration for unit testing, you can more easily manage your test environment and dependencies, leading to more reliable and isolated unit tests.
