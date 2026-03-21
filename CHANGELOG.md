# Ekphrasis — Changelog

> Changelog ini ditulis berdasarkan analisis kode `ekphrasis.user.js`.
> Karena tidak ada git history, versi sebelum 3.2.0 direkonstruksi dari
> bukti yang ada di kode (migration code, storage key suffixes, komentar).

---

## [3.3.1] — March 2026

### Fixed
- **Randomizer + Apply+** — `applyPrompt` sekarang memanggil `Randomizer.pickRandom()` sebelum set ke NAI. Sebelumnya `||a|b||` dipaste literal ke prompt field.
- **Category/Placeholder tab management** — tambah tombol `✎` rename dan `×` delete inline di tab aktif, plus `+` untuk add category baru.

### Changed
- **Help modal** — weight syntax diperbarui (tambah `{{tag}}`, ganti contoh ke `3::tag::` sesuai docs NAI), deskripsi randomizer diperbaiki ("Apply+ picks one randomly; Queue expands all"), placeholder section tambah note soal perbedaan `{name}` substitution vs `{tag}` weight boost.

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
- **Batch Raw Import** — button 📋 di queue bar membuka modal overlay untuk paste banyak prompt sekaligus.
  Separator `---` di baris sendiri memisahkan blok prompt; tiap blok = satu item queue.
  Live counter menampilkan jumlah prompt yang terdeteksi sebelum dikonfirmasi.

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
