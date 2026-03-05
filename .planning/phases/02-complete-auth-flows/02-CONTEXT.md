# Phase 2: Complete Auth Flows - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Every auth flow — Google OAuth, email/password login and registration, email verification, and password reset — works end-to-end with creator provisioning handled safely in the server-side callback. No new auth methods or capabilities; this phase completes what's already scaffolded.

</domain>

<decisions>
## Implementation Decisions

### Formularios y páginas
- Layout: Card centrada minimal — logo arriba, formulario debajo, fondo limpio
- Todas las páginas de auth (login, registro, forgot-password, reset-password) comparten el mismo layout base — solo cambian campos y textos
- Validación mixta: on blur para formato (email válido, password mínimo), on submit para errores del servidor (credenciales incorrectas)
- Botón de Google OAuth arriba, separador "o", luego campos de email/password debajo

### Feedback al usuario
- Éxitos: Toast con sonner que aparece después del redirect (ej: llegar al dashboard con toast "Sesión iniciada")
- Errores de validación: inline debajo del campo correspondiente
- Errores del servidor: alerta/banner rojo arriba del formulario
- Estado de carga: botón con spinner + texto cambia ("Iniciando sesión...", "Enviando..."), botón deshabilitado durante carga
- Idioma de mensajes: español

### Contenido de emails
- Usar templates de Supabase (Claude decide nivel de personalización de branding)
- Idioma de emails: español
- Remitente: default de Supabase (se puede cambiar después)
- URL de redirect en emails: desde variable de entorno (NEXT_PUBLIC_SITE_URL o similar) — funciona en dev y prod

### Flujo de redirecciones
- Post-login: si venía de ruta protegida, vuelve ahí; si fue directo a login, va al dashboard
- Acceso no autenticado a ruta protegida: redirect a /login?next=/ruta-original
- Post-registro (email/password): página dedicada de confirmación — "Revisa tu email para verificar tu cuenta" con opción de reenviar email
- Post-reset de contraseña: redirect a /login con toast de éxito "Contraseña actualizada, inicia sesión"

### Claude's Discretion
- Diseño exacto de la card de auth (spacing, typography, shadows)
- Nivel de personalización de templates de email en Supabase
- Skeleton/loading states durante OAuth redirect
- Manejo exacto del PKCE verifier en el flujo de callback

</decisions>

<specifics>
## Specific Ideas

- Todas las páginas de auth deben sentirse consistentes — misma card, mismo estilo
- Los toasts con sonner ya están instalados desde Phase 1
- El flujo de return URL (next param) ya tiene validación de allowlist de Phase 1 — reutilizar ese mecanismo
- Página de "revisa tu email" post-registro debe tener opción de reenviar verificación

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-complete-auth-flows*
*Context gathered: 2026-03-05*
