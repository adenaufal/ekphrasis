<p align="center">
  <img src="assets/images/logo3.svg" alt="Ekphrasis" width="320" />
</p>

A Tampermonkey userscript that adds a prompt studio panel to [NovelAI](https://novelai.net/image). Manage templates, placeholders, composition presets, and batch queues — all without leaving the page.

**Current version:** 4.0.2

---

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) for your browser
2. Click **[Install Ekphrasis](./ekphrasis.user.js)** — Tampermonkey will prompt automatically
3. Navigate to `https://novelai.net/image` — the panel will appear on the right

> **Manual install:** Open Tampermonkey dashboard → Create new script → paste the full contents of `ekphrasis.user.js`

---

## Features

### Templates
Save and reuse prompt snippets. Organize them with categories. Select one to preview it, then apply directly to the NovelAI prompt field.

### Placeholders
Define named placeholder types (e.g. `artist`, `character`, `style`) and fill them with values. Use `{artist}` syntax in templates — the selected value is substituted at apply time.

Multiple values can be selected to generate all combinations via the queue.

### Negative Templates
Create and manage a separate library of negative prompts. Link each positive template to a specific negative template via the Edit modal — the positive template will show a red **N** badge. Use the **Pos+Neg** button to apply both at once. Links are stored by stable template ID, so deleting a negative template does not break unrelated references.

### Quality Tags
The **Quality Tags** footer strip lets you choose a model preset (V4.5 Full, V4.5 Curated, V4 Full, V4 Curated, V3) and click **+ Insert Quality Tags** to append the appropriate tags directly to the NovelAI prompt.

### T5 Token Counter
A `~N/512` badge in the Quality strip footer bar shows a real-time estimate of T5 tokens for the current prompt. Color coding: green ≤ 400, yellow 401–480, red > 480.

### Anlas Calculator
The **Anlas** footer strip estimates the Anlas cost per generation:
- **Opus Plan** toggle — sets V4.5 Full base cost to 0 Anlas when active
- **Precise Ref** spinner — each reference image adds +5 Anlas
- **Vibe Transfer** spinner — the first 4 are free; each additional one adds +2 Anlas
- Live `N Anlas` badge in the footer bar (green / yellow / red)

Anlas factors (Vibe Transfer count, Precise Reference count, Opus Plan status) are also auto-detected from the live NovelAI DOM via polling and MutationObserver.

### Composition
Quick-pick buttons organized into 15 named composition bundles (e.g. Close-Up Portrait, Dutch Angle, Dynamic Action). Each bundle appends 2–4 tags at once. Hover any bundle to preview the tags in a tooltip.

### Batch Queue
Automatically generates every permutation of templates × placeholder combinations and queues them for sequential generation. Supports configurable delay between generations to avoid rate limiting.

**Batch Raw Import** — click the clipboard icon in the queue bar to paste multiple prompts at once without needing templates. Separate each prompt with `---` on its own line:

```
a cute fox, masterpiece
---
wolf in forest, best quality
---
dragon, cinematic lighting
→ 3 items added to the queue
```

Queue state (pending / running / done / failed) is persisted and resumable across page reloads.

### Weight Syntax

| Syntax | Effect |
|---|---|
| `1.5::tag::` | V4.5 — stronger emphasis |
| `0.8::tag::` | V4.5 — weaker emphasis |
| `-0.5::tag::` | V4.5 — suppress |
| `{tag}` | Legacy boost (×1.05 per brace pair) |
| `[tag]` | Legacy weaken (÷1.05 per bracket pair) |

### Randomizer
Use `||opt1|opt2|opt3||` in a template. At queue time, Ekphrasis expands every variant into separate queue entries.

```
||red|blue|green|| hair, ||smiling|neutral|| expression
→ 6 combinations generated
```

### Help Modal
Press **?** in the panel header to open an in-panel reference for weight syntax, randomizer syntax, and placeholder substitution rules.

---

## Storage

Data is stored via Tampermonkey's `GM_getValue` / `GM_setValue` in three v4 documents:

| Key | Maps to | Content |
|---|---|---|
| `ekphrasis.library.v4` | `library.json` | Unified templates, placeholders, and categories |
| `ekphrasis.settings.v4` | `settings.json` | Queue/model/Anlas preferences and Studio flags |
| `ekphrasis.session.v4` | `session.json` | Last-used template and resumable queue state |

Legacy `nai_ext_*` keys are automatically migrated on first run and left in place for rollback safety. Export writes `library.json` directly; import accepts full v4 libraries, partial v4 bundles, or legacy v3 exports.

---

## Model-Specific Tags

| Tag | Description | Model |
|---|---|---|
| `fur dataset` | Furry art mode | V4+ |
| `background dataset` | No-character mode | V4.5+ |
| `rating:general` | Content rating | V4+ |
| `year XXXX` | Era-specific style | V3+ |

### Quality Tags by Model

| Model | Quality Tags |
|---|---|
| V4.5 Full | `location, very aesthetic, masterpiece, no text` |
| V4.5 Curated | `location, masterpiece, no text, -0.8::feet::, rating:general` |
| V4 Full | `no text, best quality, very aesthetic, absurdres` |
| V4 Curated | `amazing quality, very aesthetic, absurdres` |
| V3 | `best quality, amazing quality, very aesthetic, absurdres` |

### Anlas Cost Reference

| Feature | Cost |
|---|---|
| Vibe Transfer (5th and beyond) | +2 Anlas per vibe per image |
| Precise Reference | +5 Anlas per reference per image |
| V4.5 Full on Opus plan | **0 Anlas** base cost |

---

## Files

| File | Purpose |
|---|---|
| `ekphrasis.user.js` | The userscript — single file, install this |
| `index.html` | Landing and install page |
| `assets/images/logo1.svg` | Square icon mark |
| `assets/images/logo3.svg` | Full `▌ekphrasis` wordmark (primary logo) |
| `CHANGELOG.md` | Full version history |
| `ROADMAP.md` | Planned features |
| `docs/SCHEMA.md` | Storage document schema reference |

---

## Known Limitations

- **NovelAI UI changes** — the script locates the prompt textarea via DOM selectors. If NovelAI updates their UI structure, the script may break until selectors are updated.
- **Generation detection** — polling-based at 1-second intervals; may miss rapid state transitions.
- **Background tab throttling (known bug)** — queue speed can slow down when the NovelAI tab is not visible (for example while alt-tabbing away). Keeping NovelAI visible side-by-side (multi-window) or in the active window is usually much faster; in many runs, generation averages around ~10 seconds per image.
- **No automatic retry** — network failures during queue runs are not retried automatically.
- **Storage size** — `GM_setValue` is backed by the browser's extension storage; very large libraries may hit size limits.
- **Browser support** — primarily tested on Chrome and Firefox with Tampermonkey.

---

## Contributing

Bug reports, feature requests, and pull requests are welcome.

### Reporting Issues

1. Open an [issue](../../issues) and describe the problem clearly
2. Include your browser, Tampermonkey version, and the current script version (shown in the panel footer)
3. If the panel fails to load, open DevTools console and paste any relevant errors
4. If the issue is related to a NovelAI UI change, note which element or selector appears to be broken

### Pull Requests

1. Fork the repository and create a branch from `main`
2. All logic lives in the single `ekphrasis.user.js` file — keep it that way (no module splitting)
3. Follow the existing style: ES6+, 2-space indent, no external dependencies
4. Update `@version` in the UserScript header **and** `CONFIG.VERSION` in the script body — both must be in sync
5. Add a brief entry to `CHANGELOG.md` under a new version heading
6. Submit the PR with a clear description of what changed and why

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full version history.

**Recent releases:**

| Version | Date | Summary |
|---|---|---|
| [4.0.1](CHANGELOG.md#401--may-2026) | May 2026 | UI polish release — smoother dragging, clearer contrast, branded header/reopen icon, Help/About refresh |
| [4.0.0](CHANGELOG.md#400--may-2026) | May 2026 | Schema v4 — unified library/settings/session docs, stable ID-based linking, direct `library.json` export/import |
| [3.9.1](CHANGELOG.md#391--may-2026) | May 2026 | Brand design system — `--ekp-*` CSS tokens, IBM Plex fonts, SVG logos, landing page redesign |
| [3.9.0](CHANGELOG.md#390--may-2026) | May 2026 | Negative template click-to-apply + Anlas auto-detection from live NAI DOM |
| [3.8.0](CHANGELOG.md#380--may-2026) | May 2026 | Anlas Calculator footer strip — Opus toggle, Precise Ref, Vibe Transfer |
| [3.7.0](CHANGELOG.md#370--may-2026) | May 2026 | T5 Token Counter + Model-Aware Quality Tags footer strip |
| [3.6.0](CHANGELOG.md#360--may-2026) | May 2026 | Negative Template UI — CRUD, positive→negative linking, N badge |
| [3.3.0](CHANGELOG.md#330--march-2026) | Mar 2026 | Composition Bundles — flat grid of 15 named presets replacing the tab system |
| [3.2.3](CHANGELOG.md#323--march-2026) | Mar 2026 | Batch Raw Import modal |

---

## License

[MIT](LICENSE)
