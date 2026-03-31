# Phase 5: Dashboard Layout - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

El creador puede navegar por el dashboard y ve la estructura completa de secciones, incluyendo un checklist de onboarding en la pantalla de inicio. Incluye sidebar persistente, header con info del creador, navegación responsive, y placeholders para secciones futuras.

</domain>

<decisions>
## Implementation Decisions

### Sidebar
- Fondo oscuro (zinc-900/950), íconos + texto, contraste con contenido principal — estilo Linear/Vercel
- Ancho: 240px en desktop
- Parte superior: logo de 12ity + nombre de la escuela del creador
- Links activos arriba, línea divisoria, links bloqueados abajo (lista plana con separador)
- Secciones bloqueadas (Cursos, Alumnos, Métricas, Equipo, Dominio): visibles pero atenuadas con opacidad reducida y candado pequeño. Al clic → "Próximamente"
- Link activo: fondo highlight (zinc-800) + barra vertical de color acento a la izquierda
- Parte inferior: mini perfil del creador (avatar pequeño + nombre) + botón cerrar sesión

### Header
- Lado izquierdo: título de sección actual (simple, sin breadcrumb jerárquico)
- Lado derecho: display name del creador + avatar
- Header sticky (fijo al hacer scroll)
- Borde inferior sutil (border-b border-zinc-800) para separar del contenido
- Clic en avatar/nombre: dropdown con opciones (Mi Perfil, Cerrar sesión)
- Avatar fallback: iniciales del nombre con color generado (estilo Slack/Linear)

### Fondo del contenido principal
- Fondo oscuro pero más claro que el sidebar (zinc-950 o neutral-900 vs zinc-900 del sidebar)
- Todo el dashboard es dark mode

### Checklist de onboarding
- Card prominente con checkboxes, barra de progreso arriba, y links a cada sección
- Solo pasos de fases existentes: cuenta creada, nombre de escuela, logo de escuela, completar perfil
- No incluir pasos futuros bloqueados en el checklist
- Cuando se completan todos los pasos: mensaje de celebración breve ("¡Tu escuela está lista!"), luego el checklist desaparece
- Home del dashboard = solo el checklist por ahora. Cuando se complete, estado vacío limpio

### Comportamiento móvil
- Breakpoint: 768px (md de Tailwind). Debajo de md → sidebar oculto, hamburguesa visible
- Sidebar móvil: overlay desde la izquierda con fondo oscuro detrás
- Animación slide suave (~200-300ms), overlay se desvanece
- Se cierra con: tap en overlay, tap en un link, o swipe hacia la izquierda
- Header móvil: hamburguesa a la izquierda, título de sección centrado, solo avatar (sin nombre) a la derecha
- Checklist en móvil: full width, misma estructura que desktop adaptada al espacio

### Claude's Discretion
- Acciones rápidas en el header (notificaciones, buscar) — decidir si agregar algo o dejarlo limpio
- Espaciado exacto y tipografía
- Diseño del skeleton de carga
- Animaciones de micro-interacción del sidebar
- Implementación exacta del gesto swipe

</decisions>

<specifics>
## Specific Ideas

- Estilo visual referencia: Linear y Vercel dashboard (oscuro, limpio, profesional)
- Avatar con iniciales estilo Slack/Linear para el fallback
- El checklist se inspira en onboarding de Stripe — card con barra de progreso y pasos clickeables

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-dashboard-layout*
*Context gathered: 2026-03-31*
