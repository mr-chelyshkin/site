# Styles

`main.scss` loads the cascade layers declared in `_layers.scss`:

1. `generic/` — reset (including the list reset and the focus ring) and document
   defaults: the wall itself, mono body type, smooth anchor scrolling and text
   selection.
2. `elements/` — bare element defaults: uppercase display headings, and links
   and buttons that take the ink and type around them.
3. `objects/` — layout without cosmetics: the app shell and `.o-wall`, the
   column the collage is composed in.
4. `components/` — the wall objects and the chrome.
5. `sections/` — what makes each homepage section different, including the parts
   only one section uses.
6. `utilities/` — cross-cutting behavior that has to win over a section:
   paste-in and visually hidden text.

Each layer exposes its partials through `_index.scss`. `settings/` holds Sass
values; `themes/_site.scss` turns them into the custom properties the layers
read. `tools/` holds mixins and textures and emits no CSS of its own.

Vue files own markup and behavior, and pass per-object values such as a tilt as
inline custom properties. Selectors and media queries live here. The page is a
concrete wall with paper pasted to it: a hero, three numbered sections, a
contact section and the chrome.

## Naming

One partial per block, named after it. The prefix says which layer a class
belongs to:

| Prefix  | Layer        | Example                                  |
| ------- | ------------ | ---------------------------------------- |
| `o-`    | `objects`    | `.o-wall` in `objects/_wall.scss`        |
| `c-`    | `components` | `.c-sheet` — a wall object               |
| `site-` | `components` | `.site-header` — the chrome              |
| none    | `sections`   | `.commerce`, `.stack`, `.pass`, `.flyer` |
| `u-`    | `utilities`  | `.u-paste`, `.u-visually-hidden`         |

A part that only one section uses is a section block too, with its partial in
`sections/`: `.stack` (`ExplodedStack`), `.pass` (`AccessPass`) and `.flyer`
(`ProjectFlyer`).

Blocks follow BEM: `block__element`, `block--modifier`. A state such as a torn
tab or a lit plate is a modifier (`.c-tear-tabs__tab--torn`,
`.stack__plate--active`), never an element. Past `elements/`, selectors use
classes rather than tag names: a variant is a modifier.

## Settings, tokens and tools

`settings/` holds Sass values: the palette and type, which `themes/_site.scss`
turns into custom properties, and the breakpoints. Components and sections read
the custom properties, never the settings. Breakpoints are the exception: media
queries cannot read custom properties, so they stay Sass values, used through
the mixins below. The textures in `tools/_noise.scss` are Sass values too.

`themes/_site.scss` groups the tokens:

- Type: `--font-display`, `--font-stencil`, `--font-mono` and `--font-serif`;
  `--text-size-md`, `--text-size-sm` and `--text-size-xsm`.
- Motion: `--motion-fast` and `--motion-base`, both `0ms` under
  `prefers-reduced-motion: reduce`; `--ease-settle`, quick to move and slow to
  come to rest, for paper settling and a pass taken in hand.
- Palette: the `--color-` tokens below.
- Wall geometry: `--wall-max`, the width the collage is composed for;
  `--wall-gutter`, the column's side padding; `--wall-gap`, the gap in the
  collage grids; and `--section-space` above each section.
- `--tilt-scale`: the share of its tilt an object keeps, 1 by default and 0.45
  below `md`. The tilts of sheets, labels, passes and the footer tape are
  multiplied by it, so a phone shows the same collage, straighter, rather than
  objects moved around.

`tools/_mixins.scss` holds:

- `below($name)` — wraps a block in a `max-width` query just under a breakpoint,
  so the breakpoint's own width gets the wider layout: 768px is a tablet.
- `qr-shown` — where a QR sticker shows: a pointer that hovers, from `md` up. The
  sticker and the room a flyer keeps for it both use it, so they can't disagree.
- `focus-ring` — the shared outline, applied to every `:focus-visible` element
  by the reset.
- `spray-mask` — paint through a stencil: masks an element with `$spray-mask`.

`settings/_breakpoints.scss` names three widths: `md` 48rem (768px), `xl` 75rem
(1200px) and `xxl` 87.5rem (1400px). `md` and `xl` divide phone, tablet and
desktop; `xxl` only decides where six passes fit on one cable.

## Palette and type

The wall is near-black concrete; everything on it is paper, ink or cold cyan.
There are no warm colors and no brand colors.

| Token                 | Use                                                  |
| --------------------- | ---------------------------------------------------- |
| `--color-wall`        | the wall                                             |
| `--color-wall-text`   | text printed on the wall                             |
| `--color-paper`       | paper stock, sprayed paint, light text on ink        |
| `--color-paper-white` | white and grid stock, passes, the QR sticker         |
| `--color-ink`         | text on paper, ink stock, labels and the footer tape |
| `--color-ink-soft`    | secondary text on paper                              |
| `--color-stock-cyan`  | cyan stock, the statement's marker highlight         |
| `--color-cyan`        | the accent: an active plate's front, its number      |
| `--color-cyan-deep`   | an active plate's outline and leader line            |
| `--color-cyan-pale`   | an active plate's top face, text selection           |
| `--color-steel`       | the cable, hooks and pass clips                      |
| `--color-tape`        | translucent tape                                     |

The values are in `settings/_colors.scss`.

Four typefaces, each with one job:

- Big Shoulders Display (800, 900), `--font-display` — names and headlines;
  headings default to it, at 900 and uppercase.
- Big Shoulders Stencil Display (900), `--font-stencil` — sprayed words and
  numerals, the hero's discipline, the contact address and a marked word in the
  statement.
- Chivo Mono (400, 600, 800), `--font-mono` — body copy, kickers, labels and
  facts.
- Old Standard TT italic, `--font-serif` — the drawing's figure caption only.

All four load from Google Fonts with `display=swap`; `index.html` and
`public/404.html` link the same stylesheet. The display stacks fall back to
condensed system faces, but not width-matched ones, so a slow or blocked font
reflows the sprayed names.

## Textures

`tools/_noise.scss` holds three textures, SVG noise written into `data:` URIs
(inside them `%` is `%25` and `#` is `%23`):

- `$wall-grain` — gray specks at half opacity, for the concrete. The body
  overlays it (`background-blend-mode: overlay`) on a few patches of light and
  shade, so it adds texture without lifting the wall's tone. The patches are
  sized in `vw`, so they stay patches on a tall, narrow page.
- `$paper-grain` — sparse dark specks over a sheet's stock; tear-off tabs and
  passes carry it too.
- `$spray-mask` — mostly opaque with grainy holes, the mask `spray-mask` puts on
  sprayed paint.

The site's CSP in `tf/cloudfront.tf` has `img-src 'self' data:`, and the `data:`
is load-bearing. Every grain, the spray mask and the statement's hand-drawn
underline are `data:` URIs, and Vite inlines the smallest images (the pass photo
and the QR codes) the same way. Without it the textures go, the pass photos and
QR stickers break, and the sprayed numerals and names vanish: a mask image that
fails to load hides everything it masks.

## Wall objects

Each wall object is a Vue component in `src/components/ui/` with one partial in
`components/`. They take everything through props and know nothing of the
site's content. A section's placement class (`.flyer__qr`, `.contact__tabs`)
positions and sizes an object; the object's own partial owns the rest.

- `PastedSheet`, `.c-sheet` — paper pasted to the wall: a stock (`paper`,
  `white`, `cyan`, `ink`, or `grid` for millimeter paper), torn edges, tape at
  `top-left`, `top` or `top-right`, a tilt and a place in the paste-in order.
  Its `seed` keeps the outline and the tape the same on every load.
- `SprayText`, `.c-spray` — words sprayed through a stencil, in the `stencil` or
  `display` face; `tear` repeats a band of the paint shifted sideways. Callers
  set its size and put `aria-hidden` on it, carrying the meaning in real text.
- `WallLabel`, `.c-label` — embossed label-maker tape: a link when it has
  `href`, otherwise a decorative tag.
- `BarCode`, `.c-barcode` — decorative bars from a seed, stretched to fill
  whatever box the caller gives it.
- `QrSticker`, `.c-qr` — a printed code from `assets/qr/` and its label, shown
  only where `qr-shown` applies: something for a phone to scan, and a link for a
  mouse. It stays out of the tab order and the accessibility tree, as the flyer
  prints the same link.
- `TearTabs`, `.c-tear-tabs` — the address on vertical tabs. A tab copies it,
  announces the copy politely and tears off; without clipboard access it opens
  the mail client. Only the first intact tab is focusable, and the last one
  copies but never tears, so the address stays on the wall.
- `DitherPhoto`, `.c-dither` — a 1-bit render scaled up without smoothing, with
  bands where the cyan copy slips sideways and one smeared row; `priority` loads
  it first, for the hero.
- `WallSection`, `.c-wall-section` — a stretch of the wall: the `<section>` with
  its anchor, the big faint sprayed number (`numeralAt` puts it left or right)
  and the paste-in of its sheets. Its slot receives `titleId` for the heading
  that names the section.
- `.c-kicker` is a class, not a component: the header row of a sheet, small caps
  pushed to its two ends; a half that doesn't fit wraps whole.

`PastedSheet` has three slots. The default slot is the paper, clipped to its
torn outline. `foot` hangs from the bottom edge outside the clip, for tear-off
tabs: a missing tab leaves a gap to the wall and a torn one falls past the edge.
A sheet with a foot keeps its bottom edge untorn, as the tabs hang from it.
`over` holds things stuck on top, also outside the clip, such as a QR sticker.
The wrapper carries the tilt and a `drop-shadow` that follows the torn outline.
The stock modifiers set `--sheet-stock` and `--sheet-ink`, which the tabs in the
foot read to cut themselves from the same stock.

Buttons start bare (`elements/_buttons.scss`): no border, background or font of
their own. A component that uses one draws the whole control.

## Sections

A section partial contains only what makes that section different:

- `_hero.scss` — the dithered poster on ink stock, the first name sprayed beside
  it with two labels, the notice on cyan stock with tear-off tabs, and the
  surname sprayed across the poster's lower edge. The notice runs down into a
  flexible last row, so longer copy never pushes the surname off the poster. The
  hero isolates its stacking order. Its `h1` is visually hidden, as the sprayed
  names are decorative.
- `_practice.scss` — the drawing sheet on millimeter paper: the kicker naming
  the section, the statement with its marked words, the exploded stack, the
  figure caption and the title block, plus two labels on the wall. Its three
  layouts are under [Responsive](#responsive).
- `_stack.scss` — `ExplodedStack`: an isometric drawing of three plates, one per
  layer, and their numbered callouts.
- `_commerce.scss` — the sprayed heading and the cable the passes hang from.
  Each grid cell draws its own stretch of cable and a hook, so the cable follows
  the grid at any number of columns.
- `_pass.scss` — `AccessPass`: a visitor's pass with the dithered face, the
  company, unit, role, one line of what was built and a barcode. Each pass hangs
  at its own seeded angle and drop (`--tilt`, `--drop`) and pivots on its hook.
  Passes are focusable, so a keyboard can take one in hand.
- `_open-source.scss` — the sprayed heading and the board, which places the
  first three flyers at different widths and heights; any further flyer takes a
  third of the board, or half below `xl`.
- `_flyer.scss` — `ProjectFlyer`: a project on its own stock. The name fills the
  sheet on one line: the component adds up the face's measured character widths
  into `--fit`, and the name's size is `--fit` times the flyer's width, up to a
  cap. Paper flyers carry a vertical barcode; where the QR sticker shows, the
  flyer keeps room for it.
- `_contact.scss` — the last notice: the headline, the address in stencil and
  tear-off tabs; a hint pointing up at the tabs; the photo booth strip, four
  frames cropped from the poster render, one a cold negative; and the profile
  labels.

## Motion and interaction

Transitions take their durations from `--motion-fast` and `--motion-base`. Both
drop to `0ms` under `prefers-reduced-motion: reduce`, so a transition needs no
reduced-motion rule of its own. Animations, and moves that would still jump at
`0ms`, sit inside `prefers-reduced-motion: no-preference`.

Tilts and moves use the standalone `rotate`, `translate` and `scale` properties
rather than `transform`, so an animation or a hover that moves an object keeps
its tilt.

- Paste-in (`utilities/_paste.scss`). `WallSection` carries `u-paste`, and
  `useReveal` adds `u-paste--shown` the first time the section comes into view.
  Each sheet in it then settles onto the wall from slightly larger and lower,
  staggered by its `order`. Only `opacity`, `scale` and `translate` move, so
  the tilt stays, and the `backwards` fill leaves nothing applied once it ends.
  Sheets are hidden only before the reveal and only on screen, so a printed page
  shows them all. While anything in the section holds focus, its sheets stay
  visible: `opacity: 1 !important` outranks the running animation without
  restarting it.
- Exploded stack. `useScrollProgress` follows the middle of the drawing's frame:
  the plates come apart while they are on screen and finish early enough that
  the exploded stack is seen whole. On the wide sheet the guides, leaders and
  callouts fade in over the second half; the callouts take their opacity
  straight from the scroll, with no transition, which would restart every frame
  and lag behind. A mouse over a plate or a callout lights the pair; touch and
  pen don't, as a tap would leave it lit.
- Pass hover. A hovering pointer or keyboard focus takes a pass in hand: the
  `in-hand` mixin in `_pass.scss` straightens it and lifts it by `--lift`, and
  drops its cord by as much, so the cord stays on the hook. While a pass is
  hovered, a strip behind the card keeps a pointer near its edge on the pass as
  it lifts away. The hover lift applies only where a pointer can hover, so a tap
  leaves no pass lifted.
- Tear-off. A torn tab falls, turns and fades. If it had focus, focus moves to
  the next intact tab, and the copy is announced after that move, as moving
  focus can cancel speech already queued.
- A label that links lifts slightly on hover.

Under reduced motion nothing moves: sections show their sheets at once
(`useReveal` reveals immediately), the drawing starts exploded
(`useScrollProgress` returns 1), passes and labels hold still on hover and
focus, a torn tab disappears without falling, and anchor links jump instead of
scrolling.

## Responsive

The collage keeps its order at every width. Compositions are CSS grids, and
tilts shrink through `--tilt-scale` rather than objects being moved.

- From `xxl` a cable takes six passes; below it, three.
- `tools.below(xl)` is the tablet layout: the hero, the open-source board and
  the contact section re-span their grids.
- `tools.below(md)` is the phone: one column, less tilt, the passes on one
  cable that scrolls sideways, and no QR stickers. Focusing a pass centers it by
  scrolling the cable, never the page, so a tap doesn't move the page.
- Nothing scrolls the page sideways: `.o-app-layout` clips horizontal overflow,
  so numerals and sprayed names may run off the edge.

The drawing has three layouts, chosen by the width of its sheet rather than the
viewport:

- From 880px of sheet width, the wide sheet, laid out as on paper: a grid in
  flow in the proportions of the full-size sheet, type in container units
  (`cqw`), and leader lines from each plate to its callout. The drawing spans
  the whole sheet and paints over the text: only its plates take the pointer, so
  the text stays selectable, and the drawing has to keep out of the text
  columns. `aspect-ratio` is only a minimum: longer copy, a fallback font or
  WCAG text spacing make the sheet taller instead of overlapping. The switch is
  `WIDE_SHEET` in `PracticeSection.vue`, measured by `useElementWidth`, because
  the wide drawing is different markup (another `viewBox`, leader lines instead
  of numbered balloons) that CSS can't swap.
- From 600px of the `practice-drawing` container, the drawing sits beside its
  callouts.
- Below that, it sits above them.

Both narrower layouts number the plates with balloons instead of leader lines
and cap the drawing at `min(30rem, 62svh)`, so it shows whole on a landscape
phone.

## Conventions

- Lists of copy (lines, labels, kicker halves, points, specs) are keyed by
  index, so two equal strings in `site.json` never clash; records with an
  identity of their own (a company, a project, a link, a layer) are keyed by it.
- A styled content list carries `role="list"`: the reset sets
  `list-style: none` on every list with a class, and Safari drops list
  semantics under it.
- A label that is read but not seen goes in `.u-visually-hidden`, written in
  sentence case. Headings are uppercase by default, and uppercase can make a
  screen reader spell a word out, so the utility sets `text-transform: none`.
- Decoration stays out of the accessibility tree: sprayed text, numerals, tape,
  barcodes and the QR sticker are `aria-hidden`, and a drawn character such as
  the header's slash gets empty alternative text (`content: '/' / ''`).
- Lines set as separate blocks keep a real space between them, so copied text
  and reader modes don't run them together.
- Comments say why: the constraint, measurement or browser behavior behind a
  value, not what the line does.

## Copies outside the bundle

A few values are written out where the app's CSS can't reach; change them
together with their source.

`public/404.html` is one self-contained document: CloudFront serves it directly
at any missing URL, so it has no app bundle and can't read the app's CSS or
`site.json`. Its opening comment lists the sources it copies by hand:

- from `settings/`: the palette, the font stacks and `md`, written out as
  47.99rem;
- from `themes/_site.scss`: the wall's width, gutter, gap and tilt scale;
- from `tools/`: the three textures and the `focus-ring` mixin;
- from `generic/`: the reset, the body and the selection;
- `.o-wall` as `.wall`, `.c-kicker` as `.kicker`, and the sheet, spray, header
  and flyer-link styles;
- from `site.json`: the name, role and GitHub link.

`settings/_colors.scss`, `_typography.scss` and `_breakpoints.scss`,
`themes/_site.scss`, `tools/_noise.scss`, `objects/_wall.scss`,
`components/_kicker.scss` and `_site-header.scss` point back to it. The other
sources (`tools/_mixins.scss`, `generic/`, `components/_sheet.scss`,
`_spray.scss` and `sections/_flyer.scss`) don't, so check the 404 when changing
them.

Elsewhere:

- `theme-color` in `index.html` and `public/404.html` is `$color-wall`.
- `scripts/optimize-images.js` paints the cyan render in `$color-cyan`.
- The statement's underline in `sections/_practice.scss` is drawn in
  `$color-ink`, written into its `data:` URI.
