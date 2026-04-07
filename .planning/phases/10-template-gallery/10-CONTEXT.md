# Phase 10: Template Gallery - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Creator can browse, filter, and preview templates with mobile/desktop toggle. Static template registry with 3-5 initial templates. Template selection navigates to chat with templateId. Sidebar "Mi Pagina Web" link active. Security: iframe sandbox + CSP frame-src allowlist.

</domain>

<decisions>
## Implementation Decisions

### Gallery layout
- Grid responsive: 2 columnas en mobile, 3 en desktop
- Página con título + subtítulo (ej: "Elige tu template" + "Personaliza tu página con IA después")
- Título y subtítulo arriba de los chips de filtro

### Template cards
- Thumbnail estático (screenshot PNG/WebP), no mini-iframe
- Información en card: thumbnail + nombre + badge de categoría
- Hover: elevación sutil (sombra que crece + ligero scale up ~1.02)
- Click en card abre modal de preview

### Category filtering
- Categorías por nicho: Educación, Fitness, Negocio (+ "Todos" como default)
- Selección única — un chip activo a la vez, "Todos" es default
- Chips sticky debajo del header al hacer scroll
- Sin contadores en los chips (solo nombre de categoría)
- Animación fade/layout al filtrar (templates hacen fade out/in, reorganización suave)

### Preview modal
- Modal fullscreen con overlay oscuro
- Header del modal: nombre del template + categoría a la izquierda, toggle mobile/desktop al centro, X para cerrar a la derecha
- Toggle con iconos phone/laptop, transición suave al redimensionar iframe
- Default: vista desktop al abrir
- Iframe scrolleable — el creador puede hacer scroll para ver toda la landing
- Navegación entre templates con flechas prev/next sin cerrar el modal
- Cerrar modal: Escape + click fuera del overlay + botón X
- Botón "Elegir este template": primario, sticky fijo al fondo del modal, siempre visible

### Loading states
- Galería: skeleton cards pulsantes en el mismo grid layout
- Iframe en modal: área gris con spinner pequeño al centro mientras carga
- Botón "Elegir" visible durante loading del iframe

### Empty/error states
- Filtro sin resultados: mensaje amigable "No hay templates en [categoría] aún" + link/botón para ver todos
- Iframe falla: mensaje "No se pudo cargar el preview" + botón "Reintentar", botón "Elegir" sigue disponible (puedes elegir sin ver preview)

### Claude's Discretion
- Aspect ratio exacto del thumbnail (sugerencia: 16:10 o similar)
- Tipografía y espaciado específico de las cards
- Implementación técnica del iframe scaling para mobile/desktop toggle
- Detalles de la animación de filtrado (duración, easing)

</decisions>

<specifics>
## Specific Ideas

- Cards con estilo limpio y moderno, sombras sutiles y bordes redondeados
- Modal de preview que permita comparar rápidamente entre templates (flechas prev/next)
- El creador puede elegir un template incluso si el preview falla al cargar

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-template-gallery*
*Context gathered: 2026-04-07*
