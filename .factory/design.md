# Transcript Pocket — visual thesis

## Direction: the listening blueprint

Transcript Pocket is a **blueprint drafting sheet**, not a generic media player. A transcript is a time map: measured ticks, coordinate labels, registration marks, and a moving drafting rule make synchronization visible. The document-like surface keeps the transcript—not the controls—in charge. Technical notation is used only where it explains position or local-file privacy.

The product has two deliberate treatments: a pale cyan drafting sheet in light mode and a deep navy diazo print in dark mode. Neither is a neutral framework skin.

## Tokens

| Role | Light | Dark | Reason |
| --- | --- | --- | --- |
| Background | `#dceff0` | `#071b24` | Cyan paper / diazo sheet |
| Surface | `#f4fbf8` | `#0d2934` | Reading plane above the grid |
| Ink | `#102f3a` | `#e9f8f3` | Technical ink with ≥ 7:1 contrast |
| Muted ink | `#47656d` | `#a9c5c5` | Annotations, still ≥ 4.5:1 |
| Rule | `#8ebfc0` | `#376572` | Construction lines |
| Blueprint blue | `#075f80` | `#6fd5ed` | Primary action and focus |
| Signal coral | `#b63c25` | `#ff9b80` | Playhead/current phrase |
| Success | `#16643e` | `#6ed69a` | Saved/offline-ready state |
| Warning | `#835600` | `#ffd27b` | License and format notices |
| Danger | `#a42424` | `#ff9a96` | Parse/file errors |

The paper grid is CSS, so it remains crisp and costs no image bytes. Focus is a 3 px double blueprint-blue drafting outline. State always includes text or shape; color never carries meaning alone.

## Type and spacing

- **Long-form transcript:** `Atkinson Hyperlegible Next`, self-hosted WOFF2 when available, falling back to Atkinson/Arial/system sans. Its distinct letterforms serve the audience.
- **Controls and notation:** `IBM Plex Mono`, self-hosted WOFF2 when available, falling back to ui-monospace. Tabular timestamps feel like measurement labels.
- Scale: 14 / 16 / 18 / 24 / 34 / 48 px. Transcript defaults to 20 px at 1.65 leading and can scale to 30 px.
- Spacing follows a 4 px base: 4, 8, 12, 16, 24, 32, 48, 64. Reading measure is capped at 72 characters.
- Controls are at least 44×44 px and adjacent controls have at least 8 px separation.

## Layout and interaction grammar

The first-use screen is a drafting table: a compact title block explains the local-only promise, two numbered file wells establish the required order, and an exploded-pocket illustration shows audio and caption sheets converging. Once loaded, the title block compresses into a utility header. On desktop the drafting rail (search, phrase index, bookmarks) sits beside the transcript. At 390 px it stacks and nonessential measurements disappear; transport stays in document flow so it never covers text or safe areas.

The active cue is a coral-edged translucent drafting strip. Selecting a phrase seeks audio. Search results are marked with an underline plus a count. Bookmarks use a notched flag and a textual label. A position card is an explicit portable JSON record, not a hidden account.

## Motion policy

UI transitions run 180–240 ms and animate only opacity and transform. The active strip settles a few pixels as the playhead enters a cue; file wells compress from their physical origin. Nothing loops. With `prefers-reduced-motion: reduce`, scrolling becomes instant and all movement is removed while outlines, scale, and labels preserve hierarchy.

## Original asset plan and provenance

One generated hero illustration clarifies the core job: a portable cassette-shaped audio object and two punched transcript sheets align on a cyan drafting table, connected by one coral time ruler. It is explanatory, not a product screenshot. Icons elsewhere are hand-authored inline SVG using the same 1.5 px technical stroke.

**Prompt sheet**

- Use case: `stylized-concept`
- Subject: an exploded-view pocket audio player, waveform strip, and caption sheets synchronizing along a measured time rail
- World/materials: cyan drafting vellum, navy technical ink, translucent acetate, paper tabs, precise registration marks
- Light/lens: flat editorial light, subtle paper shadows, orthographic three-quarter view
- Palette words: pale cyan, blueprint navy, off-white vellum, one signal-coral accent
- Composition: landscape, object group centered-right with breathing room, readable at small size
- Negative list: people, faces, brands, logos, readable words, fake UI text, gradients, photoreal device branding, watermark

**Generated asset:** `public/assets/transcript-pocket-hero.webp`, generated 2026-08-28 with the Param Factory Azure image deployment via `/opt/fleet/lib/gen-image.sh`. Prompt is preserved in `assets/src/transcript-pocket-hero.prompt.json`; source PNG is retained in `assets/src/`. The image is original AI-generated work for this product. It is disclosed in the footer.

