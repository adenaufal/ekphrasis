# Ekphrasis — CLAUDE.md

## Project

Single-file Tampermonkey userscript for NovelAI (`novelai.net/image`).
**Entry point:** `ekphrasis.user.js`
**Current version:** 4.0.0 | **Storage documents:** `ekphrasis.library.v4`, `ekphrasis.settings.v4`, `ekphrasis.session.v4`

**Landing page:** `index.html` (brand dark theme, IBM Plex, teal accent `#5FBFA8`)
**Logo assets:** `assets/images/logo1.svg` (square icon mark), `assets/images/logo2.svg` (wordmark only), `assets/images/logo3.svg` (full `▌ekphrasis` wordmark — primary logo)

## Versioning — WAJIB diupdate setiap ada perubahan

Gunakan **Semantic Versioning** (`MAJOR.MINOR.PATCH`):

| Tipe perubahan | Bump |
|---|---|
| Fitur baru (tab baru, sistem baru) | `MINOR` → 3.2.0 |
| Fix bug, tweak kecil, UI polish | `PATCH` → 3.1.1 |
| Breaking change / rewrite besar | `MAJOR` → 4.0.0 |

**Wajib update 2 tempat setiap kali ada perubahan:**
1. `@version` di UserScript header (baris 4)
2. `CONFIG.VERSION` di dalam script (sekitar baris 22)

Keduanya harus selalu sinkron.

## Architecture

Everything lives in one IIFE. Sections are separated by comment headers:

```
CONFIGURATION → PRESETS (framing/camera/focus) → STATE → UI BUILDERS → EVENT HANDLERS → INIT
```

Key globals: `CONFIG`, `state`, `FRAMING_PRESETS`, `CAMERA_ANGLE_PRESETS`, `FOCUS_PRESETS`

## Storage Documents

| Key | Maps to | Content |
|-----|---------|---------|
| `ekphrasis.library.v4` | `library.json` | Unified `templates`, `placeholders`, `categories` |
| `ekphrasis.settings.v4` | `settings.json` | Queue/model/anlas preferences plus Studio-only flags |
| `ekphrasis.session.v4` | `session.json` | Queue resume data + `lastUsedTemplateId` |

Legacy keys (`nai_ext_*`, `nai_ext_templates_v2`, `nai_ext_artists`) are read for v3→v4 migration and then left in place for rollback safety.

## Key Concepts

- **Placeholders:** `{artist}`, `{character}`, `{style}`, custom. Resolved at queue time.
- **Weight syntax:** `{tag}` = ×1.05, `[tag]` = ÷1.05, `1.5::tag::` = numerical (V4+)
- **Randomizer:** `||opt1|opt2|opt3||` — expanded into all variants for queue
- **Prompt mixing:** `Prompt1|Prompt2:0.3` blending syntax
- **Multi-character:** `base | char1 | char2` separator syntax (V4+); interactions: `source#action`, `target#action`, `mutual#action`
- **Queue:** generates permutations of templates × placeholder combinations

## Model-Specific Tags

| Tag | Description | Model |
|-----|-------------|-------|
| `fur dataset` | Furry art mode | V4+ |
| `background dataset` | No-character mode | V4.5+ |
| `rating:general` | Content rating | V4+ |
| `year XXXX` | Era-specific style | V3+ |

## Known Issues

1. **NovelAI UI Changes**: Script may break if NovelAI updates their UI structure
2. **Error Detection**: Error popup detection might not catch all error types
3. **Queue Reliability**: No automatic retry for network failures
4. **Storage Limits**: LocalStorage has size limitations (~5-10MB)
5. **Browser Compatibility**: Tested mainly on Chrome/Firefox

## NovelAI UI Integration

The script finds the prompt textarea via DOM selectors (fragile — may break on NAI updates).
All generation detection is polling-based (`GENERATION_CHECK_INTERVAL: 1000ms`).

## Conventions

- ES6+, 2-space indent
- No external dependencies — pure vanilla JS + GM APIs
- `GM_getValue`/`GM_setValue` for persistence
- Prefer modifying existing functions over adding new top-level ones
- Keep everything in the single IIFE — no module splitting

## Quality Tags Presets

```
V4.5 Full:     location, very aesthetic, masterpiece, no text
V4.5 Curated:  location, masterpiece, no text, -0.8::feet::, rating:general
V4 Full:       no text, best quality, very aesthetic, absurdres
V4 Curated:    rating:general, amazing quality, very aesthetic, absurdres
V3:            best quality, amazing quality, very aesthetic, absurdres
```

## Testing

No test suite. Manual testing on `https://novelai.net/image`.
Use browser DevTools console for debugging — errors surface there.

## Roadmap

See `ROADMAP.md`. Current focus: Phase 4 (queue enhancements, CSV import, seed management).
