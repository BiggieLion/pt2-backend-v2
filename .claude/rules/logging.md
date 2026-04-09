---
description: Logging rules — applies to all TypeScript source files
paths:
  - "src/**/*.ts"
---

# Logging

## Usar siempre el Logger de NestJS — console.* está prohibido

```typescript
// PROHIBIDO en cualquier archivo de src/
console.log(...)
console.error(...)
console.warn(...)

// CORRECTO
private readonly logger = new Logger(FooService.name);
this.logger.log('...');
this.logger.warn('...');
this.logger.error('...', err?.stack);
this.logger.debug('...');
```

## Niveles y cuándo usarlos

| Método | Cuándo |
|---|---|
| `logger.log()` | Operaciones normales iniciadas (create, login, etc.) |
| `logger.warn()` | Situación recuperable: entidad no encontrada, usuario Cognito ya eliminado |
| `logger.error()` | Error inesperado — siempre pasar `(err as Error)?.stack` como segundo arg |
| `logger.debug()` | Información temporal de desarrollo — eliminar antes de merge a main |

## Qué NUNCA loggear

- Valores de `email`, `curp`, `rfc`, `password`, `monthly_income`, `amount` u otros campos PII/financieros
- Objetos `where`, `select`, `relations` completos (pueden contener valores PII)
- El payload completo del JWT
- Stacks de errores en producción (el `ResponseInterceptor` los oculta automáticamente)

## Qué SÍ loggear

```typescript
// Claves de objetos, nunca valores
this.logger.warn(`Entity not found. where keys: [${Object.keys(where).join(', ')}]`);

// Nombre de la excepción Cognito, nunca el objeto error completo
this.logger.error(`Cognito error: ${name ?? 'unknown'}`, (err as Error)?.stack);

// Emails enmascarados (ver AuthService.maskEmail)
this.logger.log(`Login attempt: ${this.maskEmail(dto.email)}`);
```

## En repositorios

`AbstractRepository` ya implementa el logging correcto en `findOne` y `findOneAndUpdate`.
Los repositorios de dominio solo necesitan definir `protected readonly logger`.
