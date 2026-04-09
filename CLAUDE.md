# CLAUDE.md

Guidance for Claude Code when working in this repository. These rules take precedence over any default behavior.

---

## Descripcion del Proyecto

API REST construida con **NestJS 11** para un **sistema de gestión de créditos/préstamos** respaldada por PostgreSQL vía TypeORM. La autenticación está completamente delegada a **AWS Cognito** — no existe tabla de usuarios local; identidad y roles provienen de tokens JWT emitidos por Cognito. Tres roles: `requester` (solicitante de crédito), `analyst` y `supervisor`.

---

## Arquitectura

### Capas

```
HTTP Request
    ↓
Guards (AuthGuard JWT → RolesGuard)         ← autenticación y autorización
    ↓
Controller                                   ← recibe y valida entrada, delega
    ↓
Service                                      ← toda la lógica de negocio
    ↓
Repository (AbstractRepository<T>)           ← único punto de acceso a TypeORM
    ↓
PostgreSQL (TypeORM entities)
         ↕
AWS Cognito (SDK directo desde Service)      ← gestión de identidad
```

### Módulos y cómo interactúan

```
AppModule (raíz)
├── ConfigurationModule [global]   ← variables de entorno validadas con Joi
├── DatabaseModule                 ← conexión TypeORM, AbstractEntity, AbstractRepository
├── LoggerModule                   ← Pino con redacción de PII
├── ThrottlerModule [global]       ← rate limiting aplicado a todas las rutas
│
├── AuthModule
│   ├── importa: PassportModule, CognitoModule, ConfigurationModule
│   ├── provee:  CognitoJwtStrategy, RolesGuard
│   └── exporta: PassportModule, RolesGuard
│
├── RequesterModule
│   ├── importa: DatabaseModule.forFeature([Requester]), CognitoModule, LoggerModule
│   ├── provee:  RequesterRepository, RequesterService
│   └── exporta: RequesterRepository   ← consumido por RequestModule
│
├── RequestModule
│   ├── importa: DatabaseModule.forFeature([Request]), RequesterModule  ← intencional
│   └── provee:  RequestRepository, RequestService
│
└── StaffModule                    ← en construcción, sin dependencias externas aún
    └── provee:  StaffRepository, StaffService
```

### Infraestructura (`src/config/`)

| Módulo | Responsabilidad |
|--------|----------------|
| `ConfigurationModule` | Lee `.env.*`, valida con Joi, expone config anidada vía `ConfigService` |
| `DatabaseModule` | `TypeOrmModule.forRootAsync()`, `AbstractEntity`, `AbstractRepository` |
| `LoggerModule` | `nestjs-pino` + redacción de campos PII (`password`, `curp`, `rfc`, etc.) |
| `CognitoModule` | Provee `CognitoIdentityProviderClient` (AWS SDK v3) como provider inyectable |

### Respuesta estándar (ResponseInterceptor)

Todo response pasa por `ResponseInterceptor` que construye el envelope:

```json
{
  "statusCode": 200,
  "success": true,
  "timestamp": "2026-...",
  "path": "/api/v1/requester",
  "action": "CONTINUE",
  "message": "...",
  "version": "2.0.0",
  "data": {}
}
```

Los controllers solo retornan `{ data, message }`.

---

## Convenciones de Codigo

### Naming

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Archivos | `kebab-case.<tipo>.ts` | `create-requester.dto.ts` |
| Clases | `PascalCase` | `RequesterService` |
| Métodos / variables | `camelCase` | `getRequester`, `userPoolId` |
| Campos DTO / entidad | `snake_case` | `monthly_income`, `has_own_car` |
| Enums y constantes | `SCREAMING_SNAKE_CASE` | `RequestStatus.PENDING`, `CURP_REGEX` |
| Servicios inyectados | sufijo `Svc` | `private readonly requesterSvc` |
| Repositorios inyectados | sufijo `Repo` | `private readonly requesterRepo` |

### Estructura de archivos

Cada módulo de dominio sigue exactamente esta estructura:

```
src/<dominio>/
├── <dominio>.module.ts
├── <dominio>.service.ts
├── <dominio>.controller.ts
├── <dominio>.repository.ts
├── entities/                  ← PLURAL siempre
│   └── <dominio>.entity.ts
└── dto/
    ├── create-<dominio>.dto.ts
    ├── update-<dominio>.dto.ts
    ├── <dominio>-view.dto.ts   ← cuando se necesita filtrar campos al cliente
    └── index.ts
```

Guards dentro de un módulo van en carpeta **`guards/`** (plural). Ejemplo: `auth/guards/roles.guard.ts`.

### Path aliases — usar siempre, nunca `../../`

```
@common/*    → src/common/*
@config/*    → src/config/*
@shared/*    → src/shared/*
@requester/* → src/requester/*
@auth/*      → src/auth/*
@request/*   → src/request/*
@staff/*     → src/staff/*
```

### Patrones obligatorios

**Controllers — delgados, sin lógica**

```typescript
@Controller({ path: 'requester', version: '1' })
export class RequesterController {
  @UseGuards(AuthGuard('jwt'))
  @Roles(Role.ANALYST)
  @Get('/:id')
  async getById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const data = await this.requesterSvc.getRequester(id);
    return { data, message: 'Requester fetched successfully' };
  }
}
```

- Siempre `@Controller({ path, version })` — nunca sin versión.
- `ParseUUIDPipe({ version: '4' })` en todos los params UUID.
- Retornar `{ data, message }` — jamás la entidad cruda.
- Aplicar `@UseGuards` y `@Roles` por ruta, no a nivel de clase (salvo que todas las rutas compartan el mismo guard).

**Services — toda la lógica de negocio aquí**

```typescript
@Injectable()
export class RequesterService {
  private readonly logger = new Logger(RequesterService.name);

  constructor(
    private readonly requesterRepo: RequesterRepository,
    private readonly cognitoClient: CognitoIdentityProviderClient,
    private readonly configSvc: ConfigService,
  ) {
    this.userPoolId = this.configSvc.getOrThrow<string>('cognito.userPoolId');
  }
}
```

- `private readonly logger = new Logger(FooService.name)` — obligatorio en todo service.
- Leer config **solo** con `configSvc.getOrThrow<string>(...)` en el constructor.
- Usar `getCognitoErrorName(err)` de `@common/utils/error.util` para errores AWS.
- Re-lanzar como excepciones tipadas de NestJS, nunca exponer detalles internos al cliente.

**DTOs — validación y transformación en la frontera**

```typescript
export class CreateRequesterDto {
  @IsString()
  @Transform(({ value }) => toUpperTrim(value))
  @Matches(CURP_REGEX)
  curp: string;

  @IsEmail()
  @Transform(({ value }) => toLowerTrim(value))
  email: string;
}
```

- Normalizar en la frontera con helpers de `@common/transformers/string.transformer`:
  - `toUpperTrim` → CURP, RFC
  - `toLowerTrim` → email
  - `toTrim` → nombres, direcciones
- `UpdateDto` extiende `PartialType(CreateDto)` salvo que los campos difieran significativamente.
- View DTOs usan `@Expose()` / `@Exclude()` para controlar qué llega al cliente.

**Entidades — siempre extender AbstractEntity**

```typescript
@Entity('requester')
export class Requester extends AbstractEntity<Requester> {
  @Column({ type: 'varchar', nullable: false })
  firstname: string;

  @Column({ type: 'bigint', nullable: true, transformer: MoneyTransformer })
  monthly_income: number;
}
```

- Especificar `type` y `nullable` explícitamente en cada `@Column`.
- Columnas monetarias: `type: 'bigint'` + `transformer: MoneyTransformer` (almacena centavos, expone decimales).
- Borrado suave con `findOneAndSoftDelete` — jamás `delete()` o `remove()`.

**Repositorios — el único acceso a TypeORM**

```typescript
@Injectable()
export class RequesterRepository extends AbstractRepository<Requester> {
  protected readonly logger = new Logger(RequesterRepository.name);

  constructor(
    @InjectRepository(Requester) requesterModel: Repository<Requester>,
  ) {
    super(requesterModel);
  }
}
```

- Query builders y consultas complejas van **dentro del repositorio**, nunca en el service.

### Patrones PROHIBIDOS

#### 1. `console.log` — usar Logger de NestJS

```typescript
// PROHIBIDO
console.log('Creating requester', dto);

// CORRECTO
this.logger.log('Creating new requester');
this.logger.error('Cognito error', err?.stack);
```

#### 2. `process.env` fuera de `configuration.ts`

```typescript
// PROHIBIDO — en cualquier service, guard, etc.
const poolId = process.env.COGNITO_USER_POOL_ID;

// CORRECTO
this.userPoolId = this.configSvc.getOrThrow<string>('cognito.userPoolId');
```

El único lugar donde se lee `process.env` directamente es `configuration.ts` y `configuration.module.ts`.

#### 3. `configSvc.get()` — usar siempre `getOrThrow()`

```typescript
// PROHIBIDO
const ssl = this.configSvc.get<boolean>('database.ssl') ?? true;

// CORRECTO
const ssl = this.configSvc.getOrThrow<boolean>('database.ssl');
```

Los valores opcionales con fallback deben tener default en `configuration.ts`.

#### 4. `Repository<T>` o `EntityManager` en un Service

```typescript
// PROHIBIDO
constructor(
  @InjectRepository(Requester)
  private readonly typeormRepo: Repository<Requester>,
) {}

// CORRECTO
constructor(private readonly requesterRepo: RequesterRepository) {}
```

#### 5. Hard delete de registros de dominio

```typescript
// PROHIBIDO
await this.itemsRepository.delete({ id });
await this.entityManager.remove(entity);

// CORRECTO
await this.requesterRepo.findOneAndSoftDelete({ id });
```

#### 6. Retornar entidades crudas desde controllers

```typescript
// PROHIBIDO
return await this.requesterSvc.getRequester(id);

// CORRECTO
const data: RequesterViewDto = await this.requesterSvc.getRequester(id);
return { data, message: 'Requester fetched successfully' };
```

#### 7. `as any` en código de producción

```typescript
// PROHIBIDO
const payload = jwt.verify(token) as any;

// CORRECTO — tipar el shape mínimo necesario
const resp = err.getResponse();
const maybeMsg = (resp as { message?: unknown }).message;
```

La única excepción aceptada: tests, para acceder a propiedades privadas (`as unknown as { repo: any }`).

#### 8. Loggear objetos con PII o secretos

```typescript
// PROHIBIDO
this.logger.log('Entity', { where, select }); // puede contener email, CURP, RFC...

// CORRECTO — solo keys/shape, nunca valores
this.logger.warn(`Entity not found. where keys: [${Object.keys(where).join(', ')}]`);
```

#### 9. Queries en controllers

Los controllers no consultan la base de datos directamente. Toda consulta ocurre en el service vía el repositorio.

#### 10. `synchronize: true` en producción

El config de TypeORM ya lo controla condicionalmente. No modificar:

```typescript
synchronize: configSvc.getOrThrow<string>('node_env') !== 'production',
```

---

## Estandares de Testing

### Tests unitarios

- **Co-ubicados** con el archivo fuente: `foo.service.spec.ts` junto a `foo.service.ts`.
- **Toda dependencia externa es mockeada** — Cognito, TypeORM, ConfigService. Nunca hit real a AWS ni BD.
- Mockear `<Domain>Repository` con un objeto plano de `jest.fn()`, no internals de TypeORM.
- Patrón **AAA** (Arrange / Act / Assert) en cada `it()`.

```typescript
describe('RequesterService', () => {
  let service: RequesterService;
  let repo: { create: jest.Mock; findOne: jest.Mock; findOneAndSoftDelete: jest.Mock };
  let sendMock: jest.Mock;

  beforeEach(async () => {
    sendMock = jest.fn();
    repo = { create: jest.fn(), findOne: jest.fn(), findOneAndSoftDelete: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequesterService,
        { provide: RequesterRepository, useValue: repo },
        { provide: CognitoIdentityProviderClient, useValue: { send: sendMock } },
        { provide: ConfigService, useValue: { getOrThrow: jest.fn((k) => configMap[k]) } },
      ],
    }).compile();

    service = module.get<RequesterService>(RequesterService);
  });

  it('deberia crear un requester cuando los datos son validos', async () => {
    // Arrange
    sendMock.mockResolvedValue({ UserSub: 'cognito-sub-123' });
    repo.create.mockResolvedValue({ id: 'uuid-1', email: 'test@test.com' });

    // Act
    const result = await service.create(mockCreateDto);

    // Assert
    expect(sendMock).toHaveBeenCalledWith(expect.any(SignUpCommand));
    expect(result).toMatchObject({ id: 'uuid-1' });
  });
});
```

### Qué debe tener cobertura obligatoria en services

- Happy path con retorno correcto.
- Cada rama de error (cada excepción Cognito mapeada a su HTTP exception).
- Lógica de rollback (ej. borrar usuario Cognito si falla el guardado en BD).
- Mapeo DTO → entidad y campos omitidos en view DTOs.

### Tests de integración / E2E

- Viven en `test/` como `*.e2e-spec.ts`.
- Usan `supertest` para ciclos request/response completos.
- Las dependencias externas (Cognito, BD) se mockean o se usa una BD de test en memoria.
- Cubrir: autenticación, autorización por rol, validación de inputs y formato del envelope de respuesta.

### Nomenclatura de tests

Patrón: **`deberia [accion] cuando [condicion]`**

```typescript
it('deberia lanzar BadRequestException cuando el CURP ya existe en Cognito')
it('deberia retornar 403 cuando el rol no tiene permisos')
it('deberia hacer soft delete y no exponer el registro en listados')
```

### Datos de prueba

- Usar objetos literales inline para casos simples.
- Extraer a una constante `mock<Entity>` en el mismo archivo spec para casos reutilizados.
- No usar factories de terceros — la simplicidad de Jest es suficiente para este proyecto.

```typescript
const mockCreateRequesterDto: CreateRequesterDto = {
  email: 'test@example.com',
  curp: 'LOOA531113HTCPBN07',
  // ...
};
```

---

## Reglas de Arquitectura

### Dependencias permitidas entre capas

```
Controller  →  Service  →  Repository  →  TypeORM (AbstractRepository)
Controller  →  Service  →  CognitoClient (AWS SDK)
Service     →  ConfigService
Service     →  Logger
```

### Lo que NO debe depender de qué

| Capa | NO puede importar |
|------|------------------|
| Controller | Repository directamente |
| Controller | CognitoClient directamente |
| Controller | `process.env` |
| Service | `Repository<T>` de TypeORM directamente |
| Service | `EntityManager` directamente |
| Repository | Otro Repository de dominio distinto |
| Cualquier archivo | `console.*` |
| Cualquier archivo fuera de `configuration.ts` | `process.env` |

### Dependencias cruzadas entre módulos de dominio

- `RequestModule` importa `RequesterModule` — **intencional**: la creación de una solicitud necesita verificar la existencia del solicitante.
- Ningún otro módulo de dominio puede importar otro módulo de dominio sin justificación explícita en comentario de código.
- `StaffModule` es independiente por ahora (sin relaciones con `requester` ni `request`).

### Dónde va la lógica de negocio vs. controllers

| Responsabilidad | Dónde |
|----------------|-------|
| Validación de entrada (formato, tipos) | DTO con `class-validator` |
| Orquestación, reglas de negocio, flujos condicionales | Service |
| Acceso a BD (queries, inserts, updates, soft deletes) | Repository |
| Integración con Cognito | Service (usando `CognitoIdentityProviderClient`) |
| Serialización / filtrado de campos al cliente | View DTO con `@Expose()/@Exclude()` |
| Formato de respuesta HTTP | ResponseInterceptor (automático) |
| Routing, extracción de params/body, aplicación de guards | Controller |

Los controllers **nunca** contienen `if/else` de lógica de negocio, ni consultas, ni llamadas a AWS SDK.

---

## Commits

Seguir **Conventional Commits** (`tipo(scope): descripcion` en modo imperativo):

```
feat(requester): add phone number field to create DTO
fix(auth): handle expired Cognito token gracefully
refactor(request): extract status transition logic to service
test(staff): add unit tests for StaffService.create
chore: update @nestjs/core to 11.x
```

**Tipos permitidos:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

Breaking changes: añadir `!` tras el tipo o `BREAKING CHANGE:` en el footer.

Reglas de formato:
- Descripción en imperativo (`add`, no `added` ni `adds`).
- Máximo 72 caracteres en la primera línea.
- Usar el body para explicar **qué** y **por qué**, no el **cómo**.
- Referenciar issues en el footer: `Closes #123`.

---

## Comandos

```bash
# Desarrollo
npm run start:dev          # Servidor con file watch
docker compose up          # Stack completo (API + PostgreSQL)

# Build y produccion
npm run build
npm run start:prod

# Testing
npm run test               # Tests unitarios (Jest)
npm run test:watch         # Tests unitarios en modo watch
npm run test:cov           # Reporte de cobertura
npm run test:e2e           # Tests end-to-end
npx jest src/path/to/file.spec.ts  # Archivo individual

# Calidad de codigo
npm run lint               # ESLint con auto-fix
npm run format             # Prettier
```

---

## Estructura del repositorio

```
src/
├── main.ts                        # Bootstrap: Helmet, CORS, ValidationPipe, interceptors, versionado
├── app.module.ts                  # Módulo raíz: guards globales (ThrottlerGuard, RolesGuard)
├── app.controller.ts / service.ts # Endpoint de health-check
│
├── config/                        # Infraestructura — no lógica de dominio
│   ├── configuration/             # Vars de entorno validadas con Joi (ConfigurationModule, global)
│   ├── database/                  # TypeORM async config, AbstractEntity, AbstractRepository
│   ├── cognito/                   # AWS Cognito client (CognitoModule)
│   └── logger/                    # Pino logger con redacción de PII (LoggerModule)
│
├── auth/                          # JWT/Passport strategy + guards
│   ├── strategies/cognito.strategy.ts  # Valida JWT Cognito, puebla req.user
│   ├── guards/roles.guard.ts           # Lee metadata @Roles(), verifica req.user.roles
│   ├── guard/cognito.guard.ts          # Wrapper legacy — unificar a guards/ pendiente
│   ├── constants/role.enum.ts          # Role string constants
│   └── dto/                            # Auth DTOs (login, tokens, forgot password...)
│
├── requester/                     # Dominio: solicitantes de crédito
├── request/                       # Dominio: solicitudes de crédito
├── staff/                         # Dominio: staff (analistas, supervisores) — en construcción
│
├── common/                        # Concerns transversales
│   ├── decorators/                # @CurrentUser(), @Roles()
│   ├── dto/                       # UserDto, CustomResponseDto
│   ├── enums/                     # ResponseActionEnum
│   ├── interceptors/              # ResponseInterceptor
│   ├── interfaces/                # JwtToken, Response interfaces
│   ├── transformers/              # MoneyTransformer, StringTransformer
│   └── utils/                     # error.util (getCognitoErrorName)
│
└── shared/                        # Constantes puras (sin DI)
    └── constants/regex.ts         # CURP_REGEX, RFC_REGEX, PASSWORD_REGEX
```

**Archivos de entorno:** `.env.development` (local), `.env.production` (prod). Ver `.env.example` para todas las variables requeridas. Validadas en arranque por Joi en `ConfigurationModule`.

**TypeORM sync:** `synchronize: true` en desarrollo, `false` en producción.

---

## API

- Prefijo global: `/api`
- Versionado URI: `/api/v1/...`
- Swagger UI: `/api/docs`
- Todos los endpoints requieren `Authorization: Bearer <jwt>` salvo indicación contraria.
