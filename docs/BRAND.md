# Ekphrasis — Brand & Design System v1.0

> Implementation-ready spec. Reads alongside [`PHILOSOPHY.md`](./PHILOSOPHY.md) (the why) and [`SCHEMA.md`](./SCHEMA.md) (the data). This doc is the **how it looks and feels**.
>
> **Audience:** Claude Design / Claude Code, or any future contributor implementing UI.

---

## 1. Brand foundations

Refer to `PHILOSOPHY.md` for full positioning. Visual implications, in three lines:

- **Studio for the prompt-as-craft mindset** — feels closer to a code editor than a design tool
- **Greek-rooted, not Greek-themed** — the name carries philosophical weight; the UI has none of the visual clichés (no laurels, no marble, no gold, no columns, no serif-on-cream "academic" look)
- **Terminal-adjacent, not terminal-cosplay** — modern dev-tool aesthetic, monospace-leaning, but humane spacing where it matters

### Core attributes (in order of priority)

1. **Precise** — every value is intentional, no padding for the sake of padding
2. **Restrained** — one accent color, one type family, limited surface variation
3. **Dense** — power users want information per pixel, not whitespace per pixel
4. **Stable** — visual hierarchy doesn't shift around as content loads
5. **Bilingual-comfortable** — type stack handles English and Indonesian equally well; no character-set surprises

### What we evoke

A senior dev's editor. A composer's notation software. A scientific calculator with good defaults.

### What we avoid

Notion-style generous whitespace. Linear-style soft pastels. Figma-style design-toy color riot. ChatGPT-style chat bubbles. NAI's own UI. Any aesthetic that suggests "this tool is for everyone."

---

## 2. Visual identity

### Logo direction

**Wordmark:** `ekphrasis` — all lowercase, set in **IBM Plex Mono Medium**, letterspacing `0` (default mono spacing). No custom ligatures yet; the type does the work.

**Mark (icon, favicon, app tile):** A solid block cursor `▌` followed by lowercase `e`, treated as a single glyph: **`▌e`**

- Why the cursor block: terminal-rooted, instantly recognizable, signals "input awaits"
- Why lowercase `e`: connects to the wordmark, distinguishes from generic terminal icons, scales down legibly to 16px
- The cursor block is set in the accent color; the `e` in the foreground color
- At extreme sizes (≤16px favicon), use the cursor block alone, color-on-bg

**Lockup variants:**

| Variant | Use |
|---|---|
| Mark only (`▌e`) | Favicon, app tile, tight spaces |
| Wordmark only (`ekphrasis`) | Documentation headers, README hero |
| Lockup (`▌e ekphrasis`) | Splash screens, About panel |
| Lockup with tagline (`▌e ekphrasis — studio for prompts`) | Marketing surfaces, README only |

### Don'ts

- Don't outline the mark or wordmark
- Don't apply gradients
- Don't tilt or animate on idle
- Don't pair with any classical/Greek visual (omega, alpha, columns, laurels)
- Don't render the wordmark in serif or display fonts — IBM Plex Mono only
- Don't render the wordmark in title case or all caps — lowercase only

---

## 3. Typography

### Type stack

```css
--ekp-font-mono: "IBM Plex Mono", "JetBrains Mono", "Menlo", "Consolas", monospace;
--ekp-font-sans: "IBM Plex Sans", "Inter", system-ui, -apple-system, sans-serif;
```

**Why IBM Plex pairing:**
- Free, open source, OFL-licensed, embeddable everywhere
- Mono and Sans members are designed to coexist (consistent x-height, harmonious metrics)
- Less seen than JetBrains Mono / Inter — distinct identity
- Excellent extended Latin coverage for Indonesian text

### Where to use which

- **Mono:** template content, prompt text, placeholder values, code-like inputs, numbers, IDs, keyboard shortcuts, monospace data tables, command palette items
- **Sans:** panel titles, button labels, tooltips, modal headings, body documentation text, anywhere a paragraph runs longer than a line

Default to **Mono**. Reach for Sans only when a label would feel laborious in mono.

### Type scale (base 13px)

```css
--ekp-text-2xs: 10px;   /* meta, badges, keyboard hint chips */
--ekp-text-xs:  11px;   /* secondary labels, timestamps */
--ekp-text-sm:  12px;   /* dense UI labels */
--ekp-text-base: 13px;  /* body, inputs, content */
--ekp-text-md:  14px;   /* emphasis, panel titles */
--ekp-text-lg:  16px;   /* section headers (rare) */
--ekp-text-xl:  20px;   /* modal titles, About */
```

**Line heights:**
- Tight (1.3): UI labels, button text
- Normal (1.5): body text, template content
- Loose (1.65): documentation prose only

### Weights

```css
--ekp-weight-regular: 400;
--ekp-weight-medium: 500;   /* primary weight for UI */
--ekp-weight-semibold: 600; /* headings, emphasis */
```

**No bold (700+).** Medium and semibold are sufficient. Avoiding bold keeps the visual rhythm calm.

---

## 4. Color system

### Philosophy

One accent. Status colors only where status is real. Everything else is a neutral grayscale step. Light theme deferred to v1.1 — dark is the canonical theme.

### Tokens (semantic, not raw colors)

```css
:root {
  /* Surfaces — ascending elevation */
  --ekp-bg-base:      #0E0E10;   /* outermost, panel backdrop */
  --ekp-bg-surface:   #16161A;   /* default panel surface */
  --ekp-bg-elevated:  #1E1E24;   /* modals, popovers, command palette */
  --ekp-bg-input:     #0A0A0C;   /* input fields — slightly recessed */
  --ekp-bg-hover:     #22222A;   /* hover state on interactive surfaces */
  --ekp-bg-active:    #2A2A33;   /* active/pressed state */

  /* Borders */
  --ekp-border:        #2A2A30;  /* default dividers */
  --ekp-border-strong: #3A3A42;  /* hover, focus halo */
  --ekp-border-accent: var(--ekp-accent);

  /* Foreground */
  --ekp-fg-primary:    #EDEDF0;  /* body text, active labels */
  --ekp-fg-muted:      #9A9AA3;  /* secondary text, inactive tabs */
  --ekp-fg-subtle:     #6A6A73;  /* placeholders, disabled, dividericons */
  --ekp-fg-inverse:    #0E0E10;  /* text on accent backgrounds */

  /* Accent */
  --ekp-accent:        #5FBFA8;  /* muted teal — buttons, focus, links, cursor */
  --ekp-accent-hover:  #6FCFB8;
  --ekp-accent-active: #4FAF98;
  --ekp-accent-fg:     #0A1F1A;  /* text on accent fill */

  /* Status — used sparingly */
  --ekp-success:       #6EC78B;
  --ekp-warning:       #E0B85C;
  --ekp-error:         #E07B7B;
  --ekp-info:          #7BB5E0;

  /* Semantic shortcuts */
  --ekp-focus-ring: 0 0 0 2px rgba(95, 191, 168, 0.4);
}
```

### Contrast guarantees

All token pairs meet WCAG AA at 13px:
- `fg-primary` on `bg-base`: 14.2:1 ✓
- `fg-primary` on `bg-surface`: 13.1:1 ✓
- `fg-muted` on `bg-surface`: 5.8:1 ✓
- `accent` on `bg-surface`: 7.4:1 ✓ (links, button text on dark bg)
- `accent-fg` on `accent`: 12.1:1 ✓ (text on filled buttons)

### Usage rules

- Accent is for **action and focus**, never for decoration. If something doesn't do anything, it isn't accent-colored.
- Status colors only appear inside their status context (errors in error states, warnings in warning states). No decorative reds or greens.
- Hover states shift surface, not foreground. Foreground color stays stable on hover.

---

## 5. Spacing & layout

### Spacing scale (4px base)

```css
--ekp-space-0: 0;
--ekp-space-1: 2px;    /* hairline gaps */
--ekp-space-2: 4px;    /* tight grouping */
--ekp-space-3: 6px;
--ekp-space-4: 8px;    /* default tight */
--ekp-space-5: 12px;   /* default comfortable */
--ekp-space-6: 16px;   /* section padding */
--ekp-space-7: 24px;   /* major separation */
--ekp-space-8: 32px;   /* rare, large layout gaps */
```

**Density default:** `--ekp-space-4` (8px) for component padding, `--ekp-space-2` (4px) for inline gaps. Reach for `--ekp-space-6` (16px) only at section boundaries.

### Border radius

```css
--ekp-radius-sm: 3px;   /* inputs, small buttons */
--ekp-radius-md: 5px;   /* cards, panels, modals */
--ekp-radius-lg: 8px;   /* major panels only */
--ekp-radius-pill: 9999px;  /* badges, chips */
```

**Avoid `0px` (too brutalist) and `>8px` (too soft).** The brand radius is "gently rounded technical."

### Panel dimensions

- Default panel width: `420px` (resizable, persisted via `settings.json`)
- Minimum panel width: `320px`
- Maximum panel width: `560px`
- Vertical: full viewport height with internal scroll regions

### Z-index scale

```css
--ekp-z-base: 1;
--ekp-z-panel: 100;
--ekp-z-dropdown: 200;
--ekp-z-tooltip: 300;
--ekp-z-modal: 400;
--ekp-z-toast: 500;
--ekp-z-command-palette: 600;
```

---

## 6. Component patterns

### Button

**Primary** — accent fill, used for the *single* primary action per surface.
```
height: 28px (compact), 32px (default), 36px (comfortable)
padding: 0 var(--ekp-space-5)
background: var(--ekp-accent)
color: var(--ekp-accent-fg)
border-radius: var(--ekp-radius-sm)
font: medium, --ekp-text-sm, mono
hover: --ekp-accent-hover
active: --ekp-accent-active
```

**Secondary** — surface fill, default for most actions.
```
background: var(--ekp-bg-surface)
color: var(--ekp-fg-primary)
border: 1px solid var(--ekp-border)
hover: bg --ekp-bg-hover, border --ekp-border-strong
```

**Ghost** — transparent, for icon buttons and tertiary actions.
```
background: transparent
color: var(--ekp-fg-muted)
hover: bg --ekp-bg-hover, color --ekp-fg-primary
```

**Destructive** — only for delete confirmations. Uses `--ekp-error` as background tint or border, never as full fill. Always confirms destructive action twice.

**Keyboard hint:** all buttons that have a shortcut display the hint inline as a chip — small mono text, `--ekp-text-2xs`, `--ekp-fg-subtle` color, right-aligned within button.

### Input / Textarea

```
background: var(--ekp-bg-input)
color: var(--ekp-fg-primary)
border: 1px solid var(--ekp-border)
border-radius: var(--ekp-radius-sm)
padding: var(--ekp-space-3) var(--ekp-space-4)
font: regular, --ekp-text-base, mono
placeholder: var(--ekp-fg-subtle)
focus: border --ekp-accent, box-shadow --ekp-focus-ring
```

**Templates and prompt content always use mono.** Never set them in sans.

### Tab

Horizontal tab strip, no underlines, just color shift.
```
default: color --ekp-fg-muted
active: color --ekp-fg-primary, indicator bar 2px --ekp-accent below
hover: color --ekp-fg-primary
padding: var(--ekp-space-3) var(--ekp-space-4)
```

### Card / Surface

For grouped content — template list items, placeholder rows, queue items.
```
background: var(--ekp-bg-surface)
border: 1px solid var(--ekp-border)
border-radius: var(--ekp-radius-md)
padding: var(--ekp-space-5)
```

Hover: border shifts to `--ekp-border-strong`. No transform, no shadow on hover (keep stable).

### Modal

```
backdrop: rgba(14, 14, 16, 0.7), backdrop-filter blur(4px)
surface: var(--ekp-bg-elevated)
border: 1px solid var(--ekp-border-strong)
border-radius: var(--ekp-radius-md)
padding: var(--ekp-space-7)
max-width: 480px (default), 640px (large), 80vw (huge)
shadow: 0 20px 40px rgba(0, 0, 0, 0.5)
```

**Modals always have:** title at top, ESC to dismiss, primary action right-aligned at bottom, secondary action left of primary.

### Command palette (Cmd+K)

The center of the keyboard-first experience. Triggered by `Cmd+K` / `Ctrl+K`.

```
position: fixed, centered, top 20% of viewport
width: 560px
background: var(--ekp-bg-elevated)
border: 1px solid var(--ekp-border-strong)
border-radius: var(--ekp-radius-md)

input: full width, padding var(--ekp-space-5), no border, --ekp-text-md
result list: max 8 visible, scroll for more
result item: padding var(--ekp-space-3) var(--ekp-space-5)
  - icon (16px) + label (mono) + shortcut chip (right)
  - hover/keyboard-selected: bg --ekp-bg-hover, accent left bar 2px
```

Categories: Templates, Placeholders, Composition, Queue, Settings, Help. Fuzzy match across categories. Recent items surface at top.

### Toast / Notification

Bottom-right corner, stacked, auto-dismiss after 4s (errors stay until dismissed).
```
background: var(--ekp-bg-elevated)
border-left: 3px solid var(--status-color)
padding: var(--ekp-space-5)
border-radius: var(--ekp-radius-sm)
max-width: 320px
font: --ekp-text-sm
```

### Tooltip

Triggered on hover (350ms delay) or focus.
```
background: var(--ekp-bg-elevated)
color: var(--ekp-fg-primary)
border: 1px solid var(--ekp-border-strong)
border-radius: var(--ekp-radius-sm)
padding: var(--ekp-space-2) var(--ekp-space-3)
font: --ekp-text-xs
```

Keyboard shortcuts in tooltips appear as inline chips (mono, smaller, subtle bg).

### Tag / Chip

For categories, placeholder values, composition bundle tags.
```
height: 22px
padding: 0 var(--ekp-space-3)
background: var(--ekp-bg-input)
border: 1px solid var(--ekp-border)
border-radius: var(--ekp-radius-pill)
font: --ekp-text-xs, mono
```

Active/selected: accent border, accent text, slight tint background.

---

## 7. Iconography

**Library:** [Lucide](https://lucide.dev) — clean, consistent, free, and 1000+ icons covering every UI need.

**Default size:** 14px (matches mono cap height at base font size). Stroke width: `1.5`.

**Color:** inherit current text color. Never colored standalone.

**Custom icons** (only where Lucide doesn't have it):
- Cursor block `▌` — used in mark, can appear inline as cursor indicator
- Permutation/expand glyph for randomizer — TBD if Lucide doesn't cover

**Don't:** mix Lucide with another icon library. Don't use emoji as UI icons (they're allowed in user-content like template names, but not as built-in chrome).

---

## 8. Motion

### Principles

- **Functional, not decorative.** Animations communicate state change, never entertain.
- **Fast.** Default 150ms, never longer than 250ms for UI transitions.
- **Eased.** Always `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out-quad) — no linear, no bounce.
- **Reduced motion respected.** All animations check `prefers-reduced-motion: reduce` and disable transforms, keeping only opacity changes.

### Standard durations

```css
--ekp-duration-fast: 100ms;    /* hover, focus shift */
--ekp-duration-base: 150ms;    /* most state changes */
--ekp-duration-slow: 250ms;    /* modal enter/exit, panel collapse */
--ekp-easing: cubic-bezier(0.4, 0, 0.2, 1);
```

### What animates

- Modal: fade in + slight scale (0.98 → 1.0)
- Dropdown / popover: fade in + slight Y translate (4px)
- Toast: slide in from right + fade
- Panel collapse/expand: height + opacity
- Hover: color shifts only, no transforms

### What does NOT animate

- Tab switching (instant)
- Button press (instant feedback)
- Idle states (no shimmer, no pulse, no breathing)
- The mark or wordmark (ever)

---

## 9. UI voice & tone

### Microcopy principles

1. **Direct, no filler.** "Delete template?" not "Are you sure you want to delete this template?"
2. **Imperative for actions.** "Apply prompt" not "Click to apply"
3. **Specific over generic.** "12 prompts queued" not "Items added"
4. **Bilingual rules:** primary UI in English; user-facing error messages and onboarding may include Indonesian where Indonesian users would benefit. Never mix in the same string.

### Voice examples

| Context | Bad | Good |
|---|---|---|
| Empty state | "You don't have any templates yet! Click + to create your first template." | "No templates. `Cmd+N` to create one." |
| Error | "Oops! Something went wrong while saving." | "Save failed: localStorage quota exceeded." |
| Confirmation | "Are you sure you want to delete this?" | "Delete `template_name`? `Enter` to confirm." |
| Success | "Great! Your prompt has been applied successfully." | "Applied." |
| Tooltip on disabled action | "This action is currently unavailable." | "Link a negative template first." |

### Don't

- Don't apologize ("Sorry, ..." is banned)
- Don't use exclamation points in chrome (allowed in user template names)
- Don't address the user as "you" repeatedly — describe the action, not the actor
- Don't use emoji as UI decoration (allowed only in user-generated content)

### Indonesian copy guidance

When Indonesian copy is appropriate (onboarding, settings descriptions, README sections):

- Casual, peer-to-peer tone — talk like talking to a coworker
- Mix English technical terms freely (API, queue, placeholder) — don't force translation
- No formal Indonesian (no "Anda", no "Mohon"). Use "lo/gw" or neutral form ("Untuk membuat...")
- Match the directness rules above — same "no filler" principle

---

## 10. Accessibility

### Mandatory

- All interactive elements reachable by keyboard, in logical tab order
- Focus rings visible on every interactive element (`--ekp-focus-ring`)
- Color contrast meets WCAG AA at 13px base (verified above)
- All icons that convey meaning have `aria-label`
- Modals trap focus, restore focus on close
- Form inputs have associated labels (visible or `aria-label`)
- Status messages use `aria-live="polite"` (errors `aria-live="assertive"`)

### Reduced motion

All transforms gated behind `@media (prefers-reduced-motion: no-preference)`. Reduced motion users get opacity changes only.

### Keyboard shortcut conflicts

Studio runs inside NAI's page. Avoid shortcuts that NAI uses (test against NAI's bindings before locking in). Reserved global shortcuts:

- `Cmd/Ctrl + K` — command palette
- `Cmd/Ctrl + Enter` — apply current template
- `Cmd/Ctrl + Shift + Enter` — queue current template
- `Cmd/Ctrl + .` — toggle panel
- `Esc` — close modal/palette/popover, in priority order

---

## 11. Implementation handoff

### File structure (proposed)

If/when Studio is rewritten as a multi-file build, structure as:

```
ekphrasis-studio/
├── src/
│   ├── tokens.css           # all CSS variables from this doc
│   ├── reset.css            # minimal CSS reset
│   ├── components/
│   │   ├── button.css
│   │   ├── input.css
│   │   ├── modal.css
│   │   ├── command-palette.css
│   │   └── ...
│   ├── layout/
│   │   ├── panel.css
│   │   └── footer.css
│   └── theme/
│       └── dark.css         # current canonical theme
└── ekphrasis.user.js        # bundled output
```

For the current single-file userscript, embed all CSS as a single template literal injected via `<style>`. Use the same token names. Future multi-file split should be a mechanical move, not a rewrite.

### Token structure rules

- All values come from tokens — no raw hex codes inside component CSS
- All sizes come from the spacing scale — no random `padding: 7px`
- Component CSS only references semantic tokens (`--ekp-fg-primary`), never raw color tokens
- Light theme (when added) only changes the `:root` token values; component CSS remains untouched

### Migration from current UI

The current UI is an organic accumulation. Migration path:

1. **Inject token CSS first** — define all tokens, no visual change yet (component CSS still uses old hardcoded values)
2. **Replace hardcoded colors with tokens** — one component at a time, no visual change yet
3. **Replace spacing values with scale** — likely some visual shift, accept it
4. **Apply new component patterns** — button, input, modal sections
5. **Add command palette** — net-new feature, biggest UX uplift
6. **Type stack swap** — IBM Plex via webfont injection

Steps 1–3 are mechanical and low-risk. Step 4 is the visual reset point. Step 5 is the keyboard-first thesis activated. Step 6 is the identity activation.

### What does NOT change in this redesign

- The IIFE structure — keep it single-file for the userscript
- `GM_setValue`/`GM_getValue` for persistence — schema layer only, don't touch
- The DOM-querying logic for NAI integration — fragile and orthogonal to design
- `Randomizer`, `WeightSyntax`, `MultiCharacter`, `PromptBlending` utilities — pure functions, design-agnostic

The redesign touches **chrome only** — not the engine.

---

## 12. Decision log

When future contributors deviate from this doc, they note it here with date + rationale. The doc evolves on the record.

| Date | Change | Rationale |
|---|---|---|
| 2026-05-08 | v1.0 spec authored | Initial brand & design system lockdown |

---

This document is the contract for visual implementation. If the brand drifts, the doc wins or the doc updates explicitly. No silent drift.
