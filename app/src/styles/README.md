# Styles

`main.scss` loads the cascade layers declared in `_layers.scss`:

1. `generic/` — reset, focus outline and document defaults.
2. `elements/` — typography, links and form controls.
3. `objects/` — page layout, container and poster geometry.
4. `components/` — chrome, shared objects and section parts.
5. `views/` — what makes each homepage section different from the others.
6. `utilities/` — cross-cutting behavior that has to win over a view.

Each layer exposes its partials through `_index.scss`. `settings/` holds Sass
values; `themes/_site.scss` exposes the used CSS custom properties, grouped by
surfaces, accents, type, poster geometry, chrome and motion. `tools/` contains
shared mixins and emits no standalone CSS.

Vue files own markup and behavior. Their selectors and media queries live here.
The page is a hero, three numbered sections, a contact section and the chrome.

## Display font

`--font-display` uses the bundled Inter Display SemiBold (600, normal) from
[Inter 4.1](https://rsms.me/inter/download/). `generic/_fonts.scss` declares the face;
headings, company names, the contact email and footer name share the token.
The standalone `public/404.html` declares the same face for its number and title.
Both HTML documents preload the same WOFF2 with `font-display: swap`.

The font lives in `public/fonts/` so the standalone error page can use a
root-absolute URL at any missing path. Its filename includes the pinned release;
when updating the file, change that URL in both font declarations and preloads.
`public/fonts/Inter-LICENSE.txt` contains its SIL Open Font License 1.1.
The body and mono families use their existing tokens.

## Poster geometry

`objects/_poster.scss` owns the geometry every full-bleed section shares, so no
view restates grid maths:

- `.o-poster` — the content column beside the rail column.
- `.o-poster--open` — for a section that carries no rail and runs edge to edge.
- `.o-poster__sheet` — the gutters and the vertical rhythm, from `--poster-block`
  and `--poster-gap`.
- `.o-poster__split` — the 7fr / 5fr primary and secondary columns, so every row
  that uses it keeps its secondary column on one vertical line down the page.
- `.o-poster__aside` — the measure and size of the text in that second column.

`--poster-rail` and `--poster-gutter` also drive the hero, so section display type
starts on the hero headline's left edge and every rail keeps the same width and
position.

## Section parts

`components/` holds the pieces the sections assemble:

- `.c-section-rail` — the dark vertical column carrying a numbered section's index
  and label. Its rotation sits on the outer element and the glitch on the inner one,
  as in the hero, so the shift follows the same axis in both.
- `.c-section-band` — the rail's horizontal counterpart, for a section with no rail.
- `.c-section-heading` — the display headline. It cuts each line with its own signal
  tear and, on hover, drifts the slices in discrete steps.

## Views

A view partial contains only what makes that section different:

- `_content-view.scss` — the hero: photo, oversized headline, vertical discipline
  label and static signal effects. The SVG color filter is defined by
  `ContentHero.vue`. A masked copy of the photo keeps the face clear above the color
  split and scanlines; the contrast gradient sits above both image layers. The face
  mask uses the source photo's dimensions, and its `cover` sizing and `50% 40%`
  position match the image crop.
- `_content-practice.scss` — layers separated by hairline rules, read as a stack from
  what the team works with down to what it runs on.
- `_content-commerce.scss` — names flowing as a wall over a readout that follows the
  pointer; the wall dims around the name being read.
- `_content-open-source.scss` — spec plates in a responsive grid.
- `_content-contact.scss` — the one tinted surface. It scopes `--signal-surface`,
  `--color-text-muted` and `--color-rule-main` so slices mask against the tint and
  muted ink keeps its contrast on it.

## Motion and interaction

`components/_animations.scss` contains the two glitch effects: `digital-corruption`
for the vertical rail labels and `matrix-split` for the menu link. They run once on
hover and respect `prefers-reduced-motion`.

Both animate the standalone `translate` property instead of `transform`, so they
compose with an element's own `transform` rather than replacing it: a rotated label
keeps its rotation while it glitches. Keyframes meant to override a base transform
use `transform` on purpose — `signal-drift` in `components/_signal-text.scss` does,
because it overrides the slice's own offset.

The navigation keeps the dark panel and small mono link from `v0.0.1`, on the
page's own ink and `--color-scrim` rather than colors of its own.
Strike-through is a hover effect; the active route uses a heavier font weight.

## Reveal

`utilities/_reveal.scss` gives each section one event the first time it comes into
view: its parts rise in a short cascade while the heading locks its signal once.
`useReveal` observes the section, adds `c-reveal--shown`, and drops the transient
`c-reveal--tuning` again so the same drift stays available on hover.

Two placement decisions matter. It sits in `utilities`, after `views`, because a
view may declare its own `transition` on the very elements that reveal, and a later
layer wins whatever the specificity. And the rise is an animation, not a transition,
so it cannot clobber a view's transition list — the plates and layers keep their
hover treatments.

`--reveal-base` on a `c-reveal__group` offsets everything inside it;
`--reveal-step` staggers items by their position. Every rule sits inside
`prefers-reduced-motion: no-preference`, and the composable reveals immediately
when that preference is set, so nothing stays hidden.

## Reusable objects

Keep object styles in their own component partials. Page and menu selectors
control placement, not the icon geometry, typography or interaction states of
shared objects.

- `BaseSignalText` renders readable text with two decorative copies hidden from
  accessibility for local signal slices. It inherits typography and the hero's
  signal colors. `--signal-cut`, `--signal-cut-secondary` and `--signal-offset`
  control the slices; `--signal-surface` sets the background on another surface.
- `SectionRail`, `SectionBand` and `SectionHeading` render the section parts above.
  They receive their copy through props and hold no section state.
- `BaseIcon` owns the SVG frame and the shared `size`/`label` API. Named icons
  contain their paths and use `currentColor`. Without a label they are decorative.
- `BaseExternalLink` owns the compact tile, icon slot, label, border and hover/focus
  treatment. It inherits its text color; borders and hover backgrounds derive
  from that color for use on both light and dark surfaces.
- `ExternalLinkList` owns the wrapping list of text links, external-link attributes
  and focus treatment. `labelPrefix` adds context to accessible names when needed.
- `BaseImage` uses `assetWidth` to select its source file; `width` and `height` set
  the image's HTML dimensions. Responsive selection uses `srcset` and `sizes`.
- `SocialLinks` owns the wrapping horizontal list and its profile-to-icon mapping. It receives data
  through props and emits clicks; it does not control navigation state.

Reuse these components when the same objects appear elsewhere. Keep the
router-link and external-link contracts explicit; their appearance and behavior
are defined by their respective components.
