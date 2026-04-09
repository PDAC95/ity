---
phase: quick-2
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - ity/apps/web/package.json
  - ity/apps/web/next.config.js
  - ity/apps/web/app/page.tsx
  - ity/apps/web/app/globals.css
  - ity/apps/web/components/landing/vixan/Wrapper.tsx
  - ity/apps/web/components/landing/vixan/LandingPage.tsx
  - ity/apps/web/components/landing/vixan/HeaderOne.tsx
  - ity/apps/web/components/landing/vixan/MobileMenu.tsx
  - ity/apps/web/components/landing/vixan/FooterOne.tsx
  - ity/apps/web/components/landing/vixan/HeroHomeOne.tsx
  - ity/apps/web/components/landing/vixan/MarqueeArea.tsx
  - ity/apps/web/components/landing/vixan/AboutSection.tsx
  - ity/apps/web/components/landing/vixan/ServiceSection.tsx
  - ity/apps/web/components/landing/vixan/PortfolioSection.tsx
  - ity/apps/web/components/landing/vixan/AwardsSection.tsx
  - ity/apps/web/components/landing/vixan/TestimonialSection.tsx
  - ity/apps/web/components/landing/vixan/FunFactSection.tsx
  - ity/apps/web/components/landing/vixan/VideoSection.tsx
  - ity/apps/web/components/landing/vixan/SubscribeSection.tsx
  - ity/apps/web/components/landing/vixan/BrandSection.tsx
  - ity/apps/web/components/landing/vixan/common/MouseMove.tsx
  - ity/apps/web/components/landing/vixan/common/ScrollToTop.tsx
  - ity/apps/web/components/landing/vixan/common/Count.tsx
  - ity/apps/web/components/landing/vixan/plugins/index.ts
  - ity/apps/web/components/landing/vixan/utils/animationTitle.ts
  - ity/apps/web/components/landing/vixan/utils/buttonAnimation.ts
  - ity/apps/web/components/landing/vixan/utils/scrollSmother.ts
  - ity/apps/web/components/landing/vixan/utils/utils.ts
  - ity/apps/web/styles/landing.scss
  - public/assets/plugins/* (GSAP plugins)
  - public/assets/sass/* (Vixan SCSS)
  - public/assets/css/plugins/* (Bootstrap, FontAwesome, Lightgallery CSS)
  - public/assets/img/* (Vixan images)
  - public/assets/fonts/* (Lightgallery fonts)
autonomous: true
requirements: []

must_haves:
  truths:
    - "Visiting / shows the Vixan-based landing page with ITY branding and content"
    - "Landing page has all 12 sections: Header, Hero slider, Marquee, About, Services, Portfolio, Awards, Testimonial, FunFact, Video, Subscribe, Brand, Footer"
    - "GSAP animations (scroll smooth, scroll trigger, split text) work on the landing page"
    - "Swiper hero slider works with slides"
    - "Dashboard at /a/* still renders correctly with Tailwind styles (no Bootstrap/SCSS leak)"
    - "Auth pages at /auth/* still render correctly with Tailwind styles"
    - "No rewrite hack in next.config.js - landing is a proper Next.js route"
  artifacts:
    - path: "ity/apps/web/app/page.tsx"
      provides: "Landing page route entry point"
    - path: "ity/apps/web/components/landing/vixan/LandingPage.tsx"
      provides: "Client-side landing page assembly"
    - path: "ity/apps/web/components/landing/vixan/Wrapper.tsx"
      provides: "GSAP plugin registration and ScrollSmoother"
    - path: "ity/apps/web/styles/landing.scss"
      provides: "Scoped landing styles entry point"
  key_links:
    - from: "app/page.tsx"
      to: "components/landing/vixan/LandingPage.tsx"
      via: "dynamic import with ssr:false or direct import"
      pattern: "import.*LandingPage"
    - from: "LandingPage.tsx"
      to: "styles/landing.scss"
      via: "import at top of client component"
      pattern: "import.*landing\\.scss"
    - from: "Wrapper.tsx"
      to: "plugins/index.ts"
      via: "GSAP plugin imports"
      pattern: "import.*plugins"
---

<objective>
Port the Vixan Digital Creative Agency Next.js template landing page into the ITY project, replacing the current static HTML landing page. Adapt all content for ITY (online school platform for creators). Keep Bootstrap/SCSS scoped to landing only so Tailwind dashboard is unaffected.

Purpose: Replace the placeholder static HTML landing with a proper, animated, professional landing page built as a real Next.js route.
Output: Working landing page at `/` with all Vixan sections adapted for ITY, GSAP animations, Swiper slider, and Bootstrap/SCSS isolated from dashboard.
</objective>

<execution_context>
@C:/Users/patri/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/patri/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@ity/apps/web/app/layout.tsx
@ity/apps/web/next.config.js
@ity/apps/web/package.json
@ity/apps/web/app/globals.css

Source template location (READ from here, adapt, write to ITY):
  C:/Users/patri/Desktop/vixan-digital-creative-agency-next-js-template-2025-10-21-14-17-03-utc/vixan-nextjs-15.5.6/

Key source directories:
  - src/components/ — All section components (hero, about, service, portfolio, etc.)
  - src/layouts/ — Wrapper.tsx, headers/HeaderOne.tsx, headers/MobileMenu.tsx, footers/FooterOne.tsx
  - src/utils/ — animationTitle.js, buttonAnimation.js, scrollSmother.js, utils.js
  - src/plugins/index.js — GSAP plugin re-exports from public/assets/plugins/
  - public/assets/sass/ — Main SCSS (style.scss + partials in common/, default/, shortcode/)
  - public/assets/css/plugins/ — bootstrap.min.css, fontawesome.min.css, lightgallery.min.css
  - public/assets/plugins/ — GSAP custom JS files (gsap.js, gsap-scroll-trigger.js, etc.)
  - public/assets/img/ — All images (122 files)
  - public/assets/fonts/ — Lightgallery fonts (lg.eot, lg.svg, lg.ttf, lg.woff)
  - src/styles/index.scss — Entry point importing swiper css, bootstrap, fontawesome, lightgallery, then main style.scss

CRITICAL SCOPING RULES:
  - Landing SCSS must NOT be imported in root layout (would break Tailwind in dashboard)
  - Import landing.scss ONLY inside the landing page client component
  - Bootstrap CSS imported via SCSS, scoped to .vixan-landing wrapper class
  - globals.css (Tailwind) stays in root layout — it already works for dashboard/auth
  - The landing page component tree is entirely 'use client' — GSAP needs browser APIs

CONTENT ADAPTATION (Vixan agency -> ITY online school platform):
  - Hero: "Digital Creative Agency" -> "Crea tu Escuela Online" / "Launch Your Online School"
  - Services: Agency services -> Platform features (Course builder, Student management, Custom branding, Analytics, Payments, AI assistant)
  - Portfolio: Agency projects -> Creator success stories / example schools
  - About: Agency story -> ITY platform story (empowering creators)
  - Testimonials: Agency clients -> Creator testimonials
  - Awards: Agency awards -> Platform stats / achievements
  - FunFact: Agency numbers -> Platform numbers (creators, students, courses, countries)
  - Subscribe: Newsletter -> "Start your free school today" CTA
  - Brand: Client logos -> Integration/partner logos or placeholder
  - Blog: Agency blog -> "Learn to teach online" / Creator resources
  - Video: Agency showreel -> ITY platform demo video
  - Header nav: Agency pages -> Home, Features, Pricing (placeholder), Login (/auth/login)
  - Footer: Agency info -> ITY info, links to /auth/login, /auth/register
  - Colors: Keep accent #ff6b00 (orange) — works well for ITY brand
  - Fonts: Keep Inter Tight + Kanit via Google Fonts link in landing component (NOT in root layout)

DEPENDENCY NOTES:
  - gsap: Already has custom plugin JS files in public/assets/plugins/ — do NOT install gsap from npm. The template uses custom bundled GSAP files.
  - swiper: Install swiper@11 from npm
  - bootstrap: Install bootstrap@5.3 from npm (for JS only — CSS is from the template's bootstrap.min.css)
  - sass: Install sass from npm (for SCSS compilation)
  - jquery: Install jquery@3.7 from npm (Wrapper uses it)
  - wowjs: Install wowjs@1.1 from npm (scroll animations)
  - react-countup: Install from npm (FunFact counter animations)
  - react-intersection-observer: Install from npm (used with CountUp)
  - @popperjs/core: Install from npm (Bootstrap dependency)
  - Do NOT install react-responsive-modal or yet-another-react-lightbox (not needed for home page)
  - Do NOT upgrade React or Next.js versions
</context>

<tasks>

<task type="auto">
  <name>Task 1: Copy Vixan assets, install dependencies, create scoped SCSS entry</name>
  <files>
    ity/apps/web/package.json
    ity/apps/web/styles/landing.scss
    public/assets/plugins/* (7 GSAP JS files)
    public/assets/sass/* (entire sass directory)
    public/assets/css/plugins/* (bootstrap.min.css, fontawesome.min.css, lightgallery.min.css)
    public/assets/img/* (copy ALL 122 images from Vixan template)
    public/assets/fonts/* (lightgallery fonts)
  </files>
  <action>
    1. Copy ALL Vixan static assets from source template to ITY public directory:
       - Copy `public/assets/plugins/` (7 GSAP JS files: gsap.js, gsap-scroll-trigger.js, gsap-scroll-smoother.js, gsap-split-text.js, gsap-scroll-to-plugin.js, charming.js, animated-headline.js)
       - Copy `public/assets/sass/` (entire directory: style.scss, common/, default/, shortcode/)
       - Copy `public/assets/css/plugins/` (bootstrap.min.css, fontawesome.min.css, lightgallery.min.css, swiper.min.css)
       - Copy `public/assets/img/` (all 122 images — overwrite existing if names clash)
       - Copy `public/assets/fonts/` (lg.eot, lg.svg, lg.ttf, lg.woff)
       
       Source base: `C:/Users/patri/Desktop/vixan-digital-creative-agency-next-js-template-2025-10-21-14-17-03-utc/vixan-nextjs-15.5.6/public/assets/`
       Target base: `C:/dev/12ity/ity/apps/web/public/assets/`

    2. Install new npm dependencies in ity/apps/web:
       ```
       cd ity/apps/web && pnpm add sass@^1.70.0 swiper@^11.0.5 bootstrap@^5.3.2 jquery@^3.7.1 wowjs@^1.1.3 react-countup@^6.5.0 react-intersection-observer@^9.7.0 @popperjs/core@^2.11.8 @types/jquery@^3.5.29
       ```
       Note: Use pnpm (monorepo). @types/jquery as regular dep since it's used at runtime in 'use client' component.

    3. Create `ity/apps/web/styles/landing.scss` — the scoped SCSS entry point for landing page:
       ```scss
       // Landing page styles — imported ONLY by LandingPage client component
       // Scoped under .vixan-landing to prevent leaking into Tailwind dashboard
       
       // Third-party CSS
       @import "swiper/css/bundle";
       @import "../../public/assets/css/plugins/bootstrap.min.css";
       @import "../../public/assets/css/plugins/fontawesome.min.css";
       @import "../../public/assets/css/plugins/lightgallery.min.css";
       
       // Vixan main styles
       .vixan-landing {
         @import "../../public/assets/sass/style.scss";
       }
       ```
       
       IMPORTANT: The `.vixan-landing` wrapper scopes ALL Vixan styles so they don't affect dashboard/auth pages. Bootstrap CSS is imported globally within this file but ONLY loaded when LandingPage component mounts.
       
       If the SCSS nesting of `@import` inside `.vixan-landing` causes compilation issues with Bootstrap's body/html selectors, use an alternative approach: import bootstrap.min.css as-is and add a PostCSS plugin or manually prefix. However, first try the nesting approach — SCSS should handle it. If it fails, fall back to importing everything flat and relying on the fact that landing.scss is only imported in the landing page client component (route-level isolation).
  </action>
  <verify>
    <automated>cd C:/dev/12ity/ity/apps/web && ls public/assets/plugins/gsap.js public/assets/sass/style.scss public/assets/css/plugins/bootstrap.min.css public/assets/img/about_img.jpg public/assets/fonts/lg.woff styles/landing.scss && pnpm list sass swiper bootstrap jquery wowjs react-countup react-intersection-observer @popperjs/core</automated>
  </verify>
  <done>All Vixan assets copied to public/assets/, new dependencies installed, landing.scss entry point created with scoped imports</done>
</task>

<task type="auto">
  <name>Task 2: Create all landing page components adapted for ITY content</name>
  <files>
    ity/apps/web/components/landing/vixan/plugins/index.ts
    ity/apps/web/components/landing/vixan/utils/animationTitle.ts
    ity/apps/web/components/landing/vixan/utils/buttonAnimation.ts
    ity/apps/web/components/landing/vixan/utils/scrollSmother.ts
    ity/apps/web/components/landing/vixan/utils/utils.ts
    ity/apps/web/components/landing/vixan/common/MouseMove.tsx
    ity/apps/web/components/landing/vixan/common/ScrollToTop.tsx
    ity/apps/web/components/landing/vixan/common/Count.tsx
    ity/apps/web/components/landing/vixan/Wrapper.tsx
    ity/apps/web/components/landing/vixan/HeaderOne.tsx
    ity/apps/web/components/landing/vixan/MobileMenu.tsx
    ity/apps/web/components/landing/vixan/FooterOne.tsx
    ity/apps/web/components/landing/vixan/HeroHomeOne.tsx
    ity/apps/web/components/landing/vixan/MarqueeArea.tsx
    ity/apps/web/components/landing/vixan/AboutSection.tsx
    ity/apps/web/components/landing/vixan/ServiceSection.tsx
    ity/apps/web/components/landing/vixan/PortfolioSection.tsx
    ity/apps/web/components/landing/vixan/AwardsSection.tsx
    ity/apps/web/components/landing/vixan/TestimonialSection.tsx
    ity/apps/web/components/landing/vixan/FunFactSection.tsx
    ity/apps/web/components/landing/vixan/VideoSection.tsx
    ity/apps/web/components/landing/vixan/SubscribeSection.tsx
    ity/apps/web/components/landing/vixan/BrandSection.tsx
    ity/apps/web/components/landing/vixan/LandingPage.tsx
  </files>
  <action>
    Port ALL components from the Vixan template into `ity/apps/web/components/landing/vixan/`. For each file:
    1. READ the original source file from `C:/Users/patri/Desktop/vixan-digital-creative-agency-next-js-template-2025-10-21-14-17-03-utc/vixan-nextjs-15.5.6/src/`
    2. Copy the component logic preserving ALL HTML structure, CSS classes, animation data attributes
    3. Convert to TypeScript (.tsx/.ts) with proper types
    4. Update import paths to use relative paths within `components/landing/vixan/`
    5. Replace content text with ITY-appropriate content (see content adaptation rules in context)
    6. Add 'use client' directive to all components (GSAP needs browser)

    ORDER OF CREATION (dependencies first):
    
    A. Plugins + Utils (no component deps):
       - `plugins/index.ts` — Re-export GSAP plugins from `/assets/plugins/`. Copy from src/plugins/index.js, change paths to use dynamic import or direct path. The GSAP files are in public/assets/plugins/ and export default. Use: `export { default as ScrollTrigger } from "../../../../public/assets/plugins/gsap-scroll-trigger.js";` etc. Mark file as 'use client'.
       - `utils/utils.ts` — Copy from src/utils/utils.js, add types
       - `utils/animationTitle.ts` — Copy from src/utils/animationTitle.js, add types
       - `utils/buttonAnimation.ts` — Copy from src/utils/buttonAnimation.js, add types  
       - `utils/scrollSmother.ts` — Copy from src/utils/scrollSmother.js, add types

    B. Common components:
       - `common/MouseMove.tsx` — Copy from src/components/common/MouseMove.tsx
       - `common/ScrollToTop.tsx` — Copy from src/components/common/ScrollToTop.tsx
       - `common/Count.tsx` — Copy from src/components/common/Count.tsx (uses react-countup + react-intersection-observer)

    C. Layout components:
       - `Wrapper.tsx` — Copy from src/layouts/Wrapper.tsx. Remove DarkLight component (not needed for ITY). Keep GSAP ScrollSmoother setup, animationCreate, animationTitle, buttonAnimation, scrollSmother calls. Keep MouseMove and ScrollToTop. Use `require("bootstrap/dist/js/bootstrap")` inside typeof window check.
       - `HeaderOne.tsx` — Copy from src/layouts/headers/HeaderOne.tsx. Replace nav links: Home (#), Features (#services), Pricing (#), Login (/auth/login). Replace logo with ITY text/logo. Replace "Let's Talk" button with "Comienza Gratis" linking to /auth/register.
       - `MobileMenu.tsx` — Copy from src/layouts/headers/MobileMenu.tsx. Same nav changes as HeaderOne.
       - `FooterOne.tsx` — Copy from src/layouts/footers/FooterOne.tsx. Replace content with ITY info, social links, copyright "ITY - I Teach You".

    D. Section components (copy each from its HomeOne variant, adapt content):
       - `HeroHomeOne.tsx` — Swiper slider. Change slides to ITY messaging: "Crea tu Escuela Online", "Monetiza tu Conocimiento", "Ensenha Sin Limites". Keep Swiper config and GSAP animations.
       - `MarqueeArea.tsx` — Scrolling text. Change to ITY features: "Cursos Online", "Marca Propia", "Pagos Directos", "Sin Comisiones", "IA Asistente".
       - `AboutSection.tsx` — About ITY platform. "Empowering creators to build their own online schools."
       - `ServiceSection.tsx` — 6 platform features: Course Builder, Student Management, Custom Branding, Analytics Dashboard, Direct Payments, AI Assistant.
       - `PortfolioSection.tsx` — Example schools / creator showcases (use placeholder images from template).
       - `AwardsSection.tsx` — Platform achievements or partner recognition.
       - `TestimonialSection.tsx` — Creator testimonials (fictional for now).
       - `FunFactSection.tsx` — Numbers: "500+ Creators", "10,000+ Students", "2,000+ Courses", "15+ Countries". Uses Count component.
       - `VideoSection.tsx` — Platform demo video section (can use placeholder).
       - `SubscribeSection.tsx` — CTA: "Comienza tu escuela hoy" with email input and link to /auth/register.
       - `BrandSection.tsx` — Integration logos or "Trusted by" section (use template images as placeholders).

    E. Main assembly:
       - `LandingPage.tsx` — 'use client' component that:
         1. Imports `@/styles/landing.scss` (SCSS loaded only here)
         2. Imports Google Fonts link via next/head or a style tag for Inter Tight + Kanit
         3. Wraps everything in `<div className="vixan-landing">` for style scoping
         4. Renders: Wrapper > HeaderOne > #smooth-wrapper > #smooth-content > main (all sections) + FooterOne
         5. Mirrors the structure from the original src/app/page.tsx exactly

    CRITICAL RULES:
    - ALL image paths must use `/assets/img/filename.ext` (public dir)
    - ALL plugin paths in plugins/index.ts must resolve correctly
    - Do NOT use Next.js Image component for landing — Vixan uses regular `<img>` tags with GSAP data attributes. Using next/image would break GSAP parallax/effects.
    - Keep ALL CSS class names exactly as in the original — they map to the SCSS styles
    - Keep ALL data-* attributes (data-speed, data-lag, etc.) — they drive GSAP animations
    - If a component uses `Link` from next/link, keep it for internal navigation (e.g., /auth/login)
    - For Swiper imports, use `import { Swiper, SwiperSlide } from 'swiper/react'` and `import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules'` (Swiper 11 API)
  </action>
  <verify>
    <automated>cd C:/dev/12ity/ity/apps/web && ls components/landing/vixan/LandingPage.tsx components/landing/vixan/Wrapper.tsx components/landing/vixan/HeaderOne.tsx components/landing/vixan/FooterOne.tsx components/landing/vixan/HeroHomeOne.tsx components/landing/vixan/plugins/index.ts components/landing/vixan/utils/utils.ts && node -e "const files = require('fs').readdirSync('components/landing/vixan'); console.log(files.length + ' files'); if(files.length < 15) process.exit(1);"</automated>
  </verify>
  <done>All 20+ landing components created in components/landing/vixan/ with ITY content, proper TypeScript types, correct import paths, and 'use client' directives</done>
</task>

<task type="auto">
  <name>Task 3: Wire app/page.tsx, remove old landing rewrite, verify build</name>
  <files>
    ity/apps/web/app/page.tsx
    ity/apps/web/next.config.js
  </files>
  <action>
    1. Create `ity/apps/web/app/page.tsx`:
       ```tsx
       import dynamic from 'next/dynamic';
       
       const LandingPage = dynamic(
         () => import('@/components/landing/vixan/LandingPage'),
         { ssr: false }
       );
       
       export default function Home() {
         return <LandingPage />;
       }
       ```
       
       Use `dynamic` with `ssr: false` because:
       - GSAP, ScrollSmoother, jQuery all need `window`/`document`
       - Prevents SSR hydration mismatches from browser-only code
       - The entire landing component tree is client-only by design
       
       This page.tsx is a Server Component that dynamically imports the client landing. No 'use client' needed here.

    2. Update `ity/apps/web/next.config.js`:
       - REMOVE the `rewrites()` function entirely (no more `/` -> `/landing.html` rewrite)
       - Keep everything else: transpilePackages, images.remotePatterns, headers (CSP for templates)
       
       Updated next.config.js:
       ```js
       /** @type {import('next').NextConfig} */
       const nextConfig = {
         transpilePackages: ['@ity/ui', '@ity/api', '@ity/db', '@ity/config'],
         images: {
           remotePatterns: [
             {
               protocol: 'https',
               hostname: '*.supabase.co',
             },
             {
               protocol: 'https',
               hostname: '*.r2.cloudflarestorage.com',
             },
           ],
         },
         async headers() {
           return [
             {
               source: '/a/landing/templates',
               headers: [
                 {
                   key: 'Content-Security-Policy',
                   value: "frame-src 'self' https://templates.12ity.com https://preview.12ity.com;",
                 },
               ],
             },
           ];
         },
       };
       
       module.exports = nextConfig;
       ```

    3. Optionally delete `ity/apps/web/public/landing.html` (the old static landing). Do NOT delete public/assets/ since we just copied Vixan assets there.

    4. Run `pnpm build` from `ity/apps/web` to verify:
       - No TypeScript errors
       - No SCSS compilation errors  
       - Landing page route `/` compiles
       - Dashboard routes `/a/*` still compile
       - Auth routes still compile
       
       If build fails due to SCSS nesting issues (Bootstrap inside .vixan-landing), fix by removing the .vixan-landing nesting wrapper from landing.scss and importing all CSS flat. The route-level isolation (only imported in LandingPage.tsx which is dynamically loaded) provides sufficient scoping.
       
       If build fails due to GSAP plugin imports (public/assets/plugins/*.js not resolving as modules), fix by:
       - Option A: Change plugins/index.ts to use `require()` instead of ES import
       - Option B: Copy the GSAP JS files into components/landing/vixan/plugins/ as local files instead of referencing public/
       
       If build fails due to TypeScript errors in ported components, add `// @ts-nocheck` at the top of problematic utility files (animationTitle.ts, buttonAnimation.ts, scrollSmother.ts, utils.ts) — these are vendor code being ported.

    5. Run `pnpm dev` and verify in browser:
       - `http://localhost:8080/` shows the landing page with animations
       - `http://localhost:8080/a/` shows the dashboard (Tailwind intact)
       - `http://localhost:8080/auth/login` shows auth page (Tailwind intact)
  </action>
  <verify>
    <automated>cd C:/dev/12ity/ity/apps/web && cat app/page.tsx | grep -q "LandingPage" && cat next.config.js | grep -qv "landing.html" && pnpm build 2>&1 | tail -20</automated>
  </verify>
  <done>Landing page renders at / as proper Next.js route, old rewrite removed, build succeeds, dashboard and auth pages unaffected by landing styles</done>
</task>

</tasks>

<verification>
1. `pnpm build` in ity/apps/web completes without errors
2. Landing page at `/` shows all 12 sections with GSAP scroll animations
3. Hero Swiper slider works with ITY-branded slides
4. Dashboard at `/a/` renders with Tailwind styles (no Bootstrap interference)
5. Auth pages at `/auth/login` render with Tailwind styles (no SCSS leak)
6. No console errors related to GSAP, ScrollSmoother, or Bootstrap
7. Mobile responsive menu works in HeaderOne
</verification>

<success_criteria>
- Visiting `/` renders the full Vixan-based landing page with ITY content
- All 12 sections visible and styled correctly
- GSAP ScrollSmoother and animations functional
- Swiper hero slider working
- Dashboard and auth pages visually unchanged
- `pnpm build` passes
- Old `landing.html` rewrite removed from next.config.js
</success_criteria>

<output>
After completion, create `.planning/quick/2-portar-landing-page-vixan-a-ity-reemplaz/2-SUMMARY.md`
</output>
