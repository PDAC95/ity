# Requirements: 12ity

**Defined:** 2026-03-31
**Core Value:** Creadores pueden lanzar su propia escuela online con marca propia — configuración, contenido y alumnos en un solo lugar.

## v1.1 Requirements

Requirements para Creator Dashboard. Cada uno mapea a fases del roadmap.

### Dashboard Layout

- [ ] **DASH-01**: Creador ve sidebar con navegación a todas las secciones del dashboard
- [ ] **DASH-02**: Creador ve header con su nombre y avatar
- [ ] **DASH-03**: Dashboard es responsive — sidebar colapsable en móvil con menú hamburguesa
- [ ] **DASH-04**: Dashboard home muestra checklist de onboarding con pasos pendientes de configuración
- [ ] **DASH-05**: Secciones futuras (Cursos, Alumnos, Métricas, Equipo, Dominio) muestran placeholder "Próximamente"

### School Setup

- [ ] **SCHOOL-01**: Creador puede editar nombre y descripción de su escuela
- [ ] **SCHOOL-02**: Creador puede subir logo de su escuela (imagen)
- [ ] **SCHOOL-03**: Creador puede definir un slug único para su escuela con validación de disponibilidad en tiempo real
- [ ] **SCHOOL-04**: Creador puede elegir colores de marca (primario y secundario) para su escuela

### Creator Profile

- [ ] **PROF-01**: Creador puede editar su nombre visible y biografía
- [ ] **PROF-02**: Creador puede subir foto de perfil (avatar)
- [ ] **PROF-03**: Creador puede agregar datos de contacto (email de contacto, redes sociales)

## Future Requirements

Tracked para milestones posteriores. No en el roadmap actual.

### Landing Page & Templates (v1.2)

- **LAND-01**: Creador puede elegir un template de landing page para su escuela
- **LAND-02**: Landing page muestra marca de la escuela (logo, colores, nombre)
- **LAND-03**: Alumno puede registrarse desde la landing del creador
- **LAND-04**: Alumno tiene su propio dashboard (vista diferente al maestro)

### Cursos & Clases (v1.3)

- **COURSE-01**: Creador puede crear cursos con nombre, descripción y precio
- **COURSE-02**: Creador puede agregar lecciones a un curso (video pregrabado)
- **COURSE-03**: Creador puede crear horarios de clases en vivo
- **COURSE-04**: Alumno puede enrolarse en un curso
- **COURSE-05**: Alumno puede ver lecciones pregrabadas
- **COURSE-06**: Alumno puede unirse a clases en vivo

### Dominio & Equipo & Métricas (v1.4)

- **DOM-01**: Creador puede conectar su dominio propio (DNS/SSL)
- **TEAM-01**: Creador puede invitar instructores o admin a su escuela
- **METR-01**: Dashboard muestra métricas básicas (alumnos, cursos, ingresos)

### Pagos (v1.5+)

- **PAY-01**: Alumno puede pagar por un curso
- **PAY-02**: Creador recibe pagos directamente (Stripe Connect o similar)

## Out of Scope

Explícitamente excluido. Documentado para prevenir scope creep.

| Feature | Reason |
|---------|--------|
| Builder visual de landing (drag & drop) | Demasiado complejo — sistema de templates es suficiente |
| App móvil nativa | Web-first, responsive es suficiente por ahora |
| Chat en tiempo real alumno-maestro | Alta complejidad, no es core para v1 |
| Marketplace de cursos (12ity como descubrimiento) | Contradice el modelo white-label — cada escuela es independiente |
| 2FA / MFA | Futuro enhancement de seguridad |
| Social login más allá de Google | Email/password + Google es suficiente |
| Custom branded emails | Supabase built-in por ahora |
| Gamificación (badges, puntos) | No es core, agrega complejidad innecesaria |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DASH-01 | — | Pending |
| DASH-02 | — | Pending |
| DASH-03 | — | Pending |
| DASH-04 | — | Pending |
| DASH-05 | — | Pending |
| SCHOOL-01 | — | Pending |
| SCHOOL-02 | — | Pending |
| SCHOOL-03 | — | Pending |
| SCHOOL-04 | — | Pending |
| PROF-01 | — | Pending |
| PROF-02 | — | Pending |
| PROF-03 | — | Pending |

**Coverage:**
- v1.1 requirements: 12 total
- Mapped to phases: 0
- Unmapped: 12

---
*Requirements defined: 2026-03-31*
*Last updated: 2026-03-31 after initial definition*
