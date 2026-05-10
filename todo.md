# Todo — Ekphrasis v4.1.0+

## ✅ ETA UX Improvement — DONE (v4.0.3)

| Component | Status |
|---|---|
| 2-line inline ETA widget (clock ETA prominent, duration+avg/item secondary) | ✅ |
| All queue states (running/paused/calibrating/done/ready/empty) clear labels | ✅ |

---

## ✅ Quick Wins — DONE (v4.1.0)

| Component | Status |
|---|---|
| Template live search/filter (filters by name + content) | ✅ |
| Keyboard shortcuts: `Ctrl+Enter` start/resume, `Ctrl+.` pause, `Ctrl+Shift+.` stop | ✅ |

---

## ✅ UI Icon Cleanup — DONE (v4.0.2)

| Component | Status |
|---|---|
| Emoji → SVG icons in section headers, footer strips, action buttons | ✅ |
| `.nai-ext-neg-badge` CSS class (replaces inline `#dc2626` style) | ✅ |
| Collapsible chevrons `−`/`+` → `▾`/`▸` | ✅ |

---

## ✅ Panel Polish — DONE (v4.0.1)

| Component | Status |
|---|---|
| Header brand icon + SemVer badge | ✅ |
| Pointer-event drag + rAF transform previews | ✅ |
| Help modal redesign (About section, improved contrast) | ✅ |
| Minimize state persistence in settings storage | ✅ |

---

## ✅ Schema v4 Alignment — DONE (v4.0.0)

| Component | Status |
|---|---|
| `ekphrasis.library.v4` / `settings.v4` / `session.v4` storage docs | ✅ |
| Direct `library.json` export | ✅ |
| Full v4 / partial v4 / legacy v3 import | ✅ |
| Unified template IDs + `linkedNegativeId` | ✅ |
| Placeholder metadata (`ph_*`, `createdAt`, `updatedAt`) | ✅ |
| Category metadata (`cat_*`) + stable rename/delete behavior | ✅ |
| Queue resume serialized as `session.json` items | ✅ |
| Migration `nai_ext_*` → v4 without auto-deleting legacy keys | ✅ |

---

## Next Up

- [ ] Preview combinations before queuing
- [ ] Random delay range between generations
- [ ] CSV import for paired placeholder rows
- [ ] Seed management + sampler preset manager
- [ ] Reference image libraries (Precise Ref / Vibe Transfer)
- [ ] Art style presets UI (STYLE_PRESETS data exists; needs tab/panel)

---

## Backlog (from feature brainstorm)

- [ ] **Favorite/pin template** — ⭐ pin templates to top of list; needs storage flag + sort priority
- [ ] **Queue schedule** — "Start at…" time picker for overnight batch automation
- [ ] **Session stats widget** — total generated, estimated anlas consumed, success rate this session
- [ ] **Per-template notes** — short description field per template, shown on hover preview
- [ ] **Auto-pause on anlas threshold** — warning/pause when anlas drops below user-set value
- [ ] **Queue item edit inline** — edit prompt in queue before run without delete-re-add
- [ ] **Generation log / history** — list successfully generated items in the current session

