# Phase 4: Session Management - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Users receive clear feedback when sessions expire and auth errors are surfaced consistently across all three layers (browser client, middleware, tRPC) — no silent failures or confusing blank errors. Covers: silent token refresh, expiry redirect with messaging, and unified auth error codes.

</domain>

<decisions>
## Implementation Decisions

### Mensaje de expiración
- Componente de UI: Claude decide (toast vs banner) según patrón existente en el proyecto
- Idioma: español + inglés (i18n) — crear constantes con ambos idiomas
- Dismiss: el mensaje desaparece cuando el usuario hace foco en un campo del formulario de login
- URL limpia: después de leer `?reason=session_expired`, hacer `replaceState` para quitar el parámetro de la URL

### Refresh silencioso de token
- Estrategia: reactiva — el middleware detecta token expirado cuando llega una request y lo refresca en ese momento
- Visibilidad: completamente invisible para el usuario, sin spinners ni indicadores
- Mid-action: si una llamada tRPC falla por token expirado, el middleware refresca y el cliente reintenta automáticamente — el usuario no nota nada
- Reintentos: 1 solo intento de refresh. Si falla, la sesión está muerta → redirigir a login con `?reason=session_expired`

### Errores consistentes (enum de códigos)
- Estructura: un archivo `auth-errors.ts` con un enum de códigos (`SESSION_EXPIRED`, `INVALID_CREDENTIALS`, etc.) y un mapa código → mensaje (es/en)
- Alcance: solo errores de sesión/auth. Rate limit (fase 3) mantiene su propio manejo con HTTP 429
- Transporte: Claude decide el mecanismo más apropiado por capa (query param para redirects, TRPCError para tRPC, JSON body para API routes)
- Limpieza: Claude debe investigar si hay `message.includes()` string matching en el código actual y migrarlo al enum

### Redirección post-expiración
- Return URL: incluir `&next=/ruta-anterior` al redirigir a login, para que el usuario vuelva a donde estaba después de re-autenticarse
- Estado local: no limpiar — la navegación dura a /login ya resetea el estado de React
- Edge case login: si el usuario ya está en /login cuando la sesión expira, no pasa nada — la expiración solo se maneja al acceder a rutas protegidas
- Multi-tab: no manejar — cada pestaña gestiona su propia expiración independientemente

### Claude's Discretion
- Componente de UI para el mensaje de expiración (toast con sonner vs banner inline)
- Mecanismo exacto de transporte de errores entre capas
- Diseño del loading skeleton si aplica
- Si hay string matching existente, estrategia de migración

</decisions>

<specifics>
## Specific Ideas

- Ya tienen sonner instalado (de fase 1) — puede ser la opción natural para el mensaje de expiración
- El parámetro `?next=` ya existe en el flujo de login (fase 2) — reutilizar ese mecanismo
- i18n con constantes simples (objeto con es/en), no un framework de i18n completo

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-session-management*
*Context gathered: 2026-03-17*
