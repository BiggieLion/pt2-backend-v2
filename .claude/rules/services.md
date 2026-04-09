---
description: Rules for NestJS services in this project
paths:
  - "src/**/*.service.ts"
---

# Services

## Cabecera obligatoria

Todo service debe tener logger y leer config en el constructor:

```typescript
@Injectable()
export class FooService {
  private readonly logger = new Logger(FooService.name);
  private readonly userPoolId: string;

  constructor(
    private readonly configSvc: ConfigService,
    private readonly fooRepo: FooRepository,
    private readonly cognitoClient: CognitoIdentityProviderClient,
  ) {
    this.userPoolId = this.configSvc.getOrThrow<string>('cognito.userPoolId');
  }
}
```

## Manejo de errores Cognito

Siempre usar `getCognitoErrorName(err)` de `@common/utils/error.util`:

```typescript
} catch (err: unknown) {
  const name = getCognitoErrorName(err);

  if (name === 'UsernameExistsException') {
    throw new BadRequestException('An account with this email already exists.');
  }
  if (name === 'InvalidPasswordException') {
    throw new BadRequestException('Password does not meet security requirements.');
  }

  this.logger.error(`Cognito error: ${name ?? 'unknown'}`, (err as Error)?.stack);
  throw new InternalServerErrorException('Operation failed');
}
```

Excepciones Cognito conocidas y su HTTP exception correspondiente:

| Cognito error | HTTP exception |
|---|---|
| `UsernameExistsException` | `BadRequestException` |
| `InvalidPasswordException` | `BadRequestException` |
| `InvalidParameterException` | `BadRequestException` |
| `ExpiredCodeException` | `BadRequestException` |
| `CodeMismatchException` | `BadRequestException` |
| `NotAuthorizedException` | `UnauthorizedException` |
| `UserNotFoundException` | `UnauthorizedException` o `NotFoundException` según contexto |

## Rollback Cognito → DB

Cuando se crea usuario en Cognito antes de guardar en DB, si el guardado en DB falla hacer rollback:

```typescript
try {
  await this.requesterRepo.create(entity);
} catch (error) {
  this.logger.error('Failed to persist in DB', (error as Error)?.stack);
  try {
    await this.cognitoClient.send(new AdminDeleteUserCommand({
      UserPoolId: this.userPoolId,
      Username: username,
    }));
  } catch (delError) {
    this.logger.error(
      'Rollback Cognito user deletion failed — orphaned Cognito user requires manual cleanup',
      (delError as Error)?.stack,
    );
    throw new InternalServerErrorException(
      'Registration failed and automatic cleanup could not be completed. Please contact support.',
    );
  }
  throw new InternalServerErrorException('Failed to persist entity');
}
```

## Serialización con View DTOs

```typescript
// Usar plainToInstance con excludeExtraneousValues: true
return plainToInstance(RequesterViewDto, entity, {
  excludeExtraneousValues: true,
});
```

## Strip de campos sensibles antes de guardar en DB

```typescript
// Eliminar password antes de asignar a la entidad
const { password: _, ...entityData } = instanceToPlain(dto) as Record<string, unknown>;
```

## Logging — qué loggear y cómo

```typescript
// Al iniciar una operación
this.logger.log('Creating new requester in Cognito and DB');

// En warn (situación recuperable, usuario no encontrado, etc.)
this.logger.warn(`Cognito user not found for email; proceeding to delete DB record`);

// En error — SIEMPRE pasar err?.stack, NUNCA el objeto completo
this.logger.error('Cognito registration error: UsernameExistsException', (err as Error)?.stack);

// Para emails: usar maskEmail (primeros 2 chars + ***)
// NUNCA loggear el email completo, CURP, RFC, ni valores de campos financieros
```

## Reglas absolutas

- NUNCA acceder a `Repository<T>` de TypeORM directamente — solo vía `FooRepository`
- NUNCA leer `process.env` — usar `configSvc.getOrThrow<string>('ruta.config')`
- NUNCA usar `configSvc.get()` — siempre `getOrThrow()`
- NUNCA retornar entidades crudas — serializar con View DTO
- NUNCA usar `console.log` — usar `this.logger`
- NUNCA usar `as any` — tipar el shape mínimo necesario
