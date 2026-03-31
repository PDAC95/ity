# Feature Research

**Domain:** Creator Dashboard + School Setup
**Researched:** 2026-03-31
**Confidence:** MEDIUM-HIGH (competitor features verified via official help centers + review sites; implementation patterns from Supabase/Next.js official docs and community sources)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features every online school platform ships. Their absence makes a product feel incomplete before a creator invests time.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| School name | Identity foundation; appears on landing pages, student emails, browser title | Low | Short text, 3–80 chars, required before anything else |
| School logo upload | Visual identity; appears on nav, landing page, emails; all four major platforms include it | Med | Requires Supabase Storage bucket + signed-URL pattern (tRPC cannot handle multipart directly) |
| Favicon upload | Browser tab identity; every platform includes it | Low | Same upload flow as logo; 32x32 / 64x64 PNG |
| Brand color selection | Used by student-facing pages; white-label requires creator's palette | Low | Hex input + color picker; store primary color at minimum, accent optional |
| School description / tagline | Landing page copy; also used as meta description in v1.2 | Low | Plain text; 20–300 chars recommended |
| School slug | Core URL identity: `yourschool.12ity.com` or `/s/yourschool`; expected on every SaaS LMS | Med | Requires uniqueness DB check, real-time availability feedback, reserved-word blocklist, regex `[a-z0-9-]+`, change warning |
| Creator display name | Student-facing; name shown on courses, landing page, instructor bio | Low | Different from Supabase auth email/name |
| Creator avatar / photo | Instructor bio card, course cards, student dashboard; present on all platforms | Low | Same Supabase Storage signed-URL pattern as logo |
| Creator bio | About section on landing page; students see this | Low | Plain text or minimal rich text; 500–1000 char limit is standard |
| Dashboard layout — sidebar navigation | The organizational spine of admin experience; all four major platforms use fixed sidebar | Med | Sections: Home, School, Profile, Courses (placeholder), Students (placeholder), Analytics (placeholder) |
| Dashboard home / overview screen | Entry point after login; "what to do next" orientation for first-time creators | Low-Med | Empty state with onboarding checklist is the standard pattern; avoid blank metric cards |
| Settings save confirmation | Form UX expectation — user must know changes persisted | Low | Toast/snackbar on success; inline error on failure |

### Differentiators (Competitive Advantage)

Features not universally present but meaningfully improve creator experience or retention.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Real-time slug availability check | Prevents submit-fail loop; surfaces conflict as creator types | Low-Med | Debounced tRPC query (300ms); spinner → green checkmark / red warning indicator |
| Slug auto-suggestion from school name | Lowers friction; creator doesn't have to invent a slug | Low | Client-side: strip accents, lowercase, replace spaces with hyphens, truncate to 40 chars |
| Brand color preview in dashboard | Creator sees their color applied before saving | Low-Med | CSS custom properties on a live preview component in the settings panel |
| Onboarding progress checklist | Reduces time-to-value; Kajabi uses a wizard, Thinkific uses step-by-step checklist | Med | Checklist items: name school → upload logo → set colors → complete profile; stored as completed flags in DB |
| Unsaved-changes guard | Prevents accidental navigation away mid-edit | Low | `useBeforeUnload` + router event guard; standard for any multi-field admin form |
| Creator timezone setting | Relevant when live classes are added in v1.3; capturing early avoids a later migration | Low | Select from IANA timezone list; store on creator record |
| Social links on creator profile | YouTube, Instagram, LinkedIn, website URL — used on landing pages in v1.2 | Low | Array of `{platform, url}` pairs; URL format validation; max 5 links |
| School category / niche tag | Future discoverability if a marketplace or directory is added | Low | Dropdown with 12ity-defined taxonomy (fitness, coding, music, business, etc.) |

### Anti-Features (Commonly Requested, Often Problematic)

Features creators ask for that introduce disproportionate complexity or backfire.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Slug change after school is live | Breaks student bookmarks, landing page URLs, external links; Teachable discourages this by making changes require support contact | Show a permanent-change warning modal if school has students; add redirect logic before allowing slug changes in v1.4 |
| Full white-label email domain (v1.1) | Requires Resend/SendGrid + DNS setup; current email provider is Supabase built-in | Defer to AUTH-V2-03; show "Coming Soon" in Settings → Emails |
| Custom domain connection in school setup (v1.1) | DNS + SSL provisioning is an async multi-step workflow; implementing it mid-dashboard causes scope creep | Add a locked "Domain" placeholder in sidebar nav with "Coming in a future update" message; implement in v1.4 |
| Public school directory / discovery | Contradicts the white-label promise — creators don't want students finding competing schools on the same platform | Omit entirely; each school is isolated behind its own URL |
| Onboarding wizard that blocks dashboard access | Forced linear completion before exploring the dashboard increases abandonment; Thinkific learned this and added a dismissable checklist instead | Use a dismissable progress checklist widget on the dashboard home screen |
| Advanced permissions / team roles (v1.1) | Admins, authors, affiliates add user-role auth complexity; Kajabi took years to build this | Add "Team" to sidebar as a locked placeholder; implement in v1.4 |
| Logo crop / image editor in-product | Significant UI complexity; creators have Canva | Accept upload as-is; document recommended dimensions (e.g., 400x400 PNG, under 2MB); add crop in v1.3 if requested |
| Multiple logos / dark-mode logo variant | Premature generalization; 80%+ of creators won't use it | Single logo upload; revisit in v1.4 |
| Inline color palette generator / AI color suggestions | Adds scope; creator can use Canva or Huemint externally | Simple hex input + browser color picker via `<input type="color">` is sufficient |

---

## Feature Dependencies

```
Auth (v1.0 complete)
  └── Creator record exists in DB (idempotent upsert on login)
        ├── School Setup (new in v1.1)
        │     ├── school.name (required)
        │     ├── school.slug (unique, validated — required for v1.2 routing)
        │     ├── school.description
        │     ├── school.primaryColor + accentColor
        │     ├── school.logoUrl → Supabase Storage (new infrastructure dependency)
        │     └── school.faviconUrl → Supabase Storage
        │
        └── Creator Profile (new in v1.1)
              ├── creator.displayName
              ├── creator.bio
              ├── creator.avatarUrl → Supabase Storage
              ├── creator.timezone (optional, captures early for v1.3 live classes)
              └── creator.socialLinks (optional array; used by v1.2 landing page)

Dashboard Layout (new in v1.1)
  ├── Requires: authenticated creator session (v1.0 complete)
  ├── Requires: creator record to exist (v1.0 provisioning complete)
  └── Placeholder nav items for: Courses, Students, Analytics, Team, Domain (v1.2–v1.4)

school.slug
  └── Consumed by: v1.2 public landing page URL routing
  └── Consumed by: v1.4 custom domain mapping
  └── Must be captured before v1.2 ships

Supabase Storage (new in v1.1)
  ├── Required by: logo upload, favicon upload, creator avatar
  ├── Buckets: school-assets, creator-assets (or single platform-assets with path prefixes)
  ├── Access pattern: signed upload URL from tRPC → client uploads directly to Supabase
  └── RLS: creator can only write to their own school/profile paths
```

---

## MVP Definition

### Launch With (v1.1)

Priority is the dashboard skeleton and the school + profile data model fully populated. Future milestones depend on slug and branding being set.

1. **Dashboard layout** — Fixed left sidebar with icons + labels; collapsible on mobile. Active route highlighted. Sections: Home, School Setup, My Profile. Locked placeholders (with "Coming Soon" label or lock icon): Courses, Students, Analytics, Team, Domain.

2. **Dashboard home screen** — Post-login landing with onboarding checklist (name school, upload logo, set colors, complete profile). Each checklist item links to the relevant settings section. Checklist is dismissable once all items are complete. Do not show empty metric cards — save these for when real data exists.

3. **School setup form** — Name, description, slug (with real-time availability check + auto-suggestion from name), primary color (hex picker), accent color (optional), logo upload, favicon upload. Save button with toast confirmation. Unsaved-changes guard.

4. **Creator profile form** — Display name, bio, avatar upload. Timezone field (optional but recommended to capture now). Social links deferred to v1.2 unless very low effort to add.

5. **Supabase Storage integration** — Bucket setup for uploads; signed-URL generation via tRPC mutation; client-side direct upload to Supabase; RLS policies scoped to creator ownership.

6. **Unsaved-changes guard** — Applied on both School Setup and Creator Profile forms.

### Add After Validation (v1.2+)

| Feature | Target Milestone | Reason to Defer |
|---------|-----------------|-----------------|
| Social links on creator profile | v1.2 | Used by landing page; premature before landing page exists |
| Brand color preview widget | v1.2 | Nice-to-have; landing page is where colors actually render |
| Custom domain settings UI | v1.4 | Requires async DNS/SSL provisioning infrastructure |
| Team member management | v1.4 | Multi-user roles add significant auth complexity |
| Slug redirect on change | v1.4 | No live URLs until landing page (v1.2) exists to break |
| Logo crop tool | v1.3+ | Low priority; document recommended dimensions |
| Dark-mode logo variant | v1.4+ | Premature generalization |
| School category / niche tag | v1.2 | Only useful when a discovery or marketplace feature exists |
| Creator booking / calendar link | v1.3+ | Relevant for live classes milestone |

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Ship in v1.1? |
|---------|-----------|---------------------|---------------|
| Dashboard sidebar layout | Critical | Medium | YES |
| School name + slug | Critical | Medium | YES |
| Logo + favicon upload | High | Medium (Storage setup) | YES |
| Brand colors (primary) | High | Low | YES |
| Creator display name + bio | High | Low | YES |
| Creator avatar upload | High | Low (reuses Storage) | YES |
| Dashboard home / checklist | Medium | Low-Med | YES |
| Unsaved-changes guard | Medium | Low | YES |
| Real-time slug availability | Medium | Low | YES |
| Slug auto-suggestion | Medium | Low | YES |
| Creator timezone | Low-Med | Low | OPTIONAL |
| Social links on profile | Low (for v1.1) | Low | DEFER to v1.2 |
| Brand color preview | Medium | Medium | DEFER to v1.2 |
| Custom domain UI | High (eventually) | High | NO — placeholder only |
| Team management | High (eventually) | High | NO — placeholder only |

---

## Competitor Feature Analysis

### Teachable

- **Navigation:** Admin sidebar with Dashboard, Products, Users, Site, Sales, Emails. Flat hierarchy, icon + label.
- **School setup:** Logo, favicon, font, colors, navigation bar + footer links. Theme selector. School name field.
- **Creator profile:** Author bio and profile photo; appears on course landing pages as the instructor card.
- **Slug / URL:** School URL is set at account creation (e.g., `yourname.teachable.com`); changes require contacting support — effectively immutable post-creation.
- **Onboarding:** Step-by-step guided setup; help guides embedded for each function.
- **White-label:** "Powered by Teachable" toggle on paid plans.
- **Key takeaway for 12ity:** Teachable's slug being immutable is a design signal — changes cause serious link-rot. Build in strong warnings and consider locking after first student joins.

### Thinkific

- **Navigation:** Admin Dashboard with Site Pages, Course Builder, Site Settings, Student Progress, Orders, Integrations in sidebar.
- **School setup:** Site Settings → Branding (logo, colors, fonts, custom CSS). Domain is a separate section.
- **Creator profile:** Instructor profile with photo and bio; visible on course pages.
- **Onboarding:** Dismissable step-by-step checklist on dashboard home; short intro video. More guidance wanted by new users per reviews.
- **2026 changes:** Learner Hub (new student dashboard) for accounts created after January 2026; new course builder in beta.
- **Key takeaway for 12ity:** Clean separation of "Site Settings" (branding) from "Domain" (infrastructure) is the right mental model. Replicating this avoids branding settings becoming tangled with DNS complexity.

### Kajabi

- **Navigation:** Sidebar with Dashboard, Products, Website, People, Marketing, Sales, Settings. Slightly deeper hierarchy.
- **School setup:** Settings → Site Details covers logo, favicon, colors, page scripts. Domain is a separate Settings sub-section.
- **Creator profile:** Profile with bio and photo; visible on landing pages.
- **Onboarding:** Best-in-class wizard at signup that explains each feature contextually; option to book a 1:1 onboarding call; self-serve Kajabi University resources.
- **White-label:** Custom domain (all plans), "Powered by Kajabi" toggle, branded mobile app ($199/mo premium add-on), partial email white-labeling.
- **Key takeaway for 12ity:** Kajabi's onboarding wizard is the gold standard for time-to-value. Even a lightweight checklist that mimics its structure delivers similar benefit. The branded mobile app is a premium monetization vector — not a v1 concern.

### Podia

- **Navigation:** Sidebar with Dashboard, Products, Storefront, Messages, Settings. Minimal and clean.
- **School setup:** Storefront editor for visual layout; Settings for account details, payments, integrations.
- **Creator profile:** Account name, bio, photo within Settings.
- **Onboarding:** Tour walkthrough; setup checklist for store and first product.
- **Key takeaway for 12ity:** Podia is the reference for avoiding settings sprawl. Its restraint is a competitive advantage for creators who find Kajabi overwhelming. Keep v1.1 settings minimal and expand incrementally.

### Cross-Platform Patterns

1. Fixed left sidebar navigation is universal across all four — no platform uses top-nav-only for the admin area.
2. School branding (logo, colors, name) is always a dedicated settings section, never buried in a general account page.
3. Creator / instructor profile is always separate from school settings — they are distinct data objects.
4. Custom domain is always its own section with a distinct setup flow, never embedded in branding settings.
5. Onboarding checklists (dismissable, not mandatory) are the dominant pattern; mandatory wizards that block access to the dashboard are associated with higher abandonment.
6. Empty states with explicit CTAs are expected on first login; blank metric cards are a common anti-pattern.
7. "Powered by [platform]" removal is universally a paid-tier toggle — consistent model for 12ity's monetization path.

---

## Sources

- Teachable Help — Settings: https://support.teachable.com/en/articles/11682403-settings
- Teachable Help — Get Started with Your School: https://support.teachable.com/en/articles/11682396-get-started-with-your-school
- Teachable Review 2026 (Khajabi): https://www.khajabi.com/blog/teachable-review/
- Thinkific Features Breakdown 2026 (SchoolMaker): https://www.schoolmaker.com/blog/thinkific-features
- Thinkific Review 2026 (Learning Revolution): https://www.learningrevolution.net/thinkific-review/
- Thinkific New Course Builder (official): https://support.thinkific.com/hc/en-us/articles/37547732533655-Introducing-Thinkific-s-New-Course-Builder
- Kajabi White Label 2026 (Course Platform Review): https://www.courseplatformsreview.com/blog/kajabi-white-label/
- Kajabi — Customize Site Brand Settings (official): https://help.kajabi.com/hc/en-us/articles/360037850453-How-to-Customize-Site-Brand-Settings
- Kajabi vs Teachable 2026 (Zapier): https://zapier.com/blog/kajabi-vs-teachable/
- Teachable vs Thinkific vs Kajabi (SchoolMaker): https://www.schoolmaker.com/blog/teachable-vs-thinkific-vs-kajabi
- Podia Dashboard Navigation (official): https://help.podia.com/en/articles/11370401-navigating-the-podia-dashboard
- Podia Review 2026 (Course Platform Review): https://www.courseplatformsreview.com/tools/podia/
- As-You-Type Slug Uniqueness Validation: https://lethain.com/as-you-type-slug-uniqueness-validation/
- White Label LMS Full Guide 2026 (Docebo): https://www.docebo.com/learning-network/blog/white-label-lms/
- Brand and White-Label Your LMS (LearnUpon): https://www.learnupon.com/blog/brand-white-label-lms/
- Empty State UX — Eleken: https://www.eleken.co/blog-posts/empty-state-ux
- Empty State Design — Nielsen Norman Group: https://www.nngroup.com/articles/empty-state-interface-design/
- File Upload with Next.js and Supabase (supalaunch): https://supalaunch.com/blog/file-upload-nextjs-supabase
- Signed URL uploads with Next.js and Supabase (Medium): https://medium.com/@olliedoesdev/signed-url-file-uploads-with-nextjs-and-supabase-74ba91b65fe0
- FreshLearn Custom Branding features: https://freshlearn.com/features/custom-branding
- Why Most SaaS Dashboards Fail in UX (Medium 2026): https://medium.com/@SagarNavnath8/why-most-saas-dashboards-fail-in-ux-and-how-to-fix-them-0273f14c41f7
