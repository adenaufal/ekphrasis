# Todo — Ekphrasis v4.0.2+

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
- [ ] Keyboard shortcuts: `Ctrl+Enter` apply, `Ctrl+Shift+Enter` queue, `Ctrl+.` toggle panel

