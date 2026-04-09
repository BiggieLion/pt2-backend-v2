---
description: Rules for unit and e2e tests in this project
paths:
  - "src/**/*.spec.ts"
  - "test/**/*.e2e-spec.ts"
---

# Tests

## Estructura obligatoria — patrón AAA

```typescript
describe('RequesterService', () => {
  let service: RequesterService;
  let repo: { create: jest.Mock; findOne: jest.Mock; findOneAndSoftDelete: jest.Mock };
  let sendMock: jest.Mock;

  beforeEach(async () => {
    // ARRANGE — setup de mocks
    sendMock = jest.fn();
    repo = {
      create: jest.fn(),
      findOne: jest.fn(),
      findOneAndSoftDelete: jest.fn(),
    };

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
    // ARRANGE
    sendMock.mockResolvedValue({ UserSub: 'cognito-sub-123' });
    repo.create.mockResolvedValue({ id: 'uuid-1', email: 'test@test.com', sub: 'cognito-sub-123' });

    // ACT
    const result = await service.create(mockCreateRequesterDto);

    // ASSERT
    expect(sendMock).toHaveBeenCalledWith(expect.any(SignUpCommand));
    expect(result).toMatchObject({ id: 'uuid-1' });
  });
});
```

## Nomenclatura de tests

Patrón: **`deberia [accion] cuando [condicion]`**

```typescript
it('deberia lanzar BadRequestException cuando el email ya existe en Cognito')
it('deberia hacer rollback en Cognito cuando el guardado en DB falla')
it('deberia retornar RequesterViewDto sin el campo sub')
it('deberia lanzar NotFoundException cuando el id no existe')
```

## Qué se debe mockear SIEMPRE

- `RequesterRepository` / `RequestRepository` / `StaffRepository` — objeto plano con `jest.fn()`
- `CognitoIdentityProviderClient` — `{ send: jest.fn() }`
- `ConfigService` — `{ getOrThrow: jest.fn((k) => configMap[k]) }`

**NUNCA** mockear TypeORM internamente (`getRepositoryToken`, `Repository<T>`). Mockear el repositorio de dominio directamente.

## Cobertura obligatoria en services

- [ ] Happy path — retorno correcto y verificación de calls
- [ ] Cada excepción Cognito mapeada a su HTTP exception
- [ ] Lógica de rollback (Cognito borrado si falla DB)
- [ ] Campos sensibles excluidos del retorno (`password`, `sub`)

## Datos de prueba — objetos literales inline o constante `mock*`

```typescript
// Para DTOs complejos, extraer a constante en el mismo archivo spec
const mockCreateRequesterDto: CreateRequesterDto = {
  email: 'test@example.com',
  curp: 'LOOA531113HTCPBN07',
  rfc: 'LOOA531113AB1',
  firstname: 'John',
  lastname: 'Doe',
  monthly_income: 15000,
  // ...
};
```

## Tests de controllers

Mockear el service completo:

```typescript
const mockRequesterSvc = {
  create: jest.fn(),
  getRequester: jest.fn(),
  updateRequester: jest.fn(),
  deleteRequester: jest.fn(),
};

{ provide: RequesterService, useValue: mockRequesterSvc }
```

Verificar que el controller retorna `{ data, message }` y que delega al service correctamente.

## E2E tests (`test/`)

- Usar `supertest` para ciclos HTTP completos
- Verificar el shape del envelope `ResponseInterceptor`:
  ```json
  { "statusCode": 200, "success": true, "data": {}, "message": "..." }
  ```
- Verificar que rutas protegidas retornan 401 sin token
- Verificar que rutas con `@Roles` retornan 403 con rol incorrecto
