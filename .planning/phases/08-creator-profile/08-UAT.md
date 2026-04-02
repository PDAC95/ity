---
status: complete
phase: 08-creator-profile
source: [08-01-SUMMARY.md]
started: 2026-04-02T10:00:00Z
updated: 2026-04-02T10:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Profile page loads with creator data
expected: Navigate to /dashboard/profile. The page loads showing a two-column layout (form left, preview right on desktop). Your current display name and email should be pre-filled in the form fields. Avatar shows your photo or initials fallback.
result: pass

### 2. Edit display name and bio with character counters
expected: Edit the display name field — a character counter shows "{length}/50" and updates as you type. Edit the bio textarea — counter shows "{length}/500". Both fields accept input normally.
result: pass

### 3. Contact email validation
expected: The contact email field accepts a valid email. If you type an invalid email (e.g., "notanemail") and try to save, you see an inline validation error "Email invalido". A valid email clears the error.
result: pass

### 4. Social links with URL prefixes
expected: The social links section shows 6 inputs (Instagram, X, YouTube, TikTok, LinkedIn, Facebook). Each has a visual URL prefix (e.g., "instagram.com/", "x.com/"). You can type usernames into each field.
result: pass

### 5. Live preview updates on keystroke
expected: As you type in the name, bio, or social links fields, the preview panel on the right updates in real time. The preview shows a profile card with avatar, name, bio, and social media icons (only for filled networks). There's a toggle between "Perfil publico" and "Header escuela" modes.
result: pass

### 6. Avatar upload with circular crop
expected: Click on the avatar area. A file picker opens. Select an image (JPG/PNG/WebP). A crop modal appears with a circular crop area and a zoom slider. Click "Recortar y subir" — the avatar updates with your cropped photo.
result: pass

### 7. Delete avatar reverts to initials
expected: When you have a photo avatar, an "Eliminar foto" button appears below it. Clicking it removes the photo and shows your initials as fallback.
result: pass

### 8. Save persists data on reload
expected: Make changes to name, bio, contact email, and at least one social link. Click "Guardar cambios". A success toast appears ("Perfil actualizado"). Reload the page — all saved values persist.
result: pass

### 9. Unsaved changes guard
expected: Edit any field without saving. Try to close the browser tab — a native beforeunload warning appears asking if you want to leave. Cancel the close to stay on the page.
result: issue
reported: "Preview shows 'Tu nombre' as placeholder instead of the actual name from the form"
severity: cosmetic

## Summary

total: 9
passed: 8
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Live preview shows actual form name, not placeholder"
  status: failed
  reason: "User reported: Preview shows 'Tu nombre' as placeholder instead of the actual name from the form"
  severity: cosmetic
  test: 9
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
