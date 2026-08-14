# UX Requirements — status

## Implemented in this pass

- Scroll-to-top on push navigation, scroll-position restore on back
  (`useScrollRestoration`).
- Loading / error / empty states as shared components, used consistently
  across Home, Products, CategoryDetail, Search, ProductDetail.
- Search: debounced (350ms), query preserved in URL, clear action, empty
  state, loading state.
- Category filter preserved in URL (`?category=`) on Products.
- Bottom-sheet filter pattern on mobile (Products page).
- Body scroll lock shared by Modal + BottomSheet (`useScrollLock`).
- Form validation with specific, actionable messages (see `Enquire.tsx`
  `validate()`) — never "Invalid input."
- Duplicate-submission prevention + preserved input on submit failure
  (Enquire form).
- Visible keyboard focus (`:focus-visible` global outline), `prefers-reduced-motion`
  respected globally.
- Theme: light/dark/system, persisted, no flash on load.

## Not yet implemented

- Sticky/back-to-top affordance on long pages.
- Pagination / virtualization for large product lists (currently fetches
  full filtered set).
- Accessible labels audit beyond the basics already in place (needs a
  pass with a screen reader once real content exists).
- Network-failure-specific messaging (currently generic ErrorState).
