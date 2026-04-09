---
description: Rules for DTOs in this project
paths:
  - "src/**/*.dto.ts"
---

# DTOs

## Tres tipos por módulo de dominio

```
create-<dominio>.dto.ts   ← validación completa de entrada
update-<dominio>.dto.ts   ← PartialType(CreateDto) en la mayoría de casos
<dominio>-view.dto.ts     ← filtrado de campos al cliente con @Expose/@Exclude
```

## Transformadores de strings — aplicar siempre en la frontera

Importar de `@common/transformers/string.transformer`:

```typescript
@Transform(({ value }) => toUpperTrim(value))   // CURP, RFC
@Transform(({ value }) => toLowerTrim(value))   // email
@Transform(({ value }) => toTrim(value))         // nombres, direcciones
```

El orden de decoradores importa: `@Transform` debe ir ANTES de los validadores de `class-validator`.

## Campos que siempre usan su transformador

| Campo | Transformador |
|---|---|
| `curp` | `toUpperTrim` + `@Matches(CURP_REGEX)` |
| `rfc` | `toUpperTrim` + `@Matches(RFC_REGEX)` |
| `email` | `toLowerTrim` + `@IsEmail()` |
| `firstname`, `lastname` | `toTrim` |
| `address` | `toTrim` |

## Campos numéricos — siempre `@Type(() => Number)`

```typescript
@Type(() => Number)
@IsNumber({ maxDecimalPlaces: 2 })
@Min(0)
monthly_income: number;
```

## Campos booleanos desde query string / form data

```typescript
@Transform(({ value }) => value === true || value === 'true')
@IsBoolean()
has_own_car: boolean;
```

## Campos opcionales

```typescript
@IsBoolean()
@IsOptional()
has_active_request: boolean = false;  // con default cuando aplique
```

## Fechas

```typescript
@IsDate()
@Type(() => Date)
@IsNotEmpty()
birthdate: Date;
```

## UpdateDto

```typescript
// La mayoría de casos — hereda todos los campos como opcionales
export class UpdateRequesterDto extends PartialType(CreateRequesterDto) {}
```

Solo crear UpdateDto custom si los campos difieren significativamente del CreateDto.

## View DTOs — solo @Expose() en campos públicos

```typescript
@Exclude()  // en la clase, excluye todo por defecto
export class RequesterViewDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  // 'sub' NO lleva @Expose() — no debe llegar al cliente
}
```

Usar en el service con `excludeExtraneousValues: true`.

## Reglas absolutas

- NUNCA exponer `password` en ningún DTO de respuesta
- NUNCA exponer `sub` (Cognito sub) en View DTOs
- NUNCA exponer `deletedAt` en View DTOs
- El campo `name` en los campos del DTO usa `snake_case` (coincide con columnas DB)
- Los campos de la clase DTO llevan `snake_case`; los métodos de NestJS (si los hay) llevan `camelCase`
