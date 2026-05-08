# NovelAI Prompt Extension - Feature Roadmap

## Version History

| Version | Date | Summary |
|---------|------|---------|
| v1.0.0 | Dec 2025 | Templates, artist lists, basic queue |
| v2.0.0 | Jan 2026 | Multiple placeholders, categories, import/export, enhanced queue |
| v3.0.0 | Jan 2026 | Weight syntax, randomizers, quality presets, framing/composition, multi-character support |
| v3.1.0 | Jan 2026 | Minor fixes and polish |
| v3.2.3 | Mar 2026 | Batch Raw Import modal |
| v3.3.0 | Mar 2026 | Framing rework → Composition Bundles (flat grid, append-only, 15 named bundles) |
| v3.3.1 | Mar 2026 | Minor polish |
| v3.5.4 | May 2026 | Art style presets (STYLE_PRESETS), negative template storage, queue state persistence |
| v3.6.0 | May 2026 | Negative Template UI — CRUD, linking positive→negative, N badge, index-shift safety |
| v3.7.0 | May 2026 | T5 Token Counter (realtime badge) + Model-Aware Quality Tags (Strip 4 footer) |
| v3.8.0 | May 2026 | Anlas Calculator (Strip 5 footer) — Opus toggle, Precise Ref, Vibe Transfer |
| v3.9.0 | May 2026 | Negative template click-to-apply + Anlas auto-detection from live NAI DOM |
| v3.9.1 | May 2026 | Brand design system — dark theme tokens, IBM Plex fonts, SVG logos, landing page redesign |
| v4.0.0 | May 2026 | Schema v4 alignment — unified library/settings/session docs, ID-based linking, direct `library.json` export/import |

All v1–v4 shipped features are complete. See git history for details.

---

## 🚀 Phase 4: Planned

### 🔴 Active (in-progress)
- [x] **Negative Template UI** *(v3.6.0)* — CRUD tab + linking positive→negative, tombol Both fungsional
- [x] **T5 Token Counter** *(v3.7.0)* — live badge `~N/512` di footer, realtime via MutationObserver
- [x] **Model-Aware Quality Tags** *(v3.7.0)* — Strip 4 footer dengan 5 model preset + Insert button
- [x] **Estimated Anlas cost calculator** *(v3.8.0)* — Strip 5 footer, Opus toggle, Precise Ref (+5 ea), Vibe Transfer (5th+ +2 ea)
- [x] **Schema v4 storage alignment** *(v4.0.0)* — `library/settings/session` docs, legacy migration, direct `library.json` export/import

### Queue Enhancements
- [ ] Preview combinations before queuing
- [ ] Random delay range between generations
- [ ] Rate limiting protection
- [ ] Per-item delay override
- [x] Bulk import prompts from text file (v3.2.3 — Batch Raw Import modal)
- [ ] CSV import with columns for each placeholder (planned: Layer 3 — per-row template+placeholder pairing)
- [ ] Paired Queue mode: zip templates 1-to-1 with placeholder values instead of cross-product permutations (Layer 2)
- [ ] N-images-per-call optimization: generate 2–4 images per queue item → hemat call overhead
- [ ] Export queue to file for backup
- [ ] Queue history (view past runs, re-queue, export)

### Generation Features
- [ ] Auto-save generated images locally (custom naming, folder structure)
- [ ] Seed management: save/restore, random toggle, seed history, seed lock
- [ ] Sampler Preset Manager — simpan kombinasi sampler + steps + guidance dengan nama (misal: "Fast" = Euler 20 step, "Quality" = DPM++ 2M SDE 28 step)

### NovelAI-Specific
- [ ] Art style & medium presets UI — STYLE_PRESETS sudah ada di kode, tinggal buat UI-nya
- [ ] Character reference sheet generator (multiple views, turnaround, expression sheet)
- [ ] Dataset tag toggles: `fur dataset` (V4+), `background dataset` (V4.5+)
- [ ] Rating tag quick selector: `rating:general`, `rating:sensitive`, dll
- [ ] **Precise Reference Image Library** — save/load reference images beserta nilai Info Extracted + Strength; tracker biaya +5 Anlas/ref/image
- [ ] **Vibe Transfer Library** — simpan reference images yang sering dipakai beserta parameter IE + Strength, quick-apply ke generation
- [ ] Multi-character Interaction Builder — visual builder untuk syntax `base | char1 | char2` + dropdown action tags (`source#action`, `target#action`, `mutual#action`)

---

## 💎 Phase 5: Quality of Life

### UI
- [ ] Light/dark theme + auto-detect system preference
- [ ] Resize panel width/height; remember position/size in storage; snap to edges
- [ ] Keyboard shortcuts: `Ctrl+Enter` apply, `Ctrl+Shift+Enter` queue, `Ctrl+.` toggle panel
- [ ] Syntax highlighting for placeholders in template editor
- [ ] Live placeholder replacement preview
- [ ] Template variables with defaults, conditionals, weight modifiers, inheritance

### NovelAI Tag Library
- [ ] Searchable tag database (hair, eyes, poses, expressions, backgrounds, art styles)
- [ ] Tag autocomplete & context suggestions in template editor
- [ ] Step-by-step character builder (gender, hair, eyes, expression, clothing, accessories)

---

## 🔮 Future Ideas

- **Cloud Sync**: templates across devices, optional cloud backup
- **Community Templates**: shared template collections, ratings, marketplace
- **Scripting**: conditional queue execution, generation event hooks
- **API Integration**: direct NovelAI API calls, parallel generation, cost tracking
- **Analytics**: generation stats per template/placeholder, A/B testing, cost analysis

---

## 📋 Technical Debt

- [ ] Refactor state management (consider state machine)
- [ ] Optimize rendering for large lists (virtual scrolling)
- [ ] Debounce search/filter operations
- [ ] Cache computed combinations
- [ ] Loading states, better error messages, tooltips, undo/redo

---

*Last updated: May 2026 (v4.0.0)*
