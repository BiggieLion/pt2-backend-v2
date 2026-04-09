---
description: Rules for NestJS controllers in this project
paths:
  - "src/**/*.controller.ts"
---

# Controllers

## Estructura obligatoria

Siempre declarar versión y path en el decorador:

```typescript
@Controller({ path: 'requester', version: '1' })
export class RequesterController {
  constructor(private readonly requesterSvc: RequesterService) {}
}
```

## Retorno — siempre `{ data, message }`

`ResponseInterceptor` espera este shape. Sin él el envelope falla.

```typescript
// CORRECTO
return { data, message: 'Requester fetched successfully' };
return { data: {}, message: 'Requester deleted successfully' };

// PROHIBIDO — entidad cruda o sin message
return requester;
return { data };
```

## Guards y Roles — por ruta, nunca a nivel de clase (salvo que todas las rutas compartan el mismo guard)

```typescript
// CORRECTO
@UseGuards(AuthGuard('jwt'))
@Roles('analyst', 'supervisor')
@Get('/:id')
async getById(...) {}

// PROHIBIDO — a nivel clase cuando hay rutas públicas mezcladas
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'requester', version: '1' })
export class RequesterController {}
```

## UUIDs en path params

```typescript
// SIEMPRE así
@Param('id', new ParseUUIDPipe({ version: '4' })) id: string
```

## Rate limiting por ruta específica

```typescript
// Para rutas de creación sensibles (como registro)
@Throttle({ 'requester-create': {} })
@Post()
async create(...) {}
```

## Extracción del usuario autenticado

```typescript
// Usar @CurrentUser() de @common/decorators, nunca req.user manual
@Get()
async getCurrent(@CurrentUser() user: UserDto) {}
```

## Lo que NUNCA debe estar en un controller

- Consultas a base de datos directas
- Llamadas al AWS SDK / Cognito directas
- Lógica `if/else` de negocio
- Acceso a `process.env`
- `console.log`
- `try/catch` (salvo wrapper mínimo para re-lanzar; toda la lógica de error va en el service)
