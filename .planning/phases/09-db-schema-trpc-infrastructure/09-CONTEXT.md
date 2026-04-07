# Phase 9: DB Schema + tRPC Infrastructure - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Crear las tablas de base de datos (`landing_page_requests`, `notifications`) y los routers tRPC (`landing`, `notifications`) que soportan todo el flujo de landing pages y notificaciones de las fases 10-13. Incluye configuracion de environment variables para Anthropic y Resend.

</domain>

<decisions>
## Implementation Decisions

### Esquema landing_page_requests
- 4 estados: `draft` -> `pending` -> `in_progress` -> `completed`
  - `draft`: chat en curso, el creador puede retomar donde lo dejo
  - `pending`: PRD enviado, esperando que el equipo 12ity lo procese
  - `in_progress`: equipo trabajando en la landing
  - `completed`: landing lista
- Un solo request activo por escuela (cardinalidad 1:1 school -> active request)
- `templateId` como columna independiente (no dentro de JSONB)
- Dos columnas JSONB separadas: `prd_data` para el PRD final y `chat_history` para la transcripcion del chat
  - El admin puede leer el PRD y consultar la transcripcion si tiene dudas
- Solo `templateId` en columna; la URL se resuelve desde el registry en codigo
- El chat parcial se guarda en DB como draft para que el creador pueda retomar

### Esquema notifications
- Tipos v1.2: solo landing events (`landing_submitted`, `landing_completed`)
- Campos: creatorId, type, title, body, isRead, actionUrl (opcional), metadata (JSONB)
- `actionUrl` permite navegar al creador directamente al recurso relevante (ej: /dashboard/landing)
- `metadata` JSONB para datos extra segun tipo (ej: { requestId: '...' })
- Retencion indefinida en v1.2 (bajo volumen, no se borran)
- Index en `creator_id` para queries eficientes
- RLS o query-level filtering para scoping por creador

### Routers tRPC - landing
- `getStatus`: devuelve status, templateId, createdAt, updatedAt. **Nunca** devuelve prdData ni chatHistory
- `saveDraft`: upsert automatico que crea o actualiza el request en estado 'draft' con chatHistory parcial
- `requestPage`: transiciona de draft a pending cuando el creador confirma el PRD

### Routers tRPC - notifications
- `list`: devuelve las ultimas 50 notificaciones, sin paginacion. Suficiente para v1.2
- `unreadCount`: query separado e independiente de `list`. El bell icon lo llama con refetchInterval sin cargar la lista
- `markRead`: marca una notificacion como leida
- `markAllRead`: marca todas como leidas

### Variables de entorno
- `ANTHROPIC_API_KEY` y `RESEND_API_KEY` se validan solo cuando se usan, no al arrancar la app
- Agregar placeholders al `.env.example`
- El usuario necesita crear cuentas en Anthropic y Resend (no las tiene aun)
- Resend: usar dominio de prueba/sandbox para v1.2 (solo envia a email propio, suficiente para dev/testing)

### Claude's Discretion
- Estructura exacta del schema Drizzle (tipos, defaults, constraints)
- Estrategia de indices adicionales
- Nombres exactos de procedimientos tRPC y validaciones Zod
- Manejo de errores en routers
- Estructura del JSONB de metadata en notifications

</decisions>

<specifics>
## Specific Ideas

- El admin debe poder leer el PRD Y la transcripcion del chat por separado para resolver dudas sobre el request
- El creador que abandona el chat debe poder retomar exactamente donde lo dejo (estado draft con chatHistory)
- El bell icon de notificaciones debe poder consultar unreadCount de forma ligera sin cargar toda la lista

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 09-db-schema-trpc-infrastructure*
*Context gathered: 2026-04-07*
