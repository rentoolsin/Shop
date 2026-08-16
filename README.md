# Rentals admin — responsive UI pass

Only two files were touched. Drop them into your repo at the same paths
(they replace the existing files 1:1) or apply `CHANGES.diff` with:

```
git apply CHANGES.diff
```

## Files

- `src/components/ui/Modal.tsx`
- `src/pages/admin/rentals/RentalsList.tsx`

## What changed and why

**Modal.tsx** (shared by ConfirmDialog, Products, and Rentals — every
caller benefits automatically):
- Added an optional `size` prop (`"sm" | "md" | "lg"`, defaults to `"sm"`
  so nothing else in the app changes behavior).
- On phones the dialog now docks to the bottom of the screen edge-to-edge
  and scrolls internally, instead of being vertically centered and able
  to get clipped under the browser chrome — this is what was cutting off
  the "Record a payment" button in your second screenshot.
- On `sm:` and up it's a normal centered dialog, capped at the chosen
  `size`, with its own scroll region once content passes ~85% of the
  viewport height — so the header and Cancel/Save buttons stay visible
  instead of the whole page scrolling.

**RentalsList.tsx**:
- The rentals page was rendering the same phone-width stacked card list
  at every screen size — on desktop that's a single narrow column with a
  lot of empty page around it, which is what your first screenshot
  shows. Added a proper dense table for `md:` and up (same
  `Table`/`TableRow` components already used on the Customers and
  Purchase Requests admin pages, so it now matches the rest of the app),
  while the card list stays for mobile/tablet.
- The "Edit rental" and "Extend rental" dialogs now open at `size="md"`,
  and "Rental details" (the one with payment history + the record-payment
  form) opens at `size="lg"` — on desktop the details dialog now lays the
  info panel and totals side by side, and the payment form spreads its
  fields across 4 columns instead of stacking, using the extra width
  instead of just stretching the phone layout taller.

No behavior, data-fetching, or business logic was touched — this is
layout/markup only. `tsc --noEmit` and `npm run build` both pass clean
against the full repo with these changes applied.
