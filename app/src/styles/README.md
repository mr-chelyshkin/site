# Styles

`main.scss` loads the cascade layers declared in `_layers.scss`:

1. `generic/` — font face, reset (including list reset and focus outline) and
   document defaults.
2. `elements/` — bare element defaults: typography, links and buttons.
3. `objects/` — layout without cosmetics: app shell, container and poster geometry.
4. `components/` — shared objects, section parts and the chrome.
5. `sections/` — what makes each homepage section different from the others.
6. `utilities/` — cross-cutting behavior that has to win over a section.

Each layer exposes its partials through `_index.scss`. `settings/` holds Sass
values; `themes/_site.scss` exposes the used CSS custom properties, grouped by
surfaces, signal, type, poster geometry, chrome and motion. `tools/` contains
shared mixins and emits no standalone CSS.

Vue files own markup and behavior. Their selectors and media queries live here.
The page is a hero, three numbered sections, a contact section and the chrome.

## Naming

One partial per block, named after it. The prefix says which layer a class
belongs to:

| Prefix  | Layer        | Example                                  |
| ------- | ------------ | ---------------------------------------- |
| `o-`    | `objects`    | `.o-poster` in `objects/_poster.scss`    |
| `c-`    | `components` | `.c-external-link`                       |
| `site-` | `components` | `.site-header` — the chrome              |
| none    | `sections`   | `.commerce` in `sections/_commerce.scss` |
| `u-`    | `utilities`  | `.u-reveal`                              |

Blocks follow BEM: `block__element`, `block--modifier`. A state such as an open
menu is a modifier (`.site-navigation--open`), never an element.

## Settings, tokens and tools

Values that CSS has to read at runtime are custom properties from
`themes/_site.scss`; components use those, not the Sass variables behind them.
Breakpoints are the exception: media queries cannot read custom properties, so
`settings/_breakpoints.scss` names them and `tools.below(md)` or
`tools.below(lg)` wraps a block in the matching `max-width` query.

`tools/_mixins.scss` holds the repeated treatments:

- `meta-text` — small mono caps for indices, captions and labels.
- `component-title` — the mid-size display title.
- `display-caps` — tight uppercase display type for names in a list or grid.
- `signal-fringe` — the hero's color split as a text shadow; offsets and colors
  are parameters.
- `strike-on-hover` — the struck-through hover for text links. Links carry no
  hover effect by default; a component opts in.
- `focus-ring` — the shared outline, applied to every `:focus-visible` element
  by the reset.

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
section restates grid maths. `PosterSection.vue` applies it:

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

## Sections

A section partial contains only what makes that section different:

- `_hero.scss` — photo, oversized headline, vertical discipline label and static
  signal effects. The SVG color filter is defined by `HeroSection.vue`. A masked
  copy of the photo keeps the face clear above the color split and scanlines; the
  contrast gradient sits above both image layers. The face mask uses the source
  photo's dimensions, and its `cover` sizing and `50% 40%` position match the
  image crop.
- `_practice.scss` — layers separated by hairline rules, read as a stack from
  what the team works with down to what it runs on.
- `_commerce.scss` — names flowing as a wall over a readout that follows the
  pointer and keyboard focus; clicking or tapping pins a name. The wall dims around
  that name and the section takes a faint tint from its brand colors in `site.json`.
  Readout states share one grid cell to reserve their largest natural height.
- `_open-source.scss` — spec plates in a responsive grid.
- `_contact.scss` — the one tinted surface. It scopes `--signal-surface`,
  `--color-text-muted` and `--color-rule-main` so slices mask against the tint and
  muted ink keeps its contrast on it.

## Motion and interaction

Transitions take their durations from `--motion-fast` and `--motion-base`. Both
drop to `0ms` under `prefers-reduced-motion: reduce`, so a transition needs no
reduced-motion rule of its own. Animations are the opposite: each one sits inside
`prefers-reduced-motion: no-preference` or is switched off under `reduce`.

`components/_glitch.scss` contains the two glitch effects: `digital-corruption`
for the vertical rail labels and `matrix-split` for the menu link. They run once on
hover for 400ms, the timeout `useGlitch` waits before it drops the class.

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
`PosterSection` calls `useReveal`, which observes the section, adds
`u-reveal--shown`, and drops the transient `u-reveal--tuning` again so the same
drift stays available on hover.

Two placement decisions matter. It sits in `utilities`, after `sections`, because
a section may declare its own `transition` on the very elements that reveal, and a
later layer wins whatever the specificity. And the rise is an animation, not a
transition, so it cannot clobber a section's transition list — the plates and
layers keep their hover treatments.

`--reveal-base` on a `u-reveal__group` offsets everything inside it;
`--reveal-step` staggers items by their position. Every rule sits inside
`prefers-reduced-motion: no-preference`, and the composable reveals immediately
when that preference is set, so nothing stays hidden.

## Reusable objects

Keep object styles in their own component partials. Section and menu selectors
control placement, not the icon geometry, typography or interaction states of
shared objects.

- `BaseSignalText` renders readable text with two decorative copies hidden from
  accessibility for local signal slices. It inherits typography and the hero's
  signal colors. `--signal-cut`, `--signal-cut-secondary` and `--signal-offset`
  control the slices; `--signal-surface` sets the background on another surface.
- `PosterSection`, `SectionRail`, `SectionBand` and `SectionHeading` render the
  section frame and parts above. They receive their copy through props and hold
  no section state.
- `BaseIcon` owns the SVG frame and the shared `size`/`label` API. Named icons
  contain their paths and use `currentColor`. Without a label they are decorative.
- `BaseExternalLink` owns the compact tile, icon slot, label, border and hover/focus
  treatment. It inherits its text color; borders and hover backgrounds derive
  from that color for use on both light and dark surfaces.
- `ExternalLinkList` owns the wrapping list of text links, external-link attributes
  and the struck-through hover. `labelPrefix` adds context to accessible names
  when needed.
- `BaseImage` takes the photo's name and its intrinsic `width` and `height`, and
  builds `srcset` from `assets/image-widths.json`; `assetWidth` picks the plain
  `src` fallback and `priority` loads it eagerly with high fetch priority.
- `SocialLinks` owns the wrapping horizontal list and its profile-to-icon mapping.
  It receives data through props and emits clicks; it does not control navigation
  state.

Buttons start bare (`elements/_buttons.scss`): no border, background or font of
their own. A component that uses one draws the whole control.

Reuse these components when the same objects appear elsewhere. Keep the
router-link and external-link contracts explicit; their appearance and behavior
are defined by their respective components.
