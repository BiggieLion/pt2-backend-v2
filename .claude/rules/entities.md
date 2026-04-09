---
description: Rules for TypeORM entities in this project
paths:
  - "src/**/entities/*.entity.ts"
  - "src/**/entity/*.entity.ts"
---

# Entidades TypeORM

## Toda entidad extiende AbstractEntity

```typescript
@Entity('requester')
export class Requester extends AbstractEntity<Requester> {
  // AbstractEntity provee: id (uuid), createdAt, updatedAt, deletedAt
}
```

## Columnas — siempre especificar `type` y `nullable` explícitamente

```typescript
// CORRECTO
@Column({ type: 'varchar', nullable: false })
firstname: string;

@Column({ type: 'int', nullable: true })
count_children: number;

// PROHIBIDO — sin type ni nullable
@Column()
firstname: string;
```

## Columnas monetarias — bigint + MoneyTransformer

```typescript
// Almacena centavos en DB, expone decimal en aplicación
@Column({ type: 'bigint', nullable: false, transformer: MoneyTransformer })
monthly_income: number;
```

## Nombres de columnas — snake_case

```typescript
@Column({ type: 'boolean', nullable: false })
has_own_car: boolean;

@Column({ type: 'varchar', nullable: true })
education_level: string;
```

## Relaciones

```typescript
// OneToMany (Requester → Request)
@OneToMany(() => Request, (request) => request.requester)
requests: Request[];

// ManyToOne (Request → Requester)
@ManyToOne(() => Requester, (requester) => requester.requests, { nullable: false })
requester: Requester;
```

## Enums como columna

```typescript
@Column({ type: 'enum', enum: RequestStatus, nullable: false, default: RequestStatus.PENDING })
status: RequestStatus;
```

## Lo que NUNCA debe estar en una entidad

- Lógica de negocio o métodos que no sean getters simples
- Llamadas a servicios o repositorios
- `@BeforeInsert` / `@BeforeUpdate` con lógica de negocio compleja
- Campos de contraseña en texto plano
