# AGENTS.md - Development Guidelines for Agents

This document provides guidelines for AI agents working on the SCMS (Support Center Management System) backend.

## Project Overview

- **Type**: NestJS TypeScript REST API
- **Database**: PostgreSQL
- **Package Manager**: pnpm

---

## Commands

### Development

```bash
pnpm install          # Install dependencies
pnpm start:dev       # Start with hot reload
pnpm start:debug     # Start with debugger
pnpm start:prod      # Start production build
```

### Build

```bash
pnpm build           # Build for production (outputs to dist/)
```

### Linting & Formatting

```bash
pnpm lint            # Run ESLint with auto-fix
pnpm format          # Run Prettier to format code
```

### Testing

```bash
pnpm test            # Run all tests
pnpm test:watch     # Run tests in watch mode
pnpm test:cov       # Run tests with coverage
pnpm test:e2e       # Run e2e tests
```

**Running a single test:**

```bash
# Unit test (spec file)
pnpm test -- src/app.controller.spec.ts

# With watch mode for specific file
pnpm test -- src/app.controller.spec.ts --watch

# Specific test name
pnpm test -- --testNamePattern="should return hello"
```

---

## Code Style Guidelines

### TypeScript Configuration

- Target: ES2023
- Strict null checks enabled
- Decorators enabled for NestJS
- Use `any` sparingly (eslint will warn)

### Formatting (Prettier)

- Single quotes for strings
- Trailing commas on all arguments
- End of line: auto (LF on Linux/mac, CRLF on Windows)

### Naming Conventions

| Element    | Convention          | Example                          |
| ---------- | ------------------- | -------------------------------- |
| Files      | kebab-case          | `user.service.ts`                |
| Classes    | PascalCase          | `UserService`                    |
| Interfaces | PascalCase          | `CreateUserDto`                  |
| Types      | PascalCase          | `UserRole`                       |
| Enums      | PascalCase          | `UserRole` (members UPPER_SNAKE) |
| Variables  | camelCase           | `userName`                       |
| Constants  | UPPER_SNAKE         | `MAX_RETRY_COUNT`                |
| Methods    | camelCase           | `getUserById()`                  |
| DTOs       | PascalCase + suffix | `CreateUserDto`, `UpdateUserDto` |

### Import Order

1. External libraries (`@nestjs/...`, `rxjs`)
2. Internal modules (`../service`, `./dto`)
3. Types/interfaces

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
```

### Error Handling

- Use NestJS built-in exceptions (`NotFoundException`, `BadRequestException`, `UnauthorizedException`)
- Use HttpException for custom status codes
- Always return proper HTTP status codes
- Validate inputs with class-validator DTOs

```typescript
@Post()
async create(@Body() createDto: CreateUserDto) {
  if (!createDto.email) {
    throw new BadRequestException('Email is required');
  }
  // ... implementation
}
```

### Controller Patterns

- Use dependency injection for services
- Return DTOs, not entities
- Use appropriate HTTP decorators (`@Get`, `@Post`, `@Put`, `@Delete`)
- Add route parameters with type validation

```typescript
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserDto> {
    return this.userService.findById(id);
  }
}
```

### Service Patterns

- Mark with `@Injectable()`
- Single responsibility principle
- Use Observables/RxJS for async operations when appropriate

### DTOs

- Use class-validator for validation
- Use class-transformer for serialization
- Document with JSDoc for complex fields

```typescript
export class CreateEnrollmentDto {
  @IsInt()
  @Min(1)
  studentId: number;

  @IsInt()
  @Min(1)
  classId: number;
}
```

### Database Entities

- Use Prisma (check existing implementation)
- Define proper relations
- Use appropriate column types
- Add indexes for frequently queried fields

## Architecture

### Module Structure

```
src/
├── modules/          # Feature modules
│   ├── auth/
│   ├── users/
│   ├── classes/
│   ├── enrollments/
│   └── attendance/
├── common/           # Shared utilities, guards, filters
├── config/          # Configuration
├── entities/        # Database entities
├── dto/             # Data transfer objects
└── main.ts          # Application entry
```

### General Rules

- Always validate user input
- Use proper HTTP status codes
- Log errors appropriately
- Never expose sensitive data in responses
- Use transactions for multi-step operations

---

## Key Dependencies

- `@nestjs/common` - Core NestJS
- `@nestjs/core` - Core framework
- `@nestjs/platform-express` - Express adapter
- `rxjs` - Reactive extensions
- `class-validator` - DTO validation
- `prisma` - ORM
