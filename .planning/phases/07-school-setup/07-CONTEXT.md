# Phase 7: School Setup - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

El creador puede configurar completamente su escuela — nombre, descripción, slug único, y colores de marca — con todos los cambios persistidos en base de datos. No incluye logo/favicon upload (completado en Phase 6), ni página pública de la escuela.

</domain>

<decisions>
## Implementation Decisions

### Diseño del formulario
- Layout con tabs separados: tab "General" (nombre, descripción, slug) y tab "Marca" (colores)
- Link "Mi Escuela" o equivalente en el sidebar del dashboard (sección propia, no dentro de Settings)
- Nombre de escuela: textarea simple con límite de 60 caracteres y contador visible
- Descripción: textarea simple con límite de caracteres (no rich text)
- Slug se auto-genera a partir del nombre y es editable manualmente después
- Cada tab tiene su propio botón Guardar independiente

### Validación del slug
- Indicador de disponibilidad inline: icono + texto debajo del campo (✅ "Disponible" verde / ❌ "Ya está en uso" rojo)
- Caracteres válidos: solo a-z, 0-9 y guiones (-). Sin mayúsculas, sin guiones bajos
- Longitud: mínimo 3, máximo 40 caracteres
- Preview inline de la URL completa debajo del campo, actualizándose en tiempo real
- Slug siempre editable (sin restricción de cambio después de guardar por primera vez)
- Validación de disponibilidad con debounce mientras el creador escribe

### Selector de colores
- Paleta predefinida (~12 colores curados) como atajo rápido + picker libre con input hex
- Dos colores: primario y acento
- Mini preview en vivo mostrando cómo se verían los colores aplicados (botón, encabezado, o card de ejemplo)
- Colores con valores por defecto de 12ity al crear la escuela — siempre hay algo bonito de base
- Warning suave de contraste si la combinación es difícil de leer, pero permite guardar

### Feedback y estados
- Botón Guardar siempre visible, disabled/gris cuando no hay cambios pendientes
- Spinner en el botón mientras se procesa el guardado
- Toast de éxito en esquina (~3s auto-dismiss) al guardar correctamente
- Toast de error rojo al fallar ("Error al guardar. Inténtalo de nuevo.") — datos se mantienen en el formulario
- Dialog de confirmación al intentar navegar fuera con cambios sin guardar ("Tienes cambios sin guardar. ¿Descartar o quedarte?")
- Warning también aplica al cambiar entre tabs (General → Marca) si hay cambios sin guardar
- Primera visita: formulario con defaults, sin estado especial de bienvenida (el onboarding checklist ya guía)

### Claude's Discretion
- Formato de URL en el preview del slug (subdominio vs path — según arquitectura actual)
- Diseño exacto del loading skeleton
- Espaciado y tipografía exactos
- Colores específicos de la paleta predefinida
- Límite de caracteres de la descripción (razonable, ~300-500)

</decisions>

<specifics>
## Specific Ideas

- Cada tab guarda independientemente — el creador sabe exactamente qué está guardando
- El slug auto-generado desde el nombre reduce fricción (ej. "Mi Escuela" → "mi-escuela")
- La paleta de colores predefinida sirve como guía para creadores sin experiencia en diseño
- El mini preview de colores da feedback inmediato sin necesidad de ir a otra página

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-school-setup*
*Context gathered: 2026-04-01*
