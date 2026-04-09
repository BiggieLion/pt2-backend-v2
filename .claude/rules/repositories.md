---
description: Rules for repositories and database access layer
paths:
  - "src/**/*.repository.ts"
  - "src/config/database/**"
---

# Repositorios y capa de datos

## Estructura de un repositorio de dominio

```typescript
@Injectable()
export class RequesterRepository extends AbstractRepository<Requester> {
  protected readonly logger = new Logger(RequesterRepository.name);

  constructor(
    @InjectRepository(Requester)
    requesterModel: Repository<Requester>,
    entityManager: EntityManager,
  ) {
    super(requesterModel, entityManager);
  }
}
```

`protected readonly logger` es abstracto en `AbstractRepository` — siempre debe definirse.

## Métodos disponibles en AbstractRepository

| Método | Firma | Cuándo usarlo |
|---|---|---|
| `create` | `(entity: T) => Promise<T>` | Insertar nueva entidad |
| `find` | `(where?, select?) => Promise<T[]>` | Listar con filtro opcional |
| `findOne` | `(where, relations?, select?, order?) => Promise<T>` | Buscar uno — lanza `NotFoundException` si no existe |
| `findOneAndUpdate` | `(where, partial) => Promise<T>` | Actualizar y retornar — lanza `NotFoundException` si no existe |
| `findOneAndSoftDelete` | `(where) => Promise<DeleteResult>` | Borrado suave — NUNCA hard delete |

## Reglas absolutas

- NUNCA hacer hard delete: `delete()`, `remove()`, `EntityManager.remove()` están prohibidos
- NUNCA inyectar `Repository<T>` o `EntityManager` directamente en un **service**
- Queries complejas y query builders van **dentro del repositorio**, no en el service
- No agregar lógica de negocio en el repositorio — solo acceso a datos
- No loggear objetos `where`, `select` ni `relations` completos — solo sus keys

## Cómo agregar queries personalizadas

```typescript
// Dentro del repositorio, extender con métodos adicionales
async findByEmail(email: string): Promise<Requester | null> {
  return this.itemsRepository.findOne({ where: { email } });
}
```

Usar `this.itemsRepository` (el `Repository<T>` inyectado) para queries adicionales dentro del repositorio.

## Registro en el módulo

Cada repositorio se registra como provider en su módulo de dominio:

```typescript
@Module({
  imports: [DatabaseModule.forFeature([Requester])],
  providers: [RequesterRepository, RequesterService],
})
export class RequesterModule {}
```

`DatabaseModule.forFeature([Entity])` registra el `Repository<Entity>` de TypeORM para que `@InjectRepository(Entity)` funcione dentro del módulo.

## AbstractEntity — qué provee

Todos los repositorios trabajan con entidades que extienden `AbstractEntity<T>`:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` (auto) | PK — nunca asignar manualmente |
| `createdAt` | `timestamptz` | Auto — TypeORM |
| `updatedAt` | `timestamptz` | Auto — TypeORM |
| `deletedAt` | `timestamptz \| null` | Soft delete — `null` = activo |
