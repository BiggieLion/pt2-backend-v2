---
description: Rules for auth module — Cognito strategy, guards, JWT handling
paths:
  - "src/auth/**"
---

# Módulo Auth

## CognitoJwtStrategy — validate()

El método `validate(payload: JwtToken): UserDto` es el único punto donde se extrae la identidad del usuario del JWT:

```typescript
validate(payload: JwtToken): UserDto {
  // 1. Verificar token_use === 'access'
  if (payload.token_use !== 'access') {
    throw new UnauthorizedException('Invalid token use');
  }

  // 2. Extraer grupos de Cognito
  const tokenGroups: string[] = Array.isArray(payload['cognito:groups'])
    ? payload['cognito:groups']
    : [];

  // 3. Filtrar solo grupos permitidos (los 3 configurados)
  const roles: string[] = tokenGroups.filter((g) => this.allowedGroups.includes(g));

  if (roles.length === 0) {
    throw new UnauthorizedException('No valid role assigned');
  }

  return { id: payload.sub, name: payload.name ?? payload['cognito:username'] ?? 'No name', email: payload.email ?? 'No email', roles };
}
```

**NUNCA** loggear el payload completo — contiene claims sensibles.

## Guards — RolesGuard

`RolesGuard` es global (registrado en `AppModule`). Solo actúa si la ruta tiene `@Roles(...)`.
Si la ruta no tiene `@Roles`, el guard la deja pasar (no bloquea rutas públicas).

```typescript
// Sin @Roles → público (no pasa por RolesGuard)
@Post()
async create(@Body() dto: CreateRequesterDto) {}

// Con @Roles → requiere JWT válido + rol correcto
@UseGuards(AuthGuard('jwt'))
@Roles('analyst')
@Get('/:id')
async getById(...) {}
```

## AuthService — maskEmail obligatorio en logs

```typescript
// SIEMPRE enmascarar el email antes de loggear
private maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  return `${local.slice(0, 2)}***@${domain}`;
}

this.logger.log(`Logging in user: ${this.maskEmail(dto.email)}`);
```

## Tokens — lo que retorna AuthService.login()

```typescript
// Cuando Cognito devuelve un challenge (ej. NEW_PASSWORD_REQUIRED)
return { challengeName: response.ChallengeName };

// Flujo normal
return {
  accessToken: auth.AccessToken,
  idToken: auth.IdToken,
  refreshToken: auth.RefreshToken,
  expiresIn: auth.ExpiresIn,
  tokenType: auth.TokenType,
};
```

## Roles válidos (Role enum)

```typescript
export enum Role {
  REQUESTER = 'requester',
  ANALYST = 'analyst',
  SUPERVISOR = 'supervisor',
}
```

Usar siempre el enum, nunca strings literales en `@Roles()` salvo que sea necesario por compatibilidad.
