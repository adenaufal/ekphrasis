# Ekphrasis — Storage Schema v4

> Schema design for the unified library format shared across Ekphrasis Studio (userscript) and Ekphrasis Core (CLI).

---

## Goals

1. **Single source of truth** — Studio and Core read/write the exact same format
2. **Portable** — exportable as plain JSON; user owns their data, no proprietary container
3. **Versioned** — schema upgrades are explicit, with deterministic migration paths
4. **Stable references** — IDs everywhere, no array-index linking
5. **Future-proof** — reserved fields documented to prevent collision in patch releases

---

## File layout

### Core (CLI)

```
~/.config/ekphrasis/
├── library.json       # templates, placeholders, categories — the long-lived stuff
├── settings.json      # user preferences — UI, queue defaults, model config
├── session.json       # transient: current queue state, last-used template
└── history/           # optional: per-run logs, generation metadata (CLI-only)
```

### Studio (userscript)

The same three documents, mirrored into `localStorage` via `GM_setValue`:

| Storage key | Maps to |
|---|---|
| `ekphrasis.library.v4` | `library.json` |
| `ekphrasis.settings.v4` | `settings.json` |
| `ekphrasis.session.v4` | `session.json` |

Studio's export button produces the same `library.json` shape Core reads. There is no translation layer. The file you export from Studio today is the file Core consumes tomorrow.

---

## library.json

```json
{
  "schemaVersion": 4,
  "exportedAt": "2026-05-08T12:34:56Z",
  "exportedBy": "ekphrasis-studio/4.0.0",

  "templates": [
    {
      "id": "tpl_01HXYZABCDEF",
      "type": "positive",
      "name": "Cute girl portrait",
      "content": "1girl, {hair}, {eyes}, masterpiece",
      "categoryId": "cat_portraits",
      "linkedNegativeId": "tpl_01HABCDEF123",
      "tags": ["sfw", "portrait"],
      "createdAt": "2026-01-12T08:22:11Z",
      "updatedAt": "2026-05-08T12:34:56Z"
    },
    {
      "id": "tpl_01HABCDEF123",
      "type": "negative",
      "name": "Standard NAI negative",
      "content": "lowres, bad anatomy, worst quality",
      "categoryId": null,
      "linkedNegativeId": null,
      "tags": ["default"],
      "createdAt": "2026-01-12T08:22:11Z",
      "updatedAt": "2026-01-12T08:22:11Z"
    }
  ],

  "placeholders": {
    "ph_01HX0HAIR12345": {
      "id": "ph_01HX0HAIR12345",
      "shortName": "hair",
      "label": "Hair",
      "values": ["long black hair", "short blonde hair", "twintails"],
      "createdAt": "2026-01-12T08:22:11Z",
      "updatedAt": "2026-01-12T08:22:11Z"
    },
    "ph_01HX0EYES12345": {
      "id": "ph_01HX0EYES12345",
      "shortName": "eyes",
      "label": "Eyes",
      "values": ["blue eyes", "red eyes", "heterochromia"],
      "createdAt": "2026-01-12T08:22:11Z",
      "updatedAt": "2026-01-12T08:22:11Z"
    }
  },

  "categories": [
    {
      "id": "cat_portraits",
      "label": "Portraits",
      "color": "#FF7A90",
      "createdAt": "2026-01-12T08:22:11Z"
    }
  ]
}
```

### Key decisions

**Templates unified, not split.** v3 had separate `nai_ext_templates_v3` and `nai_ext_negative_templates_v3`. v4 unifies them with `type: "positive" | "negative"`. Same fields, same lifecycle, easier filtering, simpler import/export, simpler UI logic. Filtering by type is one line; maintaining two parallel arrays is forever-tax.

**ULID-style IDs.** Readable and sortable by creation time. Format: `tpl_` / `ph_` / `cat_` prefix + ULID body. Stable across renames, safe for linking, and chronologically meaningful when sorted lexically. Never use array indices for cross-references — that bug class dies in v4.

**`linkedNegativeId` replaces `negativeId`.** Same concept, clearer name. Only meaningful when `type === "positive"`; on negative templates it's always null.

**Placeholders keyed by ULID, with `shortName` as a separate field.** Templates reference placeholders via `{shortName}` syntax (e.g. `{hair}`), but storage identity is the ULID. At load time, Studio and Core build a `Map<shortName, ULID>` resolver. This means:

- `shortName` can be renamed safely — identity stays stable
- Rename UX: surface a confirmation modal that previews how many templates will have their content rewritten, then perform the rewrite atomically against the resolver
- `shortName` must be unique across the placeholder set (enforced at write time)
- Cloud sync, sharing, and history all reference ULIDs — never the user-mutable name

**Categories optional.** `categoryId: null` is valid. No "default category" requirement, no forced bucket.

**Timestamps everywhere.** `createdAt` immutable, `updatedAt` bumped on edit. Enables recency sorting, conflict detection in any future cloud sync, and traceable audit when debugging weird state.

---

## settings.json

```json
{
  "schemaVersion": 4,
  "ui": {
    "theme": "dark",
    "panelPosition": "right",
    "panelWidth": 420,
    "panelMinimized": false,
    "showKeyboardHints": true,
    "showT5TokenCount": true
  },
  "queue": {
    "delayMs": 3000,
    "delayJitterMs": 500,
    "stopOnError": true,
    "imagesPerCall": 1,
    "retryOnFailure": false,
    "retryMaxAttempts": 0
  },
  "model": {
    "preferred": "v4-5-full",
    "autoApplyQualityTags": true,
    "qualityTagsByModel": {
      "v4-5-full":    "masterpiece, very aesthetic, no text",
      "v4-5-curated": "masterpiece, no text, -0.8::feet::, rating:general",
      "v4-full":      "no text, best quality, very aesthetic, absurdres",
      "v4-curated":   "amazing quality, very aesthetic, absurdres",
      "v3":           "best quality, amazing quality, very aesthetic, absurdres"
    }
  },
  "anlas": {
    "trackCost": true,
    "warnAboveThreshold": 100,
    "opusFreePlan": true
  },
  "core": {
    "outputDir": "~/Pictures/ekphrasis",
    "naiCachePath": null,
    "scrapeBrowserCache": false
  }
}
```

Settings are flat enough to merge cleanly across Studio and Core. CLI-specific options live under the `core` namespace and are ignored by Studio. UI-only options under `ui` are ignored by Core. No cross-pollution, no surprise interactions.

---

## session.json

Transient state. Studio rewrites this on every queue change. Core rewrites it during long-running batch jobs so the user can inspect progress externally.

```json
{
  "schemaVersion": 4,
  "lastUsedTemplateId": "tpl_01HXYZABCDEF",
  "queue": {
    "items": [
      {
        "id": "queue_01HZZZ987654",
        "templateId": "tpl_01HXYZABCDEF",
        "resolvedPrompt": "1girl, long black hair, blue eyes, masterpiece",
        "negativePrompt": "lowres, bad anatomy, worst quality",
        "model": "v4-5-full",
        "status": "pending",
        "createdAt": "2026-05-08T12:34:56Z",
        "startedAt": null,
        "completedAt": null,
        "error": null
      }
    ],
    "running": false,
    "currentIndex": 0
  }
}
```

`status` enum: `"pending" | "running" | "done" | "failed" | "skipped"`.

Session is regenerable. Losing it loses queue progress, nothing more. Don't ever store user library data here — that goes in `library.json`.

---

## Migration v3 → v4

Runs once on first load of Studio v4.x. Idempotent — safe to re-run if migration flag gets cleared.

Steps:

1. Read all `nai_ext_*_v3` keys (templates, negative templates, placeholders, categories, settings)
2. Generate ULID-style IDs for every template, placeholder, and category
3. Build a v3-index → new-ID lookup table for templates
4. Resolve `negativeId` (array index) → `linkedNegativeId` (template ID) using the lookup
5. Unify positive + negative templates into a single `templates` array with `type` field
6. Convert placeholder array structure to keyed-object structure
7. Write `ekphrasis.library.v4`, `ekphrasis.settings.v4`
8. Set migration flag in localStorage (`ekphrasis.migrated.v4 = true`)
9. Leave v3 keys in place for rollback safety; manual cleanup via Settings panel later

The migration code is the only place where v3 array-index semantics survive. After v4 is stable and adopted, v3 keys can be deleted via a settings action — but never automatically.

---

## Export / import

**Export** writes `library.json` directly. No transformation, no envelope, no compression. The file Studio writes today is the file Core reads tomorrow.

**Import** accepts:

- A v4 bundle → merge or replace (user choice via modal)
- A v3 export → run migration logic in-memory, then import as v4
- A partial bundle (e.g. just templates, no placeholders) → merge into existing library, untouched fields preserved

**Conflict resolution on merge** — when both sides have the same ID with different content:

- Default: prefer the higher `updatedAt`
- Override: surface conflicts in UI for per-item user decision
- Never: silently overwrite without indication

---

## Reserved fields

These names are reserved now to prevent accidental collision in v4.x patch releases. Don't use them for unrelated purposes; v4.1+ may populate them.

| Field | Future use |
|---|---|
| `templates[].hooks` | Pre-apply / post-apply scripting hooks |
| `templates[].variables` | Template variables with defaults, conditionals |
| `templates[].metrics` | Generation count, success rate, last-used timestamp |
| `library.collections` | Grouping above categories (e.g. "client work", "personal OCs") |
| `library.signatures` | Content-hash for sync conflict detection |
| `settings.sync` | Cloud sync config (provider, credentials reference, last sync) |

---

## CLI compatibility checklist

When designing any new schema field, ask:

1. Can the CLI read this without DOM access? *(no `document.querySelector` semantics baked in)*
2. Can the CLI write this without browser APIs? *(no `localStorage`-only assumptions)*
3. Does this field have meaning when no NAI tab is open? *(no UI-only state mixed into library)*

If any answer is no, the field belongs in `settings.json` (under a namespace) or `session.json`, not `library.json`. Library is sacred — it's the user's portable data.

---

## Versioning policy

- `schemaVersion: 4` is the v4.x line. All v4.x patches are read-compatible with each other.
- Adding optional fields → no version bump. Readers ignore unknown fields.
- Adding required fields, renaming fields, changing field semantics → bump to `schemaVersion: 5`, ship a migration v4 → v5.
- Removing fields → bump to `schemaVersion: 5`, with a deprecation period in v4.x patches that surface a console warning when the field is read.

Studio and Core ship in lockstep on schema version. Mismatches refuse to load with a clear error message pointing to the upgrade path.

---

This schema is the contract. Studio and Core both honor it. Breaking changes bump `schemaVersion` and ship a migration. No exceptions, no shortcuts, no "just this once."
