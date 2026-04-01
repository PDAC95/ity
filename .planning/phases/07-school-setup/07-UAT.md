---
status: complete
phase: 07-school-setup
source: [07-01-SUMMARY.md, 07-02-SUMMARY.md]
started: 2026-04-01T16:00:00Z
updated: 2026-04-01T16:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. School setup page loads with tabs
expected: Navega a /dashboard/school-setup. La pagina carga y muestra dos pestanas: "General" (activa por defecto) y "Marca". Se ven los campos de nombre, descripcion y slug en la pestana General.
result: pass

### 2. Edit school name with character counter
expected: Escribe en el campo de nombre. Un contador muestra los caracteres usados de 60 (ej. "15/60"). No permite escribir mas de 60 caracteres.
result: pass

### 3. Edit description with character counter
expected: Escribe en el campo de descripcion. Un contador muestra los caracteres usados de 500. No permite escribir mas de 500 caracteres.
result: pass

### 4. Slug auto-generates from name
expected: Escribe un nombre como "Mi Escuela Genial". El campo de slug se llena automaticamente con "mi-escuela-genial" (minusculas, sin espacios, sin caracteres especiales). Si editas el slug manualmente, ya no se auto-genera del nombre.
result: pass
note: Slug field only appears after school is created (has ID). User confirmed it appeared after refresh post-save. This is correct behavior per plan design.

### 5. Slug availability indicator
expected: Escribe un slug nuevo. Despues de ~400ms aparece un indicador: verde "Disponible" si nadie lo usa, rojo "Ya esta en uso" si ya existe. Si el slug es el actual de tu escuela, muestra "Tu slug actual".
result: pass

### 6. Save name and description
expected: Edita el nombre o descripcion y haz clic en Guardar. Aparece un toast verde "Cambios guardados". Al recargar la pagina, los valores guardados se mantienen.
result: pass

### 7. Save slug with conflict detection
expected: Cambia el slug a uno disponible y guardalo — toast de exito. Intenta guardar un slug que ya esta en uso por otra escuela — aparece un error inline "este slug ya esta en uso".
result: pass

### 8. Unsaved changes warning on browser close
expected: Edita un campo sin guardar e intenta cerrar la pestana del navegador. El navegador muestra un dialogo nativo preguntando si quieres salir (beforeunload).
result: pass

### 9. Tab switch with dirty form shows discard dialog
expected: Edita un campo en General sin guardar y haz clic en la pestana "Marca". Aparece un dialogo preguntando "Tienes cambios sin guardar" con opciones "Descartar" y "Quedarse". "Quedarse" te regresa, "Descartar" cambia de pestana y pierde los cambios.
result: pass

### 10. Branding tab - color pickers with swatches
expected: Haz clic en la pestana "Marca". Aparecen dos selectores de color: "Color primario" y "Color de acento". Cada uno tiene: un selector nativo de color (cuadro clickeable), un campo de texto hex (#RRGGBB), y una paleta de ~12 circulos de colores predefinidos. Haz clic en un circulo — el color se selecciona y el campo hex se actualiza.
result: pass

### 11. Live preview updates in real time
expected: Cambia un color primario o de acento. La seccion "Vista previa" debajo se actualiza inmediatamente mostrando: una barra de header con el color primario, un boton con el color de acento, y una tarjeta de ejemplo con ambos colores aplicados.
result: pass

### 12. Contrast warning for similar colors
expected: Selecciona dos colores muy similares (ej. dos tonos de azul casi iguales). Aparece una advertencia amarilla: "Los colores seleccionados pueden ser dificiles de distinguir". La advertencia NO bloquea el guardado.
result: issue
reported: "el warning aparece sin importar la dupla de colores que elija"
severity: minor

### 13. Save brand colors
expected: Cambia los colores y haz clic en Guardar. Aparece toast "Colores guardados". Al recargar la pagina, los colores guardados persisten. El boton de guardar se desactiva despues de guardar (no hay cambios pendientes).
result: pass

## Summary

total: 13
passed: 12
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Contrast warning only appears when color combination is hard to read"
  status: resolved
  reason: "User reported: el warning aparece sin importar la dupla de colores que elija"
  severity: minor
  test: 12
  root_cause: "contrastRatio threshold of 3.0 was too aggressive for comparing two accent colors — most non-black/white pairs don't reach 3.0. Lowered to 1.5 which triggers only for near-identical colors."
  artifacts:
    - path: "ity/apps/web/components/school/branding-tab.tsx"
      issue: "contrastRatio threshold too high (3.0 → 1.5)"
  missing: []
  debug_session: ""
