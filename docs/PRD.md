# PRD - ITY (I Teach You)
## Product Requirements Document v1.1

**Fecha:** Enero 2025
**Tipo de Producto:** SaaS B2B2C (Business-to-Business-to-Consumer)
**Modelo:** Freemium/SaaS con suscripción mensual
**Nombre:** ITY (I Teach You)

---

## 1. VISIÓN DEL PRODUCTO

### 1.1 Declaración de Visión
Crear la plataforma más simple y rápida para que cualquier experto lance su escuela online profesional. **"Crea lo que buscas, como lo buscas"** - simplicidad y velocidad como pilares fundamentales.

### 1.2 Problema a Resolver
Los creadores de contenido educativo actualmente enfrentan:
- **Fragmentación extrema**: Usan 5-8 herramientas diferentes (Zoom, Drive, Stripe, Mailchimp, WordPress)
- **Complejidad fiscal**: Gestión manual de IVA/impuestos internacionales
- **Comisiones altas**: 30-50% en marketplaces tradicionales
- **Pérdida de control**: No poseen datos de estudiantes ni branding propio
- **Experiencia pobre en vivo**: Integración deficiente entre streaming y contenido
- **Sobrecarga cognitiva**: Demasiadas decisiones técnicas para no-programadores
- **Plataformas complejas**: Kajabi y similares son poderosas pero abrumadoras

### 1.3 Solución Propuesta
Una plataforma modular donde el creador:
1. Configura su branding básico (logo, colores, tipografía)
2. Activa solo los bloques que necesita (sistema modular)
3. Personaliza la vista del estudiante (qué ve y cómo)
4. Conecta su dominio propio (ITY maneja el hosting)
5. Conecta Stripe y empieza a vender
6. Da clases en vivo o sube contenido pregrabado
7. Todo bajo su marca, su estilo

### 1.4 Propuesta de Valor Única

**Tagline:** "Crea lo que buscas, como lo buscas"

**Para Creadores:**
- Simplicidad y velocidad ante todo
- Tu dominio, tu marca, tu escuela
- Sistema de bloques: activa solo lo que necesitas
- Personaliza la experiencia del estudiante
- 0% comisiones en planes pagos
- Múltiples escuelas desde una cuenta

**Para Estudiantes:**
- Experiencia unificada y profesional
- Acceso directo con el instructor
- Herramientas de aprendizaje integradas

---

## 2. ESTRATEGIA DE MERCADO

### 2.1 Expansión por Fases

| Fase | Mercado | Idiomas | Prioridad |
|------|---------|---------|-----------|
| **Fase 1** | USA + Canadá | Inglés, Francés | MVP Launch |
| **Fase 2** | América Latina | Español, Portugués | Post-PMF |
| **Fase 3** | Europa | Inglés, Francés, Español, Portugués | Scale |

**Países Fase 3:** Francia, Reino Unido, Portugal, España

### 2.2 Idiomas Soportados (Roadmap)
1. **MVP:** Inglés (EN)
2. **Fase 2:** Español (ES), Francés (FR)
3. **Fase 3:** Portugués (PT-BR)

**Nota técnica:** La arquitectura i18n se implementa desde el día 1 para evitar refactors costosos.

### 2.3 Posicionamiento Competitivo

| Aspecto | ITY | Kajabi | Teachable |
|---------|-----|--------|-----------|
| **Posicionamiento** | Simplicidad + Velocidad | Todo-en-uno complejo | Balance features/precio |
| **Setup time** | < 30 min | 2-3 días | 1-2 días |
| **Clases en vivo** | Integrado (core) | No integrado | No integrado |
| **Bloques modulares** | Core del producto | Parcial | No |
| **Dominio propio** | Todos los planes | Solo Pro+ | Solo Pro+ |
| **Curva de aprendizaje** | Baja | Alta | Media |

### 2.4 Objetivos de Negocio (12 meses)
1. 500 creadores activos pagando
2. $50K MRR (Monthly Recurring Revenue)
3. 75% retención mensual
4. 25,000 estudiantes activos en la plataforma

### 2.5 KPIs Principales

**Producto:**
- Time-to-First-Course: < 30 minutos
- Adoption Rate: % de creadores que activan cada bloque
- Course Completion Rate: % de estudiantes que terminan cursos
- Uptime en vivo: 99.5%+

**Negocio:**
- CAC (Customer Acquisition Cost): < $150
- LTV (Lifetime Value): > $900 (6+ meses promedio)
- Churn Rate: < 5% mensual
- NPS: > 50

**Engagement:**
- DAU/MAU ratio: > 0.3 para estudiantes
- Horas de clases en vivo por mes: 1,000+
- Videos consumidos: 50,000+ views/mes

---

## 3. USUARIOS OBJETIVO

### 3.1 Persona Primaria: "El Creador de Marca Personal"
**Demografía:**
- Edad: 28-45 años
- Ubicación: Global (foco inicial USA/Canadá)
- Profesión: Coach, consultor, experto en nicho, influencer educativo
- Ingresos actuales: $2K-$10K/mes

**Psicografía:**
- Ya tiene audiencia (1K-10K seguidores)
- Da clases/mentoría actualmente (Zoom + manual)
- Frustrado con comisiones de plataformas existentes
- Valora su marca personal como activo principal
- Quiere control total sobre la experiencia del estudiante
- Dispuesto a pagar por solución que respete su marca

**Pain Points:**
- "Pierdo 3 horas a la semana solo coordinando herramientas"
- "Las plataformas existentes se llevan mucho en comisiones"
- "No tengo los emails de mis estudiantes"
- "Las clases en Zoom se sienten separadas del contenido"
- "Kajabi es muy complicado para lo que necesito"

**Jobs to be Done:**
- Dar clases en vivo profesionalmente
- Vender cursos sin intermediarios
- Gestionar estudiantes en un solo lugar
- Proyectar MI marca profesional (no la de la plataforma)
- Crear una experiencia única para mis estudiantes

### 3.2 Persona Secundaria: "El Emprendedor Digital"
- Primer curso, validando idea
- Audiencia pequeña (< 1K)
- Presupuesto limitado
- Prioriza velocidad sobre personalización
- Puede convertirse en Creador de Marca Personal

### 3.3 Anti-Persona (No es para)
- Universidades/instituciones grandes (necesitan Moodle/Canvas LMS)
- Creadores que solo quieren tráfico orgánico (mejor Udemy)
- Empresas que necesitan LMS corporativo complejo
- Usuarios que quieren diseño pixel-perfect tipo Webflow

---

## 4. ARQUITECTURA DEL PRODUCTO

### 4.1 Estructura de 3 Capas

**CAPA 1: CREADOR (Admin Dashboard)**
- Gestión de escuelas (multi-escuela)
- Configuración de branding por escuela
- Gestión de contenido y bloques
- Personalización de vista del estudiante
- Analytics y reportes
- Configuración de pagos y dominio

**CAPA 2: ESTUDIANTE (Frontend Público)**
- Landing de venta (personalizada por creador)
- Dashboard del estudiante (personalizable)
- Reproductor de contenido
- Área de clases en vivo
- Cuenta independiente por escuela

**CAPA 3: SISTEMA (Backend)**
- Autenticación y usuarios (multi-tenant)
- Procesamiento de pagos (Stripe Connect)
- Gestión de archivos y videos
- Streaming de video en vivo
- Notificaciones y emails
- Gestión de dominios custom
- Sistema de internacionalización (i18n)

### 4.2 Modelo Multi-Tenant

**Escuelas:**
- Un creador puede tener múltiples escuelas
- Cada escuela tiene su propio dominio custom
- Branding independiente por escuela
- Cursos y estudiantes separados por escuela

**Estudiantes:**
- Cuenta separada por escuela
- Un estudiante en `mariayoga.com` es diferente a uno en `pedrococina.com`
- Cada registro es independiente
- Pagos independientes por escuela

**Dominios:**
- El creador usa su propio dominio (ej: `escuela.mariayoga.com` o `mariayoga.com`)
- ITY maneja el hosting completo
- El creador solo apunta nameservers/DNS a ITY
- SSL automático por dominio

### 4.3 Sistema de Bloques Modulares (CORE)

El sistema de bloques es el corazón de ITY. El creador "activa" solo los bloques que necesita:

#### BLOQUES MVP (v1.0)

**Bloque 1: Videos/Lecciones**
- Subida de videos (MP4, MOV)
- Organización en módulos > lecciones
- Reproductor con controles básicos
- Tracking de progreso (% visto)
- Prevención de descarga

**Bloque 2: Calendario + Clases en Vivo**
- Programación de sesiones
- Sala de video en vivo (WebRTC)
- Chat en tiempo real
- Grabación automática opcional
- Notificaciones automáticas

**Bloque 3: Exámenes/Quizzes**
- Creador de preguntas (opción múltiple, V/F, abierta)
- Límite de tiempo opcional
- Autocalificación
- Resultados por estudiante
- Requisito para avanzar (opcional)

**Bloque 4: Landing de Venta**
- Builder de secciones drag & drop
- Secciones: Hero, Temario, FAQ, Testimonios, CTA
- Preview mobile/desktop
- Botón de compra integrado

**Bloque 5: Guías Descargables**
- Subida de PDFs, DOCs, archivos
- Organización por lección/módulo
- Control de acceso (free vs paid)
- Contador de descargas

**Bloque 6: Anuncios/Novedades**
- Sistema de posts tipo blog interno
- Notificación push a estudiantes
- Markdown support
- Programación de publicación

**Bloque 7: Dashboard de Progreso**
- Vista del estudiante: % completado, próximas clases
- Vista del creador: engagement, asistencia, completions
- Gráficos simples (barras, líneas)

#### BLOQUES ROADMAP (Post-MVP)

**Fase 2:**
- Chat directo maestro-estudiante
- Sistema de tareas/entregables
- Certificados personalizables
- Retos/Challenges
- Biblioteca de recursos

**Fase 3:**
- Chat IA entrenado con contenido del curso
- Gamificación (puntos, badges)
- Foro/comunidad por curso
- Sesiones 1-on-1 con booking
- Email marketing integrado

**Fase 4:**
- Pizarra digital en vivo
- Breakout rooms
- Transcripciones automáticas
- App móvil nativa
- Integraciones (Zapier, Calendly)

### 4.4 Sistema de Personalización

**Nivel 1: Branding Básico (MVP)**
- Logo de la escuela
- Colores primarios y secundarios
- Tipografía (selección de catálogo)
- Favicon

**Nivel 2: Estructura de Contenido**
- Qué bloques están activos
- Orden de los bloques en el dashboard del estudiante
- Qué información ve el estudiante primero

**Nivel 3: Landing Page**
- Builder de secciones (drag & drop)
- Secciones predefinidas personalizables
- Textos, imágenes, videos editables
- Preview responsive

**Lo que NO se personaliza (por ahora):**
- CSS custom o código
- Layout completamente libre
- Diseño pixel-perfect tipo Webflow

---

## 5. ESPECIFICACIONES FUNCIONALES

### 5.1 Flujo del Creador (Onboarding)

**PASO 1: Registro (2 min)**
```
Input: Email, Password, Name
Validación: Email único, contraseña fuerte
Output: Cuenta creada + Email verificación
```

**PASO 2: Crear Primera Escuela (5 min)**
```
Wizard de 4 pasos:
1. Nombre de tu escuela: "Maria Yoga Academy"
2. Branding: Logo (opcional), colores primarios
3. Tipografía: Selección de catálogo (3-5 opciones)
4. Dominio: Instrucciones para conectar dominio custom
Output: Escuela con branding básico lista
```

**PASO 3: Crear Primer Curso (10 min)**
```
1. Título del curso
2. Descripción corta
3. Precio (o gratis)
4. Seleccionar bloques a activar (checkboxes)
5. Preview + Publicar
Output: Curso creado, listo para contenido
```

**PASO 4: Añadir Contenido (15 min)**
```
Según bloques activados:
- Si Videos: Drag & drop de archivos
- Si Clases en Vivo: Programar primera sesión
- Si Examen: Crear 3-5 preguntas
- Si Landing: Editar secciones
Output: Primer contenido disponible
```

**PASO 5: Conectar Pagos (3 min)**
```
1. Click "Enable Payments"
2. Connect with Stripe (OAuth)
3. Verificar cuenta bancaria
4. Ready to sell
```

**PASO 6: Conectar Dominio (5 min)**
```
1. Instrucciones claras para configurar DNS
2. Verificación automática de propagación
3. SSL automático
4. Escuela live en dominio propio
```

**Total Time-to-Launch: ~40 minutos**

### 5.2 Flujo del Estudiante

**PASO 1: Descubrimiento**
```
Entrada: URL del dominio del creador (ej: mariayoga.com)
Pantalla: Landing page personalizada del curso
```

**PASO 2: Compra**
```
1. Click "Buy Now"
2. Stripe Checkout embebido
3. Confirmación + Email recibo
4. Auto-creación de cuenta en ESA escuela
```

**PASO 3: Acceso**
```
Dashboard estudiante (personalizado por el creador) con:
- Cursos activos
- Próximas clases en vivo
- Progreso general
- Notificaciones
- Orden definido por el creador
```

**PASO 4: Consumo**
```
Según bloques del curso:
- Videos: Ver con tracking automático de progreso
- Clases en Vivo: Unirse desde dashboard (un click)
- Exámenes: Hacer quiz, ver resultados
- Recursos: Descargar guías
```

**PASO 5: Certificación (Opcional, post-MVP)**
```
Al completar 100% del contenido:
- Badge desbloqueado
- Certificado PDF generado
- Email de felicitación
```

---

## 6. REQUERIMIENTOS TÉCNICOS

### 6.1 Stack Tecnológico Recomendado

**FRONTEND**
- **Framework:** Next.js 14+ (React con App Router)
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** Zustand o React Query
- **Forms:** React Hook Form + Zod validation
- **Editor WYSIWYG:** Lexical o TipTap (para landing pages)
- **i18n:** next-intl (arquitectura desde día 1)

**BACKEND**
- **Runtime:** Node.js 20+
- **Framework:** Express.js o Fastify
- **Database:** PostgreSQL 15+ (Supabase recomendado)
- **ORM:** Prisma
- **Cache:** Redis (para sesiones y rate limiting)
- **Queue:** BullMQ (para procesamiento de video)

**INFRAESTRUCTURA**
- **Hosting:** Vercel (frontend) + Railway/Fly.io (backend)
- **Storage:** AWS S3 o Cloudflare R2
- **CDN:** Cloudflare
- **Video Processing:** Mux o AWS MediaConvert
- **Email:** Resend o SendGrid
- **DNS/Domains:** Cloudflare (wildcard SSL, custom domains)

**VIDEO EN VIVO**
- **Provider:** Daily.co (más simple) o Agora.io (más robusto)
- **Protocolo:** WebRTC
- **Recording:** Provider-side storage → S3 post-processing
- **Chat:** Socket.io o Ably

**PAGOS**
- **Gateway:** Stripe Connect (Express Accounts)
- **Webhook handling:** Svix o manual
- **Invoicing:** Stripe Tax automático

**AUTENTICACIÓN**
- **Creadores:** NextAuth.js con JWT
- **Estudiantes:** Magic links + opcional social login
- **Multi-tenant:** Custom domain routing

### 6.2 Arquitectura de Datos

**ENTIDADES PRINCIPALES**

```sql
-- Creadores (usuarios de ITY)
CREATE TABLE creators (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  password_hash VARCHAR,
  name VARCHAR,
  language VARCHAR DEFAULT 'en', -- preferencia de idioma UI
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Escuelas (un creador puede tener múltiples)
CREATE TABLE schools (
  id UUID PRIMARY KEY,
  creator_id UUID REFERENCES creators(id),
  name VARCHAR,
  custom_domain VARCHAR UNIQUE,
  domain_verified BOOLEAN DEFAULT false,
  branding JSONB, -- {logo, primary_color, secondary_color, font}
  student_dashboard_config JSONB, -- orden y visibilidad de bloques
  stripe_account_id VARCHAR,
  subscription_plan VARCHAR, -- plan de ITY
  language VARCHAR DEFAULT 'en', -- idioma default de la escuela
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Cursos
CREATE TABLE courses (
  id UUID PRIMARY KEY,
  school_id UUID REFERENCES schools(id),
  title VARCHAR,
  description TEXT,
  price DECIMAL,
  currency VARCHAR,
  is_published BOOLEAN,
  active_blocks JSONB, -- ['videos', 'live', 'quizzes']
  landing_page_data JSONB, -- configuración del builder
  created_at TIMESTAMP
);

-- Módulos y Lecciones
CREATE TABLE modules (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  title VARCHAR,
  order_index INT
);

CREATE TABLE lessons (
  id UUID PRIMARY KEY,
  module_id UUID REFERENCES modules(id),
  title VARCHAR,
  type VARCHAR, -- 'video', 'text', 'quiz', 'download'
  content JSONB, -- estructura varía según type
  order_index INT,
  is_free BOOLEAN
);

-- Estudiantes (por escuela, no globales)
CREATE TABLE students (
  id UUID PRIMARY KEY,
  school_id UUID REFERENCES schools(id),
  email VARCHAR,
  name VARCHAR,
  password_hash VARCHAR,
  created_at TIMESTAMP,
  UNIQUE(school_id, email) -- mismo email puede estar en diferentes escuelas
);

-- Enrollments
CREATE TABLE enrollments (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  course_id UUID REFERENCES courses(id),
  enrolled_at TIMESTAMP,
  completed_at TIMESTAMP,
  progress JSONB -- {lesson_id: {viewed: true, percentage: 85}}
);

-- Clases en Vivo
CREATE TABLE live_classes (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  title VARCHAR,
  scheduled_at TIMESTAMP,
  duration_minutes INT,
  room_url VARCHAR, -- Daily.co room
  recording_url VARCHAR,
  status VARCHAR, -- 'scheduled', 'live', 'ended'
  attendees JSONB -- [{student_id, joined_at, left_at}]
);

-- Pagos
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  course_id UUID REFERENCES courses(id),
  school_id UUID REFERENCES schools(id),
  amount DECIMAL,
  currency VARCHAR,
  stripe_payment_intent_id VARCHAR,
  status VARCHAR, -- 'pending', 'succeeded', 'failed', 'refunded'
  created_at TIMESTAMP
);

-- Traducciones de contenido (para cursos multi-idioma futuro)
CREATE TABLE content_translations (
  id UUID PRIMARY KEY,
  entity_type VARCHAR, -- 'course', 'module', 'lesson'
  entity_id UUID,
  language VARCHAR, -- 'en', 'es', 'fr', 'pt'
  field VARCHAR, -- 'title', 'description'
  value TEXT,
  UNIQUE(entity_type, entity_id, language, field)
);
```

### 6.3 Arquitectura i18n

**Principios:**
- Arquitectura preparada desde día 1
- MVP solo en inglés, pero estructura lista
- Separación clara: UI vs Contenido

**UI de la plataforma:**
- Archivos de traducción: `/locales/{lang}.json`
- Namespace por área: `common`, `creator`, `student`, `auth`
- Interpolación para variables dinámicas
- Pluralización correcta por idioma

**Contenido del creador:**
- Tabla `content_translations` para cursos multi-idioma (futuro)
- El creador elige en qué idioma crear contenido
- Estudiante ve contenido en idioma disponible

**Formato de datos:**
- Fechas: ISO 8601, renderizado locale-aware
- Monedas: Stripe maneja conversión, display según locale
- Números: Formateo según locale

### 6.4 Requerimientos de Seguridad

**Autenticación:**
- JWT con refresh tokens (7 días access, 30 días refresh)
- Rate limiting: 100 req/min por IP
- Password: mínimo 8 chars, 1 mayúscula, 1 número

**Autorización:**
- RBAC: Creator, Student, Admin roles
- Row-level security: Estudiantes solo ven sus enrollments
- Multi-tenant isolation: Datos de escuelas completamente separados
- API: Bearer token en headers

**Video Streaming:**
- Signed URLs con expiración (4 horas)
- Domain restrictions para iframe embeds
- DRM con Widevine (solo en planes Pro+, futuro)

**Datos:**
- Encriptación at-rest: AES-256 (S3)
- Encriptación in-transit: TLS 1.3
- GDPR compliance: Derecho al olvido implementado
- CCPA compliance (California): Requerido para mercado USA
- PIPEDA compliance (Canadá): Requerido para mercado Canadá
- Backups automáticos diarios

**Pagos:**
- PCI DSS Level 1: Delegado a Stripe (nunca tocamos tarjetas)
- Webhook signature verification
- 3D Secure habilitado

**Dominios Custom:**
- Verificación de propiedad de dominio
- SSL automático via Let's Encrypt / Cloudflare
- Protección contra domain hijacking

---

## 7. DISEÑO Y EXPERIENCIA DE USUARIO

### 7.1 Principios de Diseño

1. **Simplicidad ante todo**
   - Menos opciones, más claridad
   - Cada pantalla tiene UN objetivo principal
   - "Crea lo que buscas, como lo buscas"

2. **Velocidad percibida**
   - Skeleton loaders
   - Optimistic UI updates
   - < 2 seg load time objetivo

3. **Mobile-First**
   - 60% de estudiantes consumen en móvil
   - Touch targets mínimo 44x44px
   - Videos responsive

4. **Accesibilidad**
   - ARIA labels
   - Navegación por teclado
   - Contraste WCAG AA

5. **Personalización guiada**
   - Opciones limitadas pero efectivas
   - Resultados siempre profesionales
   - No se puede "romper" el diseño

### 7.2 Pantallas Críticas

**Dashboard del Creador:**
```
+------------------------------------------+
|  ITY        Schools ▼       🔔 👤        |
+------------------------------------------+
|                                          |
|  📊 Maria Yoga Academy - Overview        |
|  ┌─────────────────────────────────────┐|
|  │ 24 active students       +12% ↑     │|
|  │ 3 published courses                 │|
|  │ $450 revenue this month             │|
|  └─────────────────────────────────────┘|
|                                          |
|  📚 My Courses                          |
|  ┌──────────────┐ ┌──────────────┐     |
|  │ Advanced Yoga│ │ [+ New       │     |
|  │ 18 students  │ │   Course]    │     |
|  │ ⚙️ Edit      │ │              │     |
|  └──────────────┘ └──────────────┘     |
|                                          |
|  📅 Upcoming Live Classes               |
|  • Today 4:00 PM - Guided Meditation   |
|  • Tomorrow 10:00 AM - Basic Asanas    |
|                                          |
|  ⚙️ School Settings                     |
|  Domain: mariayoga.com ✓ Connected     |
+------------------------------------------+
```

**School Settings - Branding:**
```
+------------------------------------------+
|  ← Back    School Settings    [Save]    |
+------------------------------------------+
|                                          |
|  🎨 Branding                            |
|                                          |
|  Logo                                    |
|  ┌─────────────────┐                    |
|  │  [Upload Logo]  │  PNG, max 2MB      |
|  └─────────────────┘                    |
|                                          |
|  Primary Color                          |
|  [■ #6366F1] ← Click to change         |
|                                          |
|  Secondary Color                        |
|  [■ #F59E0B] ← Click to change         |
|                                          |
|  Font                                    |
|  [▼ Inter (Modern)]                     |
|  • Inter (Modern)                       |
|  • Merriweather (Professional)          |
|  • Space Mono (Minimal)                 |
|                                          |
|  Preview ─────────────────────────────  |
|  ┌─────────────────────────────────────┐|
|  │     [Logo] Maria Yoga Academy       │|
|  │     Your journey starts here        │|
|  └─────────────────────────────────────┘|
+------------------------------------------+
```

**Student Dashboard Configuration:**
```
+------------------------------------------+
|  ← Back    Student View Settings        |
+------------------------------------------+
|                                          |
|  Drag to reorder what students see:     |
|                                          |
|  ☰ 1. Announcements                     |
|  ☰ 2. Current Course Progress           |
|  ☰ 3. Upcoming Live Classes             |
|  ☰ 4. Recent Activity                   |
|                                          |
|  Show/Hide:                              |
|  [✓] Progress percentage                |
|  [✓] Next lesson suggestion             |
|  [ ] Leaderboard (coming soon)          |
|                                          |
+------------------------------------------+
```

**Dashboard del Estudiante (ejemplo configurado):**
```
+------------------------------------------+
|  [Logo] Maria Yoga Academy   🔔 Logout  |
+------------------------------------------+
|                                          |
|  📢 Announcements                       |
|  • "Extra class this Friday!"           |
|                                          |
|  🎯 Your Progress                       |
|  ┌─────────────────────────────────────┐|
|  │ Advanced Yoga                       │|
|  │ ████████░░░░░░ 65% completed        │|
|  │ [Continue Learning]                 │|
|  └─────────────────────────────────────┘|
|                                          |
|  📅 Upcoming Live Classes               |
|  • Today 4:00 PM - Guided Meditation   |
|  [Join Class]                           |
|                                          |
+------------------------------------------+
```

### 7.3 Sistema de Templates para Landing

**Secciones disponibles (drag & drop):**
1. **Hero** - Título, subtítulo, imagen/video, CTA
2. **About** - Sobre el instructor/curso
3. **Curriculum** - Temario con módulos y lecciones
4. **Benefits** - Qué aprenderás (bullets)
5. **Testimonials** - Reviews de estudiantes
6. **FAQ** - Preguntas frecuentes
7. **Pricing** - Precio y botón de compra
8. **Guarantee** - Garantía de satisfacción

**Cada sección:**
- Textos editables inline
- Imágenes/videos reemplazables
- Colores heredados del branding
- Responsive automático

---

## 8. MODELO DE NEGOCIO Y PRICING

### 8.1 Estructura de Planes (PLACEHOLDER)

> **Nota:** Los precios son placeholder hasta completar estudio de mercado para USA/Canadá.

| PLAN | PRECIO/MES | COMISIÓN | LÍMITES | TARGET |
|------|------------|----------|---------|--------|
| **Free** | $0 | TBD% | 1 escuela, 1 curso, límite estudiantes TBD | Validación |
| **Starter** | $TBD | 0% | 1 escuela, cursos TBD, estudiantes TBD | Creadores nuevos |
| **Pro** | $TBD | 0% | Múltiples escuelas, cursos TBD, estudiantes TBD | Crecimiento |
| **Business** | $TBD | 0% | Ilimitado, soporte prioritario | Academias |

**Addons potenciales (TBD):**
- IA Assistant
- White label completo
- Dominio + email custom

### 8.2 Go-to-Market Strategy

**Fase 1: Early Access (Meses 1-3)**
- 50 beta users en USA/Canadá
- Feedback loop semanal
- Objetivo: Product-market fit

**Fase 2: Launch Público USA/Canadá (Meses 4-6)**
- Content marketing (SEO + blog)
- Partnerships con influencers educativos
- Webinars: "Launch your online school in 30 minutes"
- Target: 10 creadores/semana

**Fase 3: Growth + Expansión (Meses 7-12)**
- Paid ads (Facebook, Google)
- Affiliate program
- Case studies de usuarios exitosos
- Añadir español/francés para LATAM y Quebec
- Target: 30 creadores/semana

---

## 9. ROADMAP DE DESARROLLO

### 9.1 Fases de Implementación

**FASE 0: Fundación (Semanas 1-4)**
- Setup de infraestructura
- Arquitectura i18n desde día 1
- DB schema + migrations
- Auth system (creadores + estudiantes multi-tenant)
- Dashboard básico creador/estudiante
- Sistema de dominios custom (básico)

**FASE 1: MVP Core (Semanas 5-12)**

**Sprint 1-2:** Gestión de Escuelas y Cursos
- CRUD escuelas con branding básico
- CRUD cursos, módulos, lecciones
- Sistema de bloques (activar/desactivar)

**Sprint 3-4:** Videos y Progreso
- Upload de videos con progress bar
- Video player con tracking
- Cálculo de % completado
- Dashboard estudiante configurable

**Sprint 5-6:** Monetización
- Stripe Connect integration
- Checkout flow
- Webhook handling

**Sprint 7-8:** Landing Builder
- Builder de secciones drag & drop
- Secciones predefinidas
- Preview mode

**Sprint 9-10:** Live Streaming MVP
- Integración Daily.co
- Scheduling de clases
- Sala básica (video + chat)

**Sprint 11-12:** Dominios + Polish
- Sistema de dominios custom completo
- SSL automático
- Bug fixes y performance
- User testing (10 beta users)

**FASE 2: Bloques Adicionales (Semanas 13-20)**
- Quizzes/exámenes
- Guías descargables
- Sistema de anuncios
- Certificados

**FASE 3: Idiomas + Engagement (Semanas 21-28)**
- Español y Francés en UI
- Chat directo maestro-estudiante
- Email automation básico
- Analytics avanzados

**FASE 4: Scale (Semanas 29-36)**
- Portugués en UI
- IA Assistant
- App móvil (React Native)
- Integraciones (Zapier, Calendly)
- API pública

### 9.2 Criterios de Éxito por Fase

**MVP Launch:**
- 5 creadores pueden crear y vender un curso end-to-end
- 0 critical bugs en 48h de testing
- Time-to-first-course < 45 min
- Payment success rate > 95%
- Dominio custom funcionando correctamente

**Beta Pública:**
- 50 creadores activos en USA/Canadá
- $2K MRR
- NPS > 40
- < 10% churn mensual

**Product-Market Fit:**
- 200+ creadores activos
- 40% users retornan semanalmente
- Organic growth > 20% MoM
- 3+ testimonios sin solicitar

---

## 10. RIESGOS Y MITIGACIONES

### 10.1 Riesgos Técnicos

**RIESGO 1: Caídas en clases en vivo**
- **Impacto:** Alto (churn inmediato)
- **Probabilidad:** Media
- **Mitigación:**
  - Usar provider enterprise (Daily.co Tier 2)
  - Fallback a grabación automática
  - Status page pública
  - SLA 99.5% garantizado

**RIESGO 2: Costos de video hosting**
- **Impacto:** Alto (margen negativo)
- **Probabilidad:** Media-Alta
- **Mitigación:**
  - Límites estrictos por plan
  - Compression automática
  - CDN con cache agresivo
  - Storage tiering

**RIESGO 3: Complejidad de dominios custom**
- **Impacto:** Medio (frustración usuario)
- **Probabilidad:** Alta
- **Mitigación:**
  - Instrucciones muy claras paso a paso
  - Verificación automática de DNS
  - Chat support para configuración
  - Video tutorial específico

**RIESGO 4: i18n mal implementado**
- **Impacto:** Alto (refactor costoso)
- **Probabilidad:** Media
- **Mitigación:**
  - Arquitectura desde día 1 (aunque solo inglés)
  - Usar librería probada (next-intl)
  - Code review específico para strings hardcodeadas
  - Testing con pseudo-localization

### 10.2 Riesgos de Producto

**RIESGO 5: Personalización insuficiente**
- **Impacto:** Medio (creadores quieren más control)
- **Probabilidad:** Media
- **Mitigación:**
  - Feedback loop constante con beta users
  - Roadmap de personalización incremental
  - Comunicación clara de lo que viene

**RIESGO 6: Feature creep**
- **Impacto:** Alto (never launch)
- **Probabilidad:** Alta
- **Mitigación:**
  - Roadmap público y transparente
  - "No" por defecto a features
  - Validar con 10 usuarios antes de construir
  - Mantra: "Simplicidad y velocidad"

### 10.3 Riesgos de Mercado

**RIESGO 7: Competencia en USA**
- **Impacto:** Alto
- **Probabilidad:** Media
- **Mitigación:**
  - Posicionamiento claro: simplicidad vs complejidad
  - Clases en vivo como diferenciador
  - Precio competitivo (post-estudio)

**RIESGO 8: Compliance USA/Canadá**
- **Impacto:** Alto (legal)
- **Probabilidad:** Baja si se hace bien
- **Mitigación:**
  - CCPA compliance desde día 1
  - PIPEDA compliance desde día 1
  - Consulta legal antes de launch
  - Privacy policy y ToS robustos

---

## 11. DEPENDENCIAS Y SUPOSICIONES

### 11.1 Dependencias Críticas
- Stripe disponible en USA y Canadá (✓)
- Daily.co sin restricciones
- Cloudflare para DNS y SSL
- next-intl estable para i18n

### 11.2 Suposiciones Clave
- **Mercado:** Creadores en USA valoran simplicidad sobre features
- **Técnico:** Custom domains manejables con Cloudflare
- **Financiero:** Pricing competitivo aún por determinar
- **Comportamiento:** Creadores toleran 40 min setup por control total

---

## 12. PRÓXIMOS PASOS

### 12.1 Pre-Desarrollo (Semana 1)
- [ ] Validar con 10 creadores potenciales en USA (entrevistas)
- [ ] Estudio de mercado para pricing
- [ ] Definir stack técnico final
- [ ] Setup repositorios + CI/CD

### 12.2 Desarrollo Sprint 1 (Semana 2-3)
- [ ] Arquitectura i18n con next-intl
- [ ] DB schema + Prisma setup
- [ ] Auth system multi-tenant
- [ ] Dashboard skeleton (creator + student)
- [ ] Deploy a staging

### 12.3 Pre-Launch (Semana 10-12)
- [ ] Beta testing con 5-10 usuarios USA/Canadá
- [ ] Documentación en inglés
- [ ] Video demo (2 min)
- [ ] Landing page de ITY para early access

---

## 13. APÉNDICES

### 13.1 Glosario
- **MRR:** Monthly Recurring Revenue
- **Churn:** % de usuarios que cancelan cada mes
- **LTV:** Lifetime Value (ingreso total promedio por usuario)
- **CAC:** Customer Acquisition Cost
- **i18n:** Internationalization
- **WebRTC:** Web Real-Time Communication
- **CDN:** Content Delivery Network
- **CCPA:** California Consumer Privacy Act
- **PIPEDA:** Personal Information Protection and Electronic Documents Act (Canadá)

### 13.2 Referencias
- Stripe Connect Docs: https://stripe.com/docs/connect
- Daily.co API: https://docs.daily.co
- Next.js Multi-tenancy: https://vercel.com/guides/nextjs-multi-tenant-application
- next-intl: https://next-intl-docs.vercel.app
- CCPA Compliance: https://oag.ca.gov/privacy/ccpa
- PIPEDA: https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/

---

**Documento vivo:** Este PRD se actualiza cada sprint con feedback de usuarios y decisiones técnicas.

**Última actualización:** Enero 2025 - v1.1
- Cambio de nombre a ITY (I Teach You)
- Mercado global con fases (USA/Canadá primero)
- Sistema de dominios custom (no subdominios)
- Arquitectura i18n desde día 1
- Multi-escuela por creador
- Estudiantes independientes por escuela
- Pricing placeholder hasta estudio de mercado
