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

All v1–v3 features are complete. See git history for details.

---

## 🚀 Phase 4: Planned

### Queue Enhancements
- [ ] Estimated Anlas cost calculator
- [ ] Preview combinations before queuing
- [ ] Random delay range between generations
- [ ] Rate limiting protection
- [ ] Per-item delay override
- [x] Bulk import prompts from text file (v3.2.3 — Batch Raw Import modal)
- [ ] CSV import with columns for each placeholder (planned: Layer 3 — per-row template+placeholder pairing)
- [ ] Paired Queue mode: zip templates 1-to-1 with placeholder values instead of cross-product permutations (Layer 2)
- [ ] Export queue to file for backup
- [ ] Queue history (view past runs, re-queue, export)

### Generation Features
- [ ] Auto-save generated images locally (custom naming, folder structure)
- [ ] Seed management: save/restore, random toggle, seed history, seed lock

### NovelAI-Specific
- [ ] Art style & medium presets (art movements, traditional media, digital techniques, year-based styles)
- [ ] Character reference sheet generator (multiple views, turnaround, expression sheet)
- [ ] Dataset tag toggles: `fur dataset`, `background dataset`
- [ ] Rating tag quick selector

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

*Last updated: March 2026 (v3.2.3)*
