# Todo — Ekphrasis v3.6.0+

## ✅ Step 1: Negative Template UI — SELESAI (v3.6.0)

| Komponen | Status |
|---|---|
| Storage key `nai_ext_negative_templates_v3` | ✅ |
| `state.negativeTemplates[]` | ✅ |
| Tab Positive/Negative di Templates panel | ✅ |
| CRUD negative templates (add/edit/delete) | ✅ |
| Link template → negativeId via modal edit | ✅ |
| Badge "N" di positive template list | ✅ |
| Index-shift safety on delete | ✅ |
| Preview negative di footer | ✅ |
| `applyPrompt()` graceful fallback | ✅ |
| "Both" button tooltip when no neg linked | ✅ |
| `renderNegativeTemplates()` di init & import | ✅ |

---

## Step 2: T5 Token Counter + Model-Aware Quality Tags

- [ ] Live T5 token count display near prompt textarea (~512 limit)
- [ ] Model selection change → auto-suggest quality tags per model:
  - V4.5 Full: `masterpiece, very aesthetic, no text`
  - V4.5 Curated: `masterpiece, no text, -0.8::feet::, rating:general`
  - V4 Full: `no text, best quality, very aesthetic, absurdres`
  - V4 Curated: `amazing quality, very aesthetic, absurdres`
  - V3: `best quality, amazing quality, very aesthetic, absurdres`
- [ ] Build UI for existing `STYLE_PRESETS` in code

---

## Step 3: Anlas Calculator

- [ ] Track Precise Reference count (+5 Anlas each)
- [ ] Track Vibe Transfer count (+2 Anlas for 5th+)
- [ ] Opus plan mode: V4.5 Full = 0 Anlas base
- [ ] Display estimated Anlas per generation in footer

