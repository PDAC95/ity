# Phase 8: Creator Profile - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

El creador puede configurar su identidad pública — nombre visible, bio, foto de perfil, y datos de contacto — con los cambios persistidos en base de datos. Los cambios se reflejan en un preview en vivo.

</domain>

<decisions>
## Implementation Decisions

### Layout y estructura
- Dos columnas: formulario a la izquierda, preview en vivo a la derecha
- Avatar grande centrado arriba del formulario
- Secciones del form en cards separadas (info básica, contacto, redes sociales)
- Preview muestra card de perfil público + header de escuela, switcheable con toggle
- Preview actualiza en tiempo real (cada keystroke)
- Página propia en el sidebar del dashboard + link de acceso desde School Setup

### Campos y validación
- Display name: texto libre, máximo 50 caracteres
- Bio: textarea, máximo 500 caracteres
- Email de contacto: obligatorio, validación de formato email
- Redes sociales (6): Instagram, X, YouTube, TikTok, LinkedIn, Facebook
- Input de redes: solo username con prefijo visual (ej: instagram.com/ + input)

### Avatar / Foto de perfil
- Upload de imagen + crop circular antes de guardar
- Fallback sin foto: círculo con iniciales del display name sobre fondo de color
- Botón de eliminar foto (vuelve a iniciales)
- Límite de archivo: 5 MB máximo
- Spinner overlay sobre el avatar durante upload

### Feedback y estados
- Modal de confirmación al navegar con cambios sin guardar (botones: Guardar / Descartar / Cancelar)
- Spinner sobre avatar durante upload de foto

### Claude's Discretion
- Layout móvil responsive (form arriba + preview abajo, o preview en botón/sheet)
- Posición del botón de guardar (sticky o al final del form)
- Estilo y posición del toast de éxito
- Manejo de errores de servidor (toast + retry o solo toast con datos mantenidos)
- Colores de fondo para iniciales del avatar

</decisions>

<specifics>
## Specific Ideas

- El preview debe simular cómo verán los estudiantes el perfil del creador
- El toggle en el preview permite alternar entre vista "card de perfil público" y "header de la escuela"
- El input de redes sociales usa prefijo visual (instagram.com/) para guiar al usuario y evitar errores de formato

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-creator-profile*
*Context gathered: 2026-04-01*
