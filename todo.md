# Todo — Negative Prompt Management

Supaya tombol **Both** di Quick Apply bisa berfungsi, user perlu bisa:
1. Membuat/mengelola negative templates
2. Menghubungkan positive template ke negative template (`negativeId`)

---

## Status Saat Ini

| Komponen | Status |
|---|---|
| Storage key `nai_ext_negative_templates_v3` | ✅ Ada |
| `state.negativeTemplates[]` | ✅ Ada |
| `template.negativeId` field | ✅ Ada (di schema) |
| `NovelAI.setNegativePrompt()` | ✅ Ada |
| Preview negative di footer | ✅ Ada |
| CSS `.nai-ext-neg-template-item` | ✅ Ada (stub) |
| UI tambah/edit/hapus negative template | ❌ Belum ada |
| UI link template → negativeId | ❌ Belum ada |

---

## Task

### 1. Tab / Panel Negative Templates
- [ ] Tambah tab "Negative" di sidebar (sejajar dengan tab Templates/Placeholders)
- [ ] Render daftar `state.negativeTemplates` — pakai class `.nai-ext-neg-template-item` yang sudah ada CSS-nya
- [ ] Tombol **+ Add** → modal input teks negative prompt baru
- [ ] Inline edit / delete per item
- [ ] Simpan ke storage setelah setiap perubahan

### 2. Link Template ke Negative Template
- [ ] Di modal edit template (positive), tambah dropdown **"Linked Negative"**
  - Opsi: `(none)` + semua nama negative template yang ada
  - Saat dipilih, set `template.negativeId = index` yang sesuai
- [ ] Tampilkan indikator kecil di list template jika sudah ada link (misal: ikon `N` kecil)

### 3. Validasi & Edge Case
- [ ] Jika `negativeId` menunjuk index yang tidak ada (setelah delete), graceful fallback — tombol Both tetap apply positive saja
- [ ] Update preview negatif di footer saat template dengan `negativeId` dipilih (sudah ada, pastikan tidak rusak)

### 4. UX Polish
- [ ] Jika template dipilih tapi tidak punya `negativeId`, tombol **Both** tetap visible tapi bisa diberi tooltip "No negative linked"
  - Atau: disable Both + ganti warnanya jika tidak ada link (opsional)

---

## Urutan Pengerjaan yang Disarankan

1. Task 1 dulu (CRUD negative templates) → user bisa bikin isi negative templates
2. Task 2 (linking) → baru Both bisa berfungsi end-to-end
3. Task 3 & 4 finishing

---

## Catatan Teknis

- `state.negativeTemplates` adalah **array of string** (bukan objek), jadi `negativeId` = index integer
- ⚠️ **WASPADA:** Saat hapus negative template, semua `template.negativeId` yang nilainya > index yang dihapus harus di-shift — kalau tidak, linking akan salah arah diam-diam tanpa error
- ⚠️ **WASPADA:** Tidak ada validasi saat load — kalau `negativeId` menunjuk index yang tidak ada, `Both` diam-diam tidak apply negative (silent fail, susah di-debug)
- Solusi jangka panjang: refactor ke ID-based (string UUID) agar lebih robust — tapi ini opsional/fase berikutnya
