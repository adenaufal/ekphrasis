# Ekphrasis

A Tampermonkey userscript that adds a prompt studio panel to [NovelAI](https://novelai.net/image). Manage templates, placeholders, composition presets, and batch queues — all without leaving the page.

**Current version:** 3.2.3

---

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) for your browser
2. Click **[Install Ekphrasis](./ekphrasis.user.js)** — Tampermonkey will prompt automatically
3. Navigate to `https://novelai.net/image` — the panel will appear on the right

> **Manual install:** Open Tampermonkey dashboard → Create new script → paste contents of `ekphrasis.user.js`

---

## Features

### Templates
Save and reuse prompt snippets. Organize them with categories. Select one to preview it, then apply directly to the prompt field.

### Placeholders
Define named placeholder types (e.g. `artist`, `character`, `style`) and fill them with values. Use `{artist}` syntax in templates — the selected value gets substituted at apply time.

Multiple values can be selected to generate all combinations via the queue.

### Composition (Framing)
Quick-pick buttons for shot distance, camera angle, body focus, and pose. Click to toggle a tag directly into the prompt.

### Batch Queue
Generate permutations of templates × placeholder combinations automatically. Supports delay between generations to avoid rate limiting.

**Batch Raw Import** — klik 📋 di queue bar untuk paste banyak prompt sekaligus tanpa perlu template. Pisahkan tiap prompt dengan `---`:

```
a cute fox, masterpiece
---
wolf in forest, best quality
---
dragon, cinematic lighting
→ 3 items langsung masuk queue
```

### Weight Syntax
| Syntax | Effect |
|---|---|
| `1.5::tag::` | V4.5 — stronger emphasis |
| `0.8::tag::` | V4.5 — weaker emphasis |
| `-0.5::tag::` | V4.5 — suppress |
| `{tag}` | Legacy boost (×1.05 per brace) |
| `[tag]` | Legacy weaken (÷1.05 per bracket) |

### Randomizer
Use `||opt1|opt2|opt3||` in a template. At queue time, Ekphrasis expands every variant into separate queue entries.

```
||red|blue|green|| hair, ||smiling|neutral|| expression
→ 6 combinations generated
```

### Negative Prompt
Apply a negative prompt alongside the main prompt using the **Both** button. Negative templates can be linked to positive templates.

---

## Storage Keys

Data is stored in `localStorage` via Tampermonkey's `GM_getValue`/`GM_setValue`:

| Key | Content |
|---|---|
| `nai_ext_templates_v3` | Prompt templates |
| `nai_ext_negative_templates_v3` | Negative prompt templates |
| `nai_ext_placeholders` | Placeholder values per type |
| `nai_ext_categories` | Category list |
| `nai_ext_settings_v3` | Settings (delay, quality preset, etc.) |

Legacy keys (`v2`, `nai_ext_artists`) are auto-migrated on first run.

---

## Model-Specific Tags

| Tag | Description | Model |
|---|---|---|
| `fur dataset` | Furry art mode | V4+ |
| `background dataset` | No-character mode | V4.5+ |
| `rating:general` | Content rating | V4+ |
| `year XXXX` | Era-specific style | V3+ |

---

## Files

| File | Purpose |
|---|---|
| `ekphrasis.user.js` | The userscript (single file, install this) |
| `CHANGELOG.md` | Version history |
| `ROADMAP.md` | Planned features |
| `todo.md` | Active development tasks |
