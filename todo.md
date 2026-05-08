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

## ✅ Step 2: T5 Token Counter + Model-Aware Quality Tags — SELESAI (v3.7.0)

| Komponen | Status |
|---|---|
| `QUALITY_TAG_PRESETS` constant (5 model presets) | ✅ |
| `estimateT5Tokens()` — heuristic T5 counter | ✅ |
| `initTokenCounter()` — MutationObserver on NAI prompt | ✅ |
| Token count display `~N/512` (green/yellow/red) | ✅ |
| Strip 4 footer: model selector + quality tags panel | ✅ |
| 5 model buttons (V4.5 Full/Cur, V4 Full/Cur, V3) | ✅ |
| "Insert Quality Tags" → append to NAI prompt | ✅ |
| `state.settings.currentModel` persisted | ✅ |
| Migration for missing `currentModel` in loadState | ✅ |

---

## ✅ Step 3: Anlas Calculator — SELESAI (v3.8.0)

| Komponen | Status |
|---|---|
| `calculateAnlas()` — base + ref + vibe cost logic | ✅ |
| `updateAnlasUI()` — update badge + breakdown + counters | ✅ |
| Strip 5 footer: 💎 Anlas Calculator | ✅ |
| Opus plan toggle (V4.5 Full = 0 Anlas) | ✅ |
| Precise Ref spinner (+5 Anlas each) | ✅ |
| Vibe Transfer spinner (5th+ = +2 Anlas each) | ✅ |
| Cost breakdown panel (base / ref / vibe / total) | ✅ |
| Badge `N Anlas` (green/yellow/red) di footer bar | ✅ |
| `state.settings.opusPlan/preciseRefCount/vibeCount` persisted | ✅ |
| Migration di loadState untuk field baru | ✅ |
| Update Anlas saat model berubah di quality strip | ✅ |

---

## Semua Step Selesai! 🎉

Ekphrasis v3.8.0 — semua fitur dari roadmap Phase 4 selesai:
- v3.6.0: Negative Template UI
- v3.7.0: T5 Token Counter + Model-Aware Quality Tags
- v3.8.0: Precise Reference Tracker + Anlas Calculator

