# Ekphrasis — Philosophy

> *"Ekphrasis: the rhetorical device of vividly describing a visual work of art through words."* — from Greek ἔκφρασις (ekphrasis), "description"

---

## Origin & naming

Homer described Achilles' shield for 130 lines in the Iliad before any visual existed. That's ekphrasis — text precedes image, always has. Naming this tool Ekphrasis isn't aesthetics; it's the thesis.

Prompt engineering is the modern continuation of a 2,800-year-old craft: turning structured intent into images via language. Most NAI tooling treats prompts as a tag-soup problem to be autocompleted. Ekphrasis treats prompts as composition — the same way a writer composes prose.

---

## Positioning

> **Treat NovelAI as a render engine. Bring your own studio.**

Ekphrasis is not a NAI UI improver. NAI is the engine; Ekphrasis is the studio that feeds it. Templates, placeholders, queue management, batch automation — all of it lives in Ekphrasis, agnostic of which UI NAI ships next month.

This positioning sets up a specific anti-frame:

- **Not** a tag autocompleter — those exist; that's not the bottleneck for power users
- **Not** a NAI feature wishlist client — don't fix NAI, build alongside it
- **Not** an image-side tool — no controlnet wrappers, no vibe-transfer UIs, text-side discipline only
- **Not** multi-engine — NAI-specific by design, every assumption is a NAI assumption

---

## Users

### Primary: NAI power user

Knows the syntax. Has hundreds of generations behind them. Tired of typing the same scaffolding. Wants templates, queue, batch, keyboard shortcuts, and eventually a CLI to make full use of their Opus quota overnight. Treats prompt engineering as craft.

### Secondary: OC creator transitioning from manual prompting

Has characters, has style references, doesn't want to memorize V4.5 syntax just yet. Wants visual scaffolding — composition bundles, placeholder library — that produces structured prompts they can learn from. Graduates into the primary user over time.

Ekphrasis serves the primary without dumbing down for the secondary. The secondary is supported through visual scaffolding, not through softened tone or oversimplified affordances. The product is opinionated; the documentation is friendly.

---

## Design principles

### 1. Terminal-first aesthetic

Monospace-leaning typography. Dark canvas. Restrained palette — one or two accents, no rainbow. Density over generous spacing. The userscript should feel adjacent to a terminal, not adjacent to Notion. This is the visual language of the primary user, and it's the language Core (CLI) will inherit natively when it ships.

### 2. Keyboard-first interaction

Every action has a shortcut. Every shortcut is visible. The command palette (Cmd+K) is the central nervous system, not a feature shoved in late. Mouse is fallback, not default. If a power user has to reach for the mouse for a common action, the design failed.

### 3. Composable, not monolithic

Borrowed from Unix: do one thing well. Ekphrasis turns structured intent into prompts. It doesn't download images, doesn't browse galleries, doesn't chat with the user. It does prompts. Adjacent jobs belong in adjacent tools.

### 4. Text precedes image

The thesis applied as a constraint. Ekphrasis lives entirely in the text domain. No image previews of generated outputs inside the panel. No image-based search. No vibe-transfer UI. The prompt is the artifact; the image is downstream.

### 5. Versioned, portable, exportable

Everything a user creates — templates, placeholders, settings — is exportable as plain JSON. The same JSON the CLI reads. No vendor lock to localStorage. No proprietary formats. A user's library is theirs to back up, version, share, fork, regret, restore.

---

## Product surfaces

Ekphrasis ships in two complementary forms. Neither is "the real version."

### Ekphrasis Studio — the userscript

Lives on `novelai.net/image`. Visual composition, template browsing, queue setup, real-time placeholder substitution, composition bundles. Designed for the iterative, exploratory phase of prompt work — when you're still figuring out what you want.

### Ekphrasis Core — the CLI

Standalone binary. Reads the same JSON library Studio writes. Designed for batch generation, headless automation, scripting integration, and pulling generations directly from NAI's browser image cache without manual saving. The tool you reach for when you know what you want and you want twenty of it overnight.

A user can live in either, switch freely, or use both in tandem — compose in Studio, batch in Core.

---

## Brand voice

- **Direct, not chatty.** Ekphrasis doesn't have a personality avatar. It speaks through good defaults.
- **Greek-rooted, not Greek-themed.** The name carries philosophical weight; the UI doesn't need columns, laurels, or marble textures. Don't be on-the-nose.
- **Confident, not arrogant.** Opinionated defaults, every opinion overridable.
- **Bilingual-aware.** Documentation primarily English; Indonesian where the audience benefits — README, onboarding, error messages users will actually read.

---

## What Ekphrasis is NOT

A clear list, kept short, updated as drift attempts surface:

- Not a NAI replacement
- Not a generic Stable Diffusion frontend
- Not a marketplace, social platform, or community hub
- Not a model trainer or finetuner
- Not multi-engine (Midjourney, DALL-E, etc.)
- Not free-tier-only — built for users who run heavy and pay for it
- Not a wrapper that pretends to be the engine

---

## Decision filter

Every UI decision, feature pitch, and visual identity choice gets checked against this document. If the decision conflicts with what's written here, one of two things happens:

1. The decision loses, or
2. The document is updated explicitly, with a dated note explaining what shifted and why.

No silent drift. Either the philosophy holds, or it evolves on the record.
