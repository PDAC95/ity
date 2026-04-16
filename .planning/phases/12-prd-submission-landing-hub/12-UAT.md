---
status: complete
phase: 12-prd-submission-landing-hub
source: [12-01-SUMMARY.md, 12-02-SUMMARY.md, 12-03-SUMMARY.md]
started: 2026-04-16T14:30:00Z
updated: 2026-04-16T20:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Landing Hub — Estado vacío con CTA
expected: Al navegar a /a/landing sin haber enviado ninguna solicitud, se muestra un estado vacío con ícono de Globe y un botón CTA que lleva a /a/landing/templates.
result: issue
reported: "si aparece pero teniendo el idioma de ingles seleccionado muestra el texto en español"
severity: major

### 2. Sidebar apunta al Landing Hub
expected: En el sidebar del dashboard, el enlace "Mi Página Web" lleva a /a/landing (el hub), no directamente a /a/landing/templates.
result: pass

### 3. Flujo de chat — Detección de [PRD_READY] y generación de PRD
expected: Al completar la conversación con el ChatWizard (confirmando las 5 secciones del PRD), el asistente emite un mensaje con el marcador [PRD_READY]. Automáticamente se inicia la generación del PRD — el marcador NO se muestra visible en el mensaje.
result: pass

### 4. Tarjeta de resumen del PRD
expected: Tras la generación exitosa del PRD, aparece una tarjeta de resumen mostrando las secciones agrupadas: Información básica, Identidad visual (con muestras de color hex), Sobre ti, Hero, y Secciones opcionales. Tiene botones "Quiero cambiar algo" y "Confirmar y enviar".
result: pass

### 5. Confirmación del PRD — Tarjeta de éxito
expected: Al hacer clic en "Confirmar y enviar" en la tarjeta de resumen, se procesa la confirmación y aparece una tarjeta de éxito con ícono verde de check, mensaje "¡Listo! Estamos trabajando en tu página web", y un enlace que lleva a /a/landing.
result: pass

### 6. Input oculto durante flujo PRD
expected: Mientras el flujo de PRD está activo (generando, mostrando resumen, confirmando), el área de input del chat está oculta — el usuario no puede escribir mensajes adicionales.
result: pass

### 7. Landing Hub — Estado "En proceso"
expected: Después de confirmar el PRD, al navegar a /a/landing se muestra una tarjeta "En proceso" con badge de estado, nombre de la escuela, nombre del template, fecha de envío, y mensaje de estado.
result: pass

### 8. Guard de redirección en página de chat
expected: Si ya existe una solicitud pendiente o en progreso, al intentar navegar a /a/landing/chat se redirige automáticamente a /a/landing (el hub).
result: pass

### 9. Tarjeta de error con reintentos
expected: Si la generación del PRD falla, aparece una tarjeta de error con ícono de advertencia ámbar y un botón de reintento. Se permiten hasta 3 reintentos manuales. Después del máximo, muestra mensaje "intenta más tarde" con enlace al dashboard.
result: pass

## Summary

total: 9
passed: 8
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Landing Hub empty state should display text in the user's selected language (English when EN is selected)"
  status: failed
  reason: "User reported: si aparece pero teniendo el idioma de ingles seleccionado muestra el texto en español"
  severity: major
  test: 1
  artifacts: []
  missing: []
