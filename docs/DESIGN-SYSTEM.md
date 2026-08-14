# Design System

Full tokens live in `tailwind.config.ts` — this is the rationale, not a
duplicate of the values.

## Palette

Graphite neutrals (steel/concrete grays) + one restrained accent, "signal
amber" (`#D9A441`), used sparingly (primary actions, active states, the
price tag). Chosen to evoke tool-yard equipment tags / hi-vis without
being a literal safety-yellow or a generic AI purple/blue gradient.

## Type

- Display: **Manrope** (bold weights only) — sturdy, geometric, a little
  industrial.
- Body: **Inter** — neutral, highly legible at small mobile sizes.
- Data/spec numbers (prices, sizes, quantities): **IBM Plex Mono** — gives
  rental info a "spec sheet" feel appropriate to equipment rental.

## Signature element: the spec-tag

`.spec-tag` (see `src/index.css`) is the one recurring, memorable visual
idea: a small bordered mono-numeral tag, styled after the physical rental
tags tied to real tool-yard equipment. Used for prices, variant selection,
and step numbers on the home page. Everything else stays quiet — hairline
borders instead of shadows, restrained corner radii (max 14px), no
gradients, no glassmorphism.

## Layout

Mobile canvas capped at 480px (`max-w-app`) and centered on wider
viewports rather than redesigned for desktop. Sticky bottom nav (Home /
Tools / Search / More), horizontal shelves for categories/featured tools,
bottom sheets for filters on mobile.

## Motion

Restrained: 150–220ms transitions with a sheet-like easing curve
(`ease-app`). `prefers-reduced-motion` is respected globally in
`src/index.css`.
