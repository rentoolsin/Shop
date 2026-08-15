# Design audit — state-color text contrast

Referenced from `tailwind.config.ts` (`state.*-text` tokens) and
`StatusBadge.tsx`. Scope: WCAG 2.1 AA contrast for the four semantic
`state` colors (success/warning/danger/info) wherever they color actual
text, not icons or dots.

## Why this exists

`state.success/warning/danger/info` were originally tuned to read well as
small solid dots and 10%-tint badge backgrounds — not as body text. WCAG
2.1 AA requires **4.5:1** for text (SC 1.4.3) but only **3:1** for
non-text UI elements like icons/dots (SC 1.4.11). Several of the base
tones fall between those two thresholds: fine as a dot, not fine as a
label.

## Measured ratios (sRGB relative-luminance formula, WCAG formula)

| Token | Color | On white (light card) | On graphite-900 `#242426` (dark card) |
|---|---|---|---|
| `state-success` (base) | `#3B8156` | 4.71:1 — passes on a plain white/card bg, but ≈3.96:1 on its own 10%-tint badge background (fails) | — |
| `state-success-text` | `#2F6B46` | 6.34:1 | — |
| `state-success-text-dark` | `#7DD0A0` | — | 8.41:1 (10.16:1 on page bg `#121214`) |
| `state-warning` (base) | `#B9862C` | 3.23:1 — fails | — |
| `state-warning-text` | `#8A5A12` | 5.91:1 | — |
| `state-warning-text-dark` | `#B9862C` | — | 4.80:1 |
| `state-danger` (base) | `#B4432F` | 5.55:1 — already passes | — |
| `state-danger-text` | `#B4432F` | 5.55:1 (same value — base already safe as text) | — |
| `state-danger-text-dark` | `#E0796A` | — | 5.25:1 |
| `state-info` (base) | `#4C6B8A` | 5.56:1 — already passes | — |
| `state-info-text` | `#4C6B8A` | 5.56:1 (same value — base already safe as text) | — |
| `state-info-text-dark` | `#8FB4D9` | — | 7.16:1 |

`danger` and `info` already cleared 4.5:1 as text in light mode, so their
`-text` values intentionally equal the base tone — only their dark-mode
pairing needed a dedicated, lighter value. `success` and `warning` needed
new, darker light-mode values as well as the dark-mode ones.

## Rule

- **Text** (error copy, form field errors, badge labels, button labels
  colored by tone, stat values): use
  `text-state-<tone>-text dark:text-state-<tone>-text-dark`.
- **Icons and dots** (e.g. the small status dot in `StatusBadge`, a
  checkmark glyph marked `aria-hidden`): keep the base `state-<tone>`
  tone — these fall under the 3:1 non-text rule and already pass, and
  the `-text` values are calibrated for text weight/size, not glyphs.

## Where this was applied

Customer-facing: `Input`, `Textarea`, `Select` (field errors),
`StatusBadge` (labels).

Admin: `CustomerPicker`, `StatCard`, `ImageInput`, `AdminMore` (sign out),
`Login`, `RentalsList` (cancel action + extend error), `RentalForm`
(customer error), `PurchaseRequestDetail`, `PurchaseRequestForm`,
`ProductForm` (remove variant), `ProductsList` (delete action),
`EnquiryDetail` (status error).

Left unchanged (icons, not text): the success checkmark glyphs on the
`Enquire` and `RequestPurchase` confirmation screens — both are
`aria-hidden="true"` and covered by the 3:1 rule already.

## Method

Ratios computed from the WCAG relative-luminance formula
(`sRGB → linear → 0.2126R + 0.7152G + 0.0722B`, contrast =
`(L1+0.05)/(L2+0.05)`), not a browser dev-tool spot check — repeatable
from the hex values in `tailwind.config.ts` if the palette changes.
