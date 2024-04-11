
# Groot Dependency Injection Guide with InversifyJS

This guide provides detailed steps on how to integrate a new class into our TypeScript project using InversifyJS for dependency injection.

## Writing a New Class

### 1. Registering on TYPES

Register your new class in the `TYPES` object within the `inversify.types.ts` file. The `TYPES` object serves as a dictionary to map interfaces to their implementations, allowing the injection of different implementations of the same interface using unique identifiers. Here is how the file might look:

```typescript
const TYPES = {
  ILoggerAll: 'ILoggerAll',
  ILoggerConsole: 'ILoggerConsole',
  // Other mappings
};

export { TYPES };
```

For example, if you have an `ILogger` interface with multiple implementations like `ILoggerAll` and `LoggerConsole`, you can register both in `TYPES` with different identifiers. This approach allows for more flexible dependency management, as you can specify which implementation to use in different parts of your application by referring to these identifiers.

### 2. Adding to Container

To add your class to the dependency injection container, modify the `inversify.config.ts` file. Use the `container.bind<T>().to().inScope()` method chain, selecting the appropriate lifecycle scope for your class instance.

#### 2.1 Instance Lifecycle in the Container

Understanding the lifecycle of objects within the container is crucial for managing your application's resources efficiently. InversifyJS offers several lifecycle options:

- **Singleton Scope (`inSingletonScope()`)**: Ensures a single instance of the class across your application. Use this for shared resources or stateless services that are expensive to create.

- **Transient Scope (`inTransientScope()`)**: A new instance is created each time an object is requested. This is suitable for lightweight, stateful services where each consumer needs a separate instance.

- **Request Scope (`inRequestScope()`)**: Similar to transient scope, but within the context of a single request. Ideal for request-specific data and services, ensuring that all injections within the same request are the same instance.

- **Custom Scope**: You can also define custom scopes to fine-tune the lifecycle of your services based on specific application needs.

### 3. Injecting Other Types to the Class

Inject dependencies into your class through the constructor using the `@inject` decorator and the identifiers from the `TYPES` object:

```typescript
constructor(
  @inject(TYPES.ILoggerAll) private logger: ILogger,
  // Additional dependencies
) {
  // Initialization code
}
```

### 4. Unit Tests

For unit testing, utilize a separate container in `inversify.config.unit_test.ts` that uses mock objects instead of real instances. This approach allows for isolation of the class under test.

- **Unit Tests**: Use the test container to mock dependencies, facilitating isolated tests.
- **Other Tests**: For integration and end-to-end tests, use the same container configuration as production to ensure environmental consistency.

## Summary

By following these guidelines, you can effectively integrate new classes into your project with InversifyJS, promoting loose coupling and making your components easily testable.
