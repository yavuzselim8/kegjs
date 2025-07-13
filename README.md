# 🍻 KegJS

<p align="center">
  <img src="https://img.shields.io/npm/v/kegjs" alt="npm version">
  <img src="https://img.shields.io/npm/l/kegjs" alt="license">
</p>

**Powerful Dependency Injection for TypeScript/JavaScript without Reflection**

KegJS is a dependency injection framework that uses code generation instead of runtime reflection, providing performance benefits while maintaining a clean, decorator-based API.

> **⚠️ Early Development Notice:** KegJS is in its early stages of development (v0.0.x). The API is subject to breaking changes as we refine the framework. While we encourage you to try it and provide feedback, please be aware that you may need to update your code with future releases.

## Features

- ✅ **No Reflection**: Uses build-time code generation instead of runtime reflection
- ✅ **Type-Safe**: Validates dependency relationships at build time
- ✅ **Decorators**: Simple decorator-based API for defining services
- ✅ **Multiple Implementations**: Support for multiple implementations with default selection
- ✅ **Factory Providers**: Create dependencies using static factory methods
- ✅ **Testing Support**: Dedicated test mode for easy dependency mocking
- ✅ **Performance**: Runtime container with minimal overhead
- ✅ **Framework Agnostic**: Works with any TypeScript/JavaScript project

## Installation

```bash
# Using npm
npm install kegjs

# Using yarn
yarn add kegjs

# Using pnpm
pnpm add kegjs

# Using bun
bun add kegjs
```

## Basic Usage

### 1. Define your services

```typescript
// logger-service.ts
import { Service } from 'kegjs/decorators';

@Service()
export class Logger {
  log(message: string) {
    console.log(`[LOG]: ${message}`);
  }
}

// user-service.ts
import { Service } from 'kegjs/decorators';
import { Logger } from './logger.service';

@Service()
export class UserService {
  constructor(private logger: Logger) {}
  
  getUser(id: string) {
    this.logger.log(`Getting user with id: ${id}`);
    return { id, name: 'John Doe' };
  }
}
```

### 2. Generate the container

Run the KegJS CLI tool to generate the container initialization code:

```bash
npx kegjs generate
```

This will scan your codebase for decorated classes and generate a container initialization file that looks like this:

```typescript
/* THIS IS A GENERATED FILE, ANY MODIFICATIONS WILL BE OVERWRITTEN WITH THE NEW GENERATION */

import { Keg } from 'kegjs/container/keg';

import { Logger } from '../services/logger-service.ts';
import { UserService } from '../services/user-service.ts';

export function initializeContainer() {
    const container = Keg.getInstance();

    container.register({ useClass: Logger, tokens: ['Logger'], deps: [] });
    container.register({ useClass: UserService, tokens: ['UserService'], deps: ['Logger'] });
}
```

The generated file:
- Imports all your classes
- Creates a function to initialize the container
- Registers each class with its dependencies
- Handles tokens, default implementations, and factory providers automatically

### 3. Initialize and use the container

```typescript
// app.ts
import { Keg } from 'kegjs/container/keg';
import { initializeContainer } from './src/generated/container.generated';
import { UserService } from './services/user-service';

// Initialize the container
initializeContainer();

// Get the container instance
const container = Keg.getInstance();

// Resolve and use services
const userService = container.resolve<UserService>('UserService');
const user = userService.getUser('123');
console.log(user); // { id: '123', name: 'John Doe' }
```

## Advanced Usage

### Interfaces with multiple implementations

```typescript
import { Service, Default } from 'kegjs/decorators';

// Interface for the service
interface Logger {
  log(message: string): void;
}

// Default implementation
@Service()
@Default()
export class ConsoleLogger implements Logger {
  log(message: string) {
    console.log(`[Console]: ${message}`);
  }
}

// Alternative implementation
@Service()
export class FileLogger implements Logger {
  log(message: string) {
    console.log(`[File]: ${message}`);
  }
}

@Service()
export class UserService {
    // ConsoleLogger is injected (default)
    constructor(private logger: Logger){}
}

@Service()
export class AdminService {
    // FileLogger is injected
    constructor(private logger: FileLogger)
}

@Service()
export class VisitorService {
    // Gets both ConsoleLogger and FileLogger in the array
    constructor(private loggers: Logger[])
} 
```

### Factory providers

```typescript
import { Provider, Default } from 'kegjs/decorators';
import { Config } from './config';

@Provider()
export class DatabaseProvider {
  @Default()
  static createDatabase(config: Config) {
    // The config parameter will be automatically injected
    return {
      connect() {
        console.log(`Connecting to ${config.dbUrl}`);
        // ...
      }
    };
  }
}
```

### Testing with Mocks

```typescript
import { Keg } from 'kegjs/container/keg';
import { UserService } from './user-service';

describe('User Service tests', () => {
  const container = Keg.getInstance();
  
  beforeAll(() => {
    // Enable test mode before each test
    container.enableTestMode();
  });
  
  afterAll(() => {
    // Clear mocks and disable test mode after each test
    container.clearMocks();
    container.disableTestMode();
  });
  
  test('should get user', () => {
    // Create a mock implementation
    const mockUserService = {
      getUser: jest.fn().mockReturnValue({ id: '123', name: 'Mock User' })
    };
    
    // Register the mock
    container.registerMock('UserService', mockUserService);
    
    // Get the service from the container
    const userService = container.resolve<UserService>('UserService');
    
    // Use the mock
    const user = userService.getUser('123');
    
    // Test assertions
    expect(mockUserService.getUser).toHaveBeenCalledWith('123');
    expect(user.name).toBe('Mock User');
  });
});
```

## Configuration

Create a `kegcli.config.js` file in your project root:

```javascript
module.exports = {
  srcDir: './src',     // Source directory to scan
  outDir: './src/generated',  // Output directory for generated files
  strict: true         // Enable strict validation
};
```

## CLI Options

```bash
# Generate container code
npx kegjs generate

# Help
npx kegjs --help
```

## How It Works

KegJS takes a different approach to dependency injection:

1. **Decorators as Markers**: Decorators like `@Service()` mark classes for dependency injection
2. **Code Generation**: The CLI tool parses your TypeScript code to identify services and their dependencies
3. Before code generation CLI tool validates that every dependency can be resolved correctly. If not an error will be thrown
4. **Container Initialization**: A container initialization file is generated with all service registrations
5. **Runtime Resolution**: The Keg container resolves dependencies at runtime with minimal overhead

## Contributing

Contributions of all kind are welcome! Please feel free to submit a pull request, create an issue, ask for features.

## License

KegJS is [MIT licensed](./LICENSE).

---

Created by [Yavuz Tasci](https://github.com/yavuztasci)