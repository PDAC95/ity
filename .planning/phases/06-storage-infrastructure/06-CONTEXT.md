# Phase 6: Storage Infrastructure - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Los uploads de archivos (logo de escuela y avatar del creador) tienen la infraestructura completa — buckets, RLS policies, Server Actions, y widgets reutilizables — lista para ser consumida por fases posteriores. No incluye los formularios de School Setup ni Creator Profile (fases 7 y 8).

</domain>

<decisions>
## Implementation Decisions

### Widget de upload
- Interacción: botón + área de drag & drop (click para abrir selector, o arrastrar archivo)
- Forma del preview: circular para avatar, cuadrado con bordes redondeados para logo
- Tamaño visual del widget: ~120px (mediano)
- Indicador de carga: barra de progreso circular (anillo sobre la imagen/área de drop)

### Validación y límites
- Tipos aceptados: JPG, PNG, WebP (no SVG, no GIF)
- Tamaño máximo: 5 MB
- Dimensiones mínimas: 200x200px
- Errores de validación: inline debajo del widget (texto rojo), no toasts

### Estructura de buckets
- Un solo bucket ("uploads") con paths por entidad: `/schools/{school_id}/logo` y `/profiles/{user_id}/avatar`
- Naming de archivos: path fijo por entidad (cada upload sobreescribe el anterior en el mismo path)
- Acceso: público (URLs directas sin signed URLs) — logos y avatars son contenido público
- Momento del upload: inmediato al seleccionar archivo (el formulario solo guarda la URL resultante)

### Experiencia post-upload
- Sin crop ni resize — subir imagen tal cual, CSS maneja el display
- Reemplazo: sobreescribir el path fijo (sin archivos huérfanos, sin cleanup)
- Confirmación: el preview inmediato de la nueva imagen ES la confirmación (sin toasts ni mensajes extra)
- Botón de eliminar: ícono pequeño (X o trash) sobre el preview para volver al placeholder/default

### Claude's Discretion
- Diseño exacto del skeleton/loading state
- Implementación específica de RLS policies
- Estructura interna del Server Action para signed upload URLs
- Placeholder/default cuando no hay imagen (iniciales, ícono genérico, etc.)
- Animaciones de transición entre estados

</decisions>

<specifics>
## Specific Ideas

- El widget es un componente reutilizable que recibe como prop la forma (circle/square) y el path de destino
- Upload inmediato significa: usuario selecciona → valida client-side → sube a Supabase → muestra preview → el form padre recibe la URL pública
- Path fijo simplifica todo: no hay que trackear UUIDs de archivos, siempre es `/schools/{id}/logo`

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-storage-infrastructure*
*Context gathered: 2026-04-01*
