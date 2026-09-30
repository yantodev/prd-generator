<div align="center">

# PRD Engine Pro

**AI untuk pembuat produk.**
Generator Product Requirements Document (PRD) 3-langkah dengan perencanaan arsitektur cerdas, menggunakan gateway AI OpenAI-compatible seperti 9Router.

![PRD Engine Pro — landing](.github/image.png)

</div>

---

## ✨ Fitur

- **Alur 3-langkah terpandu** — `Konsep → Arsitektur → Dokumen`, lengkap dengan stepper, loading states bertema, dan indikator streaming.
- **Analisis konsep cerdas** — AI memecah ide kamu jadi *elevator pitch*, target pengguna, masalah utama, dan use case; bisa direvisi lewat feedback tanpa mulai ulang.
- **Pemilih tech stack interaktif** — 4 kategori (Frontend, Backend, Database, Deployment) × 4 tier (`PALING HEMAT`, `STANDARD`, `POPULER`, `PALING PRO`) yang digenerate kontekstual sesuai konsep produk.
- **Generator PRD streaming** — dokumen Markdown lengkap (14 seksi: Overview, Tujuan, Persona, Fitur, Arsitektur, Skema Data, API, KPI, Risiko, Roadmap, dll.) yang mengalir real-time.
- **Custom AI gateway** — isi Base URL, token API, dan model sendiri. Kompatibel dengan 9Router dan gateway OpenAI-compatible lainnya.
- **Ekspor siap pakai** — salin Markdown atau unduh `.md` langsung.
- **UI Bahasa Indonesia** — semua label, copy, dan prompt AI dalam Bahasa Indonesia.

---

## 📸 Screenshots

<table>
  <tr>
    <td width="50%"><img src=".github/image.png" alt="Landing — input konsep produk" /></td>
    <td width="50%"><img src=".github/image2.png" alt="Refinement konsep dengan panel revisi" /></td>
  </tr>
  <tr>
    <td align="center"><sub><b>1.</b> Landing — input konsep</sub></td>
    <td align="center"><sub><b>2.</b> Refinement konsep + panel feedback</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src=".github/image3.png" alt="Pemilih tech stack per kategori & tier" /></td>
    <td width="50%"><img src=".github/image4.png" alt="Dokumen PRD final dengan tombol salin/unduh" /></td>
  </tr>
  <tr>
    <td align="center"><sub><b>3.</b> Pemilih tech stack interaktif</sub></td>
    <td align="center"><sub><b>4.</b> PRD final (Markdown streaming)</sub></td>
  </tr>
</table>

---

## 🧱 Tech Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **TailwindCSS v4** + **shadcn/ui** (primitif yang dipakai)
- **Lucide Icons**
- **react-markdown** + **remark-gfm**
- **OpenAI-compatible API** (Base URL + token sendiri) — streaming via SSE

---

## 🚀 Mulai Cepat

```bash
# 1. Install dependencies
npm install

# 2. Jalankan dev server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) — modal konfigurasi API akan muncul otomatis saat pertama kali.

### Konfigurasi 9Router

Masukkan di modal **Konfigurasi API**:

- **Base URL:** `http://127.0.0.1:20128/v1`
- **API token:** token dari dashboard 9Router
- **Model:** `auto` atau model ID yang tersedia di 9Router

Suffix `/chat/completions` tidak perlu ditulis. Aplikasi akan memanggil:

```text
POST {baseUrl}/chat/completions
GET  {baseUrl}/models
```

Gateway lain yang mengikuti format OpenAI-compatible dapat digunakan dengan cara yang sama.

> Token disimpan di `localStorage` browser dan dikirim hanya ke Base URL yang kamu masukkan.

---

## 🗂️ Struktur Proyek

```
app/
  page.tsx                            # State machine 7-step + wiring semua komponen
  layout.tsx                          # Root layout (dark mode default)
  globals.css                         # Theme, grid-bg, prd-prose markdown styling
  api/
    analyze-concept/route.ts          # Analisis + revisi konsep (JSON)
    generate-architecture/route.ts    # Generate 4 tier × 4 kategori tech stack
    generate-prd/route.ts             # Streaming PRD markdown (SSE → text stream)
    models/route.ts                   # Proxy daftar model dari gateway pilihan

components/prd/
  Header.tsx                          # Logo + 3-step stepper + Reset + API Key
  ApiKeyModal.tsx                     # BYOK modal (localStorage)
  ModelSelector.tsx                   # Popover searchable model picker
  ConceptStep.tsx                     # Hero + textarea konsep
  ConceptRefinement.tsx               # Hasil analisis + panel revisi
  ArchitectureStep.tsx                # Grid kartu tech stack interaktif
  DocumentStep.tsx                    # Render PRD Markdown + salin/unduh
  LoadingScreen.tsx                   # 4 varian (concept/architecture/research/compile)

lib/
  ai.ts                               # Adapter gateway OpenAI-compatible
  types.ts                            # Types + konstanta label
```

---

## 🔌 API Routes

| Route | Method | Deskripsi |
|-------|--------|-----------|
| `/api/analyze-concept` | `POST` | Analisis konsep + revisi berbasis feedback. Mengembalikan JSON `{ elevatorPitch, targetUser, keyProblems[], useCases[] }`. |
| `/api/generate-architecture` | `POST` | Generate rekomendasi tech stack 4 tier untuk 4 kategori. |
| `/api/generate-prd` | `POST` | Streaming Markdown PRD lengkap (14 seksi) — response `text/plain` chunked. |
| `/api/models` | `POST` | Proxy daftar model dari Base URL gateway pilihan. |

Payload rute AI membutuhkan `{ baseUrl, apiKey, model, ... }` dari client.

---

## 🛠️ Scripts

```bash
npm run dev        # Dev server (Turbopack)
npm run build      # Production build
npm run start      # Jalankan build hasil
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run format     # Prettier
```

---

## 🔒 Privasi

- Token hanya disimpan di `localStorage` browser.
- Request AI diteruskan dari API route Next.js ke gateway yang dikonfigurasi. Tidak ada logging payload ke third-party.
- Jalankan sendiri (self-host) kalau butuh kontrol penuh.

---

## 📄 Lisensi

MIT.

