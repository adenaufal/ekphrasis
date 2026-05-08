# Ekphrasis — Changelog

> This changelog was written based on analysis of `ekphrasis.user.js`.
> Since there is no git history, versions prior to 3.2.0 were reconstructed
> from evidence in the code (migration code, storage key suffixes, comments).

---

## [4.0.2] — May 2026

### Changed
- **UI icon cleanup** — all emoji characters throughout the panel replaced with inline SVG icons: section headers (Templates, Placeholders), help button, footer strip indicators (quality tags, anlas), queue/settings action buttons, and modal titles. Panel icon language now matches the landing page.
- **Negative badge design token** — the red **N** badge on linked templates now uses `.nai-ext-neg-badge` CSS class with `--ekp-error` token instead of a hardcoded `#dc2626` inline style.
- **Collapsible section chevrons** — expanded/collapsed indicators updated from `−`/`+` to `▾`/`▸`.

---

## [4.0.1] — May 2026

### Changed
- **Panel motion + controls polish** — drag now uses pointer events plus `requestAnimationFrame` transform previews, making the floating studio feel lighter while moving and less prone to layout thrash.
- **Header refresh** — the top bar now uses the existing Ekphrasis brand icon, a clearer full SemVer badge (`v4.0.1`), refined control buttons, and a branded reopen chip when the panel is closed.
- **Help modal refresh** — Help now includes an About section with product description and metadata, improved contrast, and smoother open/close transitions.

### Fixed
- **Minimize state persistence** — minimized/restored state is now wired into saved UI settings instead of existing only in CSS.
- **Closed-state styling** — the reopen affordance now uses globally available `--ekp-*` tokens, so it renders consistently even outside the panel DOM subtree.

---

## [4.0.0] — May 2026

### Added
- **Storage schema v4 rollout** — Studio now persists the exact three-document contract from `SCHEMA.md`:
  - `ekphrasis.library.v4` → `library.json`
  - `ekphrasis.settings.v4` → `settings.json`
  - `ekphrasis.session.v4` → `session.json`
- **One-shot legacy migration** — first load now migrates `nai_ext_*` / `nai_ext_templates_v2` / `nai_ext_artists` into v4 documents while leaving the old keys untouched for rollback safety.
- **Queue session metadata** — resumable queue state is now serialized as queue item objects (`pending` / `running` / `done` / `failed`) instead of the old flat queue snapshot.

### Changed
- **Export / import contract** — export now writes `library.json` directly. Import accepts full v4 libraries, partial v4 bundles, and legacy v3 exports.
- **Unified template identity** — positive and negative templates are stored with stable `tpl_*` IDs plus `linkedNegativeId`, matching `SCHEMA.md`.
- **Placeholder + category metadata** — placeholders now carry stable `ph_*` IDs and timestamps; categories carry stable `cat_*` IDs and survive rename without breaking references.
- **Placeholder rename behavior** — renaming `{shortName}` now rewrites matching template content atomically, as required by the v4 schema.

### Fixed
- **Negative-template linking** — deleting a negative template now unlinks by stable template ID instead of shifting array indices.

---

## [3.9.1] — May 2026

### Changed
- **Brand design system applied** — full dark theme rollout across the userscript UI:
  - CSS custom properties (`--ekp-*` tokens) for all colors, fonts, and radii, scoped under `#nai-ext-panel`
  - IBM Plex Mono + IBM Plex Sans loaded via Google Fonts `@import`
  - All inline JS-generated HTML styles replaced with `var(--ekp-*)` references
- **`index.html` redesigned** — landing/install page rebuilt with brand dark theme (`#0E0E10` base), teal install button, 2-column features grid, and IBM Plex fonts
- **SVG logos integrated** — `assets/images/logo1.svg` (square icon mark) and `logo3.svg` (full `▌ekphrasis` wordmark) replace the previous text-based logo in `index.html`; logos adjusted for transparent rendering (added `viewBox`, removed opaque background paths, counter fills matched to brand background)

## [3.9.0] — May 2026

### Added
- **Negative template click-to-apply** — clicking an item in the Negative Template list directly fills the NAI negative prompt field (same behavior as positive templates).
- **Anlas auto-detection** — `initAnlasAutoDetect()` polls every 4 seconds + MutationObserver:
  - **Vibe Transfer count** — auto-counted from thumbnail images in the "Vibe Transfer" section of the NAI UI.
  - **Precise Reference count** — auto-counted from the "Reference Image" / "Precise Reference" section.
  - **Opus Plan** — auto-detected from the plan badge/indicator in the NAI header/nav.
  - **Free generation** — if the NAI UI itself shows "0" / "free" in the cost indicator, the Anlas badge is automatically highlighted as free.
- `NovelAI.detectAnlasFactors()` — single function that reads all Anlas factors from the live DOM.
- `initAnlasAutoDetect()` — sets up polling interval + MutationObserver, debounced 700ms.

### Fixed
- **Negative prompt editor detection** — `getNegativePromptEditor()` now handles two NAI layouts:
  - **Separate layout** (two editors visible) → `editors[1]` as before.
  - **Combined/tabs layout** (single area + NAI Positive/Negative tabs) → detected via label proximity ("Undesired Content").
- **`setNegativePrompt()` tabs layout** — if only one editor is present (tab layout), automatically clicks NAI's "Undesired Content" tab, sets content, then restores the positive tab after 250ms.

### Added (helpers on `NovelAI` object)
- `_findEditorNearLabel(labels)` — traverses the DOM to find a ProseMirror inside a labeled container.
- `_findNAIPromptTab(type)` — finds the "Prompt" or "Undesired Content" tab button in the NAI UI.

---

## [3.8.0] — May 2026

### Added
- **Anlas Calculator** — new footer Strip 5 (`💎`).
  - **Opus Plan toggle** — when active, V4.5 Full base cost = 0 Anlas.
  - **Precise Reference spinner** (+/−) — each reference adds +5 Anlas; expanded panel shows cost breakdown.
  - **Vibe Transfer spinner** (+/−) — first 4 are free; each additional one adds +2 Anlas.
  - Cost breakdown panel: `Base / Ref ×N / Vibe ×N / Total`.
  - Live `N Anlas` badge in the footer bar: green (0), yellow (≤10), red (>10).
- `calculateAnlas()` — pure function for computing cost (base + ref + vibe).
- `updateAnlasUI()` — updates badge, breakdown panel, and counter display.
- `state.settings.opusPlan`, `preciseRefCount`, `vibeCount` — persisted to storage.
- Migration in `loadState()` for all three new fields if not yet present.
- Anlas is automatically recalculated when the model changes in the quality strip (base cost differs per model).

---

## [3.7.0] — May 2026

### Added
- **T5 Token Counter** — real-time `~N/512` badge in the Quality strip footer bar.
  Uses a `MutationObserver` on the NAI ProseMirror prompt editor.
  Colors: green (≤400), yellow (401–480), red (>480).
- **Model-Aware Quality Tags** — new footer Strip 4 (`🏷️`).
  - 5 model buttons: V4.5 Full, V4.5 Cur, V4 Full, V4 Cur, V3.
  - Expanded panel: tag preview + **+ Insert Quality Tags** button (appends to NAI prompt).
  - Selected model persisted via `state.settings.currentModel`.
- `QUALITY_TAG_PRESETS` constant — 5 model presets with label + tags string.
- `estimateT5Tokens(text)` — heuristic: ~1 token per 5 characters per word.
- `initTokenCounter()` — sets up MutationObserver after panel init.
- `updateQualityTagsUI()` — syncs active button, preview text, and label.
- Migration in `loadState()` for `currentModel` if missing or invalid.

---

## [3.6.0] — May 2026

### Added
- **Negative Template UI** — Positive/Negative tabs in the Templates panel.
  - Full CRUD: add, edit inline (name + content), delete.
  - Delete automatically shifts all `negativeId` references in positive templates.
- **Link Template → Negative** — the positive template edit modal now has a **Linked Negative** dropdown.
  Options: `(none)` + all existing negative templates.
- **Red N badge** on positive template list items that have a valid linked negative.
- `renderNegativeTemplates()` — renders the panel and CRUD event handlers.
- `saveNegativeTemplates()` — persists to `nai_ext_negative_templates_v3`.
- `openEditTemplateModal(index)` — inline modal with Name, Prompt, and Linked Negative fields.

### Fixed
- `applyPrompt()` — graceful fallback if `negativeId` is out-of-bounds (after delete).
- `updatePreview()` — handles `{ content, name }` object format for negative templates.
- `renderNegativeTemplates()` now called in main init and the import config handler (was missing).
- `saveNegativeTemplates()` now called in the import config handler.

### Changed
- **"Pos+Neg" button** — different tooltip when template has no linked negative; opacity dimmed.

---

## [3.3.1] — March 2026

### Fixed
- **Randomizer + Apply+** — `applyPrompt` now calls `Randomizer.pickRandom()` before setting the NAI prompt. Previously `||a|b||` was pasted literally into the prompt field.
- **Category/Placeholder tab management** — added inline `✎` rename and `×` delete buttons on the active tab, plus `+` to add a new category.

### Changed
- **Help modal** — weight syntax updated (added `{{tag}}`, example changed to `3::tag::` per NAI docs), randomizer description corrected ("Apply+ picks one randomly; Queue expands all"), placeholder section now notes the difference between `{name}` substitution and `{tag}` weight boost.

---

## [3.3.0] — March 2026

### Changed
- **Framing → Composition rework** — Replaced the 4-tab framing system (Shot / Angle / Focus / Pose) with a flat grid of 15 named **Composition Bundles**. Each bundle injects 2–4 tags at once with a single click (append-only, no toggle). Hover shows the exact tags via tooltip.
- Removed `FRAMING_PRESETS`, `CAMERA_ANGLE_PRESETS`, `FOCUS_PRESETS`, `POSE_PRESETS` — replaced by single `COMPOSITION_BUNDLES` array.
- Removed `toggleTag` — replaced by `appendTags(tags[])`.
- Removed `setupFramingTabs`, framing-tab-panel CSS, and framing-summary element.

---

## [3.2.3] — March 2026

### Added
- **Batch Raw Import** — the 📋 button in the queue bar opens a modal overlay for pasting multiple prompts at once.
  A `---` separator on its own line splits prompt blocks; each block becomes one queue item.
  A live counter shows the number of detected prompts before confirming.

---

## [3.2.0] — January 2026

**Confirmed from code** (comments `(New)` / `(Expanded)` + header `@version 3.2.0`):


### Added
- **Pose tab** in Framing section (`POSE_PRESETS` — 16 poses: Standing, Sitting, Kneeling,
  Lying, Leaning, Squatting, Walking, Running, Jumping, Floating, Arms Up, Arms Behind,
  Hand on Hip, Crossed Arms, Peace Sign, V Sign)
- **Expanded Shot presets**: Extreme Close-up, Bust Shot, Thigh Up, Panorama (added on top of
  the original 6 from v3.0)
- **Expanded Angle presets**: Front View, From Behind, 3/4 View, Bird's Eye, Worm's Eye,
  POV Hands (added on top of original Dutch Angle, From Above, From Below, From Side, POV)
- **Expanded Focus presets**: Ass, Breasts, Navel, Back, Armpit, Weapon, Food (added alongside
  original Animal, Eye, Object; Face and Hands also added)
- **Framing summary line** — shows active framing tags below the preset buttons
- **Help / Guide modal** (`?` button in header) — documents weight syntax, randomizer syntax,
  placeholder syntax with examples
- **Footer accordion UI** — Apply and Queue strips are now collapsible panels with expand toggle
- **Reopen button** — floating "NAI" button appears when panel is closed (×)
- **Click header to restore** — click anywhere on minimized header restores the panel
- **ResizeObserver** for dynamic footer padding (body scrolls correctly under sticky footer)
- **`STYLE_PRESETS` constant** defined (art movements, traditional media, digital techniques)
  — ⚠️ **Not wired to any UI** (dead code / in progress)

### Internals
- `WeightSyntax` updated to prioritize V4.5 format (`N::tag::`) over legacy bracket notation
- `setupFramingTabs()` and `setupFooterToggles()` extracted as separate init helpers

### ⚠️ Known orphaned code (utilities without UI)
The following utilities exist in the codebase but have **no corresponding UI section**
in `createPanel()`. All their `getElementById()` calls silently return `null` at runtime:
- `updateWeightEditor()` — weight slider UI elements not in panel HTML
- `updateRandomizerPreview()` — randomizer preview/actions elements not in panel HTML
- `MultiCharacter` — charSlots in state, CSS for `.nai-ext-char-slot` exists, no UI section
- `PromptBlending` — parse utility only, no UI

---

## [3.1.0] — January 2026

**Inferred** (CLAUDE.md listed this as "current" before 3.2.0; no specific code evidence
distinguishes 3.1 from 3.0 changes — likely minor bug fixes / UI polish).

---

## [3.0.0] — January 2026

**Inferred from code evidence** (storage key `_v3` suffix, comment section headers,
utility classes present):

### Added
- `WeightSyntax` utility — parse/format V4.5 (`N::tag::`) and legacy (`{tag}`, `[tag]`)
- `Randomizer` utility — parse `||opt1|opt2||`, expand all variations, count permutations
- `MultiCharacter` utility — parse/build `base | char1 | char2` syntax
- `PromptBlending` utility — parse `Prompt1|Prompt2:0.3` syntax
- `negativeTemplates` array in state + `nai_ext_negative_templates_v3` storage key
- `negativeId` field on template objects (links positive → negative template)
- **Apply Both** button — applies positive prompt + linked negative template at once
- **Framing section** (Shot, Angle, Focus tabs) with quick-tag toggle buttons
- `nai_ext_settings_v3` storage key (replaced unversioned settings)
- `GENERATION_CHECK_INTERVAL`, `WEIGHT_MULTIPLIER`, `PLACEHOLDER_REGEX` added to CONFIG

### ⚠️ Claimed in ROADMAP but NOT in code
- Quality tag presets (V4.5 Full, V4.5 Curated, V4 Full, V4 Curated, V3) — **no code found**
- Weight editor UI — utility exists, UI was never built or was removed
- Randomizer preview UI — utility exists, UI was never built or was removed
- Multi-character slot builder UI — utility exists, UI was never built or was removed

---

## [2.0.0] — January 2026

**Inferred from migration code** in `loadState()` (lines 3469–3513):
```
"NAI Ext: Migrating from v2 data..."
Storage keys: nai_ext_templates_v2, nai_ext_artists
→ migrated to: nai_ext_templates_v3, nai_ext_placeholders
```

### Added
- Dynamic placeholder types: `{artist}`, `{character}`, `{style}`, + custom
- Placeholder tabs UI (add/remove types, multi-select values, batch add, prefix toggle)
- Template categories (general, portraits, landscapes + custom)
- Category tab filter on template list
- Template objects (`{ content, name, category }`) replacing plain strings
- Multi-select for templates + placeholders (Select All / Deselect All / Batch delete)
- Import / Export JSON (with merge or replace options)
- Combination generator: queue = templates × placeholder permutations
- `nai_ext_templates_v3`, `nai_ext_placeholders`, `nai_ext_categories` storage keys
- Legacy migration from v2 (`nai_ext_templates_v2`, `nai_ext_artists`)

---

## [1.0.0] — December 2025

**Inferred from legacy storage keys** present in migration code:
- `nai_ext_artists` (plain string array)
- `nai_ext_templates_v2` (templates array, simple format)

### Features (inferred)
- Floating panel (fixed position, draggable, minimize/maximize)
- Prompt templates (plain text, no objects)
- Artist list (`{artist}` placeholder only)
- Basic batch queue — single placeholder type
- Queue controls: start, pause, clear
- Progress tracking
- LocalStorage / `GM_setValue` persistence
- Auto-continue after generation (polling-based, 1000ms interval)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| Confirmed | Directly evident from code, comments, or identifiers |
| Inferred | Reconstructed from migration code, storage keys, or ROADMAP notes |
| ⚠️ | Discrepancy between ROADMAP/docs and actual code |
