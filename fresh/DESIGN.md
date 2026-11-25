# ShopFlo design system — direction A «هادئ»

Chosen by the owner on 25 Nov 2026 from real before/after pictures. Brand source of truth: `claude/shopflo-brand.json`
(project doc). **Read this file before any change to how the app looks.** After a change, open
Settings → Design gallery in English and Arabic, light and dark, and compare with the pictures.

## Files
| File | What it is |
|---|---|
| `src/tokens.css` | The only place where colours, sizes, radii, shadows and motion values are defined. |
| `src/design.css` | The design layer. Every rule sits under `html.ds` and uses tokens only (no raw colours). |
| `src/icons.js` | `icon('name')` (Lucide, ISC licence) and `iconize()`, which swaps an emoji in an old string for the drawn icon. |
| `src/gallery.js` | The gallery screen (`go('gallery')`, owner only): every component in every state. |
| `src/guard.js` | Slips guard: touch guard, run-once action buttons, New-car-in draft, Esc / Ctrl+S / Enter. |

Both CSS files are appended **after** `theme.py` runs, so they are not re-coloured by the old theme generator.
The old `fresh.css` is still underneath; move a component into `design.css` when you touch it, do not add to the old file.

## Rules
1. **Colour by role.** Use `--c-bg`, `--c-surface`, `--c-text`, `--c-text-muted`, `--c-border`, `--c-primary`,
   `--c-on-primary`, `--c-primary-tint`, `--c-success`, `--c-warning`, `--c-danger`. Never a hex value in a component.
   Light and dark differ only in these roles. A workshop theme (`t-shopflo`, `t-indigo`, none = red) changes only the primary roles.
2. **One primary button per screen** (`.btn`). Everything else is secondary (`.btn.sec`, `.btn.ghost`), text (`.lnk`)
   or danger (`.btn.danger`). A set of choices (pay methods, chips) is never primary.
3. **Type:** Manrope (Latin) + Tajawal (Arabic). Sizes only from `--t-1 … --t-7` (12, 14, 16, 18, 22, 28, 34).
   Nothing under 12px; Arabic nothing under 14px (`html.l-ar` raises `--t-1`). No italics, no uppercase, no letter-spacing.
   Numbers that line up use `font-variant-numeric: tabular-nums`.
4. **Spacing** from `--s-1 … --s-8` (4, 8, 12, 16, 24, 32, 48, 64). **Radius** `--r-s` 8, `--r-m` 12, `--r-full`.
5. **Touch:** every control is at least 48×48 (`--h-control`), rows 56 (`--h-row`), 8px between neighbours.
6. **Surfaces are flat:** one background colour, a 1px border, no gradients. Shadows only for things that float
   (sheet `--e-3`, message and pay bar `--e-2`).
7. **Icons:** `icon('name')` for new code. Never a new emoji in a button. An icon-only button needs `aria-label`.
8. **One top bar per screen:** `head()` (Back 48 + title + status). The brand bar shows on Home only; inner screens keep
   only the report button (`html.inner`).
9. **Paper** (invoice, sticker, customer link) is not part of this layer: workshop logo on top, a small
   «Powered by shopflo» at the bottom. ShopFlo's logo shows on the app icon and the login screen.
10. **Arabic:** words change, layout does not mirror (owner's decision). Plates, VIN and numbers stay left-to-right.

## Motion (values in `tokens.css`, used by `motion.js`)
| What | When | Property | Time | Curve | Reduced motion |
|---|---|---|---|---|---|
| Screen content | route change | first 6 blocks: 8px + opacity, 20ms apart | 200ms | ease-out | off |
| Same, going Back | Back | from above (−8px) | 200ms | ease-out | off |
| Sheet in / out | open / close | translateY 100%→0 / 0→100% | 300 / 220ms | ease-out / ease-in | off |
| Scrim | with the sheet | background colour | 200ms | linear | off |
| Small pop (chips, tags) | state change | scale .96→1 + opacity | 180ms | ease-out | off |
| Error shake | refused input | x −6, 5, −3, 0 | 280ms | ease-out | off |
| Number count-up | Home figures | text | 550ms | ease-out | off |
| Opening screen | cold start | logo fade + bar; background = the app's own light/dark colour | ~1.7s | — | skipped |

No bounce, no elastic, no `transition: all`. Animate `transform` and `opacity` only.

## Acceptance (check before saying «done»)
- Gallery looks right in EN and AR, light and dark; no emoji in any button.
- `tests/t145_guard.js` passes (double taps, run-once buttons, drafts).
- Measuring script: no text under 12px (Arabic 14px) and no control under 44px on Home, Work, Job, New car in,
  Customers, More, Stock, Money, Settings and the two job sheets.
- Cold start in light mode: the background never shows navy (after the APK that carries the new `index.html`).
- Double tap on any button that opens a sheet or a screen: nothing inside it is pressed.
