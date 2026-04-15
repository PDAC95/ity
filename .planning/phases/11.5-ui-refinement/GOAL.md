---
phase: 11.5
name: ui-refinement
type: inserted
inserted_between: [11, 12]
milestone: v1.2
created: 2026-04-09
---

# Phase 11.5: UI Refinement

## Goal

Refinar toda la interfaz de usuario para que se vea profesional, consistente y moderna. Actualmente el frontend tiene un estilo muy basico que no transmite confianza como producto SaaS.

## Why Now

- Phase 11 UAT revelo que el chat wizard se ve como "un frontend de 1998"
- Antes de construir Phase 12 (PRD Submission) necesitamos un frontend solido
- Los usuarios juzgan la calidad del producto por su apariencia — un dashboard basico mata la confianza

## Scope

### Critical (must fix)

1. **Theme consistency** — La app mezcla 3 temas: auth (blue gradient + white), dashboard (dark zinc), chat (white). Unificar bajo un solo sistema de diseno dark.

2. **Chat Wizard UI overhaul** — El componente principal de la fase actual. Necesita:
   - Header con contexto (template elegido, escuela)
   - Indicador de progreso (seccion actual de 5)
   - Mensajes con mejor diferenciacion visual
   - Animaciones de streaming mas suaves
   - Diseno que se sienta como producto premium

3. **Typography system** — No hay jerarquia consistente. Headings, body, labels, hints todos usan tamanios ad-hoc.

4. **Form validation UX** — Solo hay cajas rojas de error. Falta feedback inline, estados de exito, mejor tratamiento visual.

### High Priority

5. **Dashboard shell polish** — Sidebar, header, y layout general necesitan mas refinamiento.

6. **Profile & School Setup forms** — Formularios largos sin indicadores de seccion, contraste pobre en inputs dark-on-dark.

7. **Template Gallery** — Cards y modal de preview necesitan pulido.

### Nice to Have (if time)

8. **Loading skeletons** — Reemplazar spinners con skeleton screens.
9. **Empty states** — Mejorar estados vacios con ilustraciones o mensajes utiles.
10. **Mobile responsiveness** — Ajustar spacing y touch targets.

## Out of Scope

- No crear component library completa (no shadcn migration)
- No cambiar stack tecnico (seguir con Tailwind + Lucide + Framer Motion)
- No funcionalidad nueva — solo refinamiento visual
- No i18n / traducciones

## Success Criteria

- [ ] Tema unificado dark en toda la app (auth, dashboard, chat)
- [ ] Chat wizard se siente como producto premium (header, progress, animaciones)
- [ ] Formularios tienen feedback visual claro (inline errors, success states)
- [ ] Tipografia consistente con escala definida
- [ ] El usuario siente que esta usando un producto real, no un prototipo
