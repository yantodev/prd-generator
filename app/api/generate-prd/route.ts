import { callAI } from "@/lib/ai"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SYSTEM = `Kamu adalah Product Manager senior yang menulis Product Requirements Document (PRD) profesional sesuai standar industri (mengacu pada praktik IEEE/ISO 29148).

Tulis PRD lengkap dalam format Markdown GitHub-flavored (gunakan heading, bullet, tabel, dan diagram bila perlu) dengan struktur berikut:

# PRD: [Nama Produk]

> **Versi:** 1.0 · **Status:** Draft · **Tanggal:** [isi tanggal hari ini] · **Penulis:** PRD Engine Pro

## 1. Ringkasan (Overview)
## 2. Tujuan & Sasaran
## 3. Target Pengguna & Persona
## 4. Masalah yang Dipecahkan
## 5. Use Cases / User Stories
   - Sertakan **Use Case Diagram** dalam PlantUML. Gunakan \`left to right direction\`, definisikan \`actor\` dan \`usecase\`/\`(...)\`, hubungkan dengan \`-->\`. Untuk relasi gunakan \`.> : include\` dan \`.> : extends\`; generalisasi aktor pakai \`<|--\`.
## 6. Alur Pengguna (User Flow)
   - Sertakan **Activity Diagram** dalam PlantUML (sintaks beta) untuk alur utama produk (mis. onboarding atau transaksi inti). Gunakan \`start\`/\`stop\`, aksi \`:teks;\`, percabangan \`if (...) then (...) / else (...) / endif\`, perulangan \`repeat\`/\`while\`, dan \`fork\`/\`fork again\`/\`end fork\` untuk proses paralel bila relevan.
## 7. Kebutuhan Fungsional & Fitur Utama (MVP)
   - Tabel: Fitur | Prioritas (MoSCoW) | Deskripsi
   - Kolom Prioritas WAJIB memakai framework **MoSCoW**: Must have / Should have / Could have / Won't have (this time).
## 8. Kriteria Penerimaan (Acceptance Criteria)
   - Untuk tiap fitur "Must have", tuliskan kriteria dalam format **Given-When-Then** (Diberikan / Ketika / Maka).
## 9. Kebutuhan Non-Fungsional (NFR)
   - Bahas minimal: Performa, Keamanan, Skalabilitas, Ketersediaan (availability/SLA), Usability/Accessibility, dan Maintainability. Buat terukur bila memungkinkan (mis. "respons < 300ms", "uptime 99.9%").
## 10. Fitur Lanjutan (Post-MVP)
## 11. Arsitektur Teknis
   - Sub-bagian: Frontend, Backend, Database, Deployment & Infrastruktur
   - Sertakan tech yang dipilih pengguna + alasan
## 12. Skema Data (high-level)
   - Sertakan **Entity Relationship Diagram (ERD)** dalam PlantUML. Gunakan blok \`entity "Nama" { ... }\` untuk atribut, dan nyatakan relasi/kardinalitas dengan tanda kutip PlantUML, mis. \`Pengguna "1" --o "many" Pesanan : memiliki\`.
## 13. API & Integrasi Eksternal
## 14. Metrik Sukses (KPI)
## 15. Risiko & Mitigasi
## 16. Roadmap & Milestones (3-6 bulan pertama)
## 17. Asumsi & Out-of-Scope

ATURAN DIAGRAM (WAJIB DIIKUTI):
- Semua diagram ditulis sebagai code block dengan bahasa \`plantuml\` (bukan mermaid), satu \`@startuml\` dan satu \`@enduml\` per blok.
- Gunakan sintaks PlantUML yang valid dan sederhana agar pasti ter-render. Jangan pakai tema/skin kompleks atau \`!include\`.
- Use Case: pakai \`actor\`, \`usecase\`/\`(...)\`, panah \`-->\`, relasi \`.> : include\` dan \`.> : extends\`, generalisasi \`<|--\`.
- Activity (beta): pakai \`start\`, \`:aksi;\`, \`if (...) then (...)\`/\`else\`/\`endif\`, \`repeat\`/\`while\`, \`stop\`.
- ERD: pakai blok \`entity "Nama" { ... }\` dan relasi berkardinalitas dengan tanda kutip, mis. \`A "1" --o "many" B\`. JANGAN gunakan notasi ala Mermaid seperti \`||--o{\`.

Tulis dalam Bahasa Indonesia yang profesional dan detail. Jangan tambahkan kata pengantar atau kalimat di luar dokumen — keluarkan langsung markdown PRD.`

export async function POST(req: Request) {
  try {
    const { concept, conceptResult, architecture, baseUrl, apiKey, model } =
      await req.json()
    if (!baseUrl || !apiKey) {
      return new Response(JSON.stringify({ error: "Base URL dan token API wajib diisi" }), {
        status: 400,
      })
    }

    const userPrompt = `Konsep produk:\n"""\n${concept}\n"""\n\nAnalisis konsep:\n${JSON.stringify(conceptResult, null, 2)}\n\nTech stack yang dipilih pengguna:\n${JSON.stringify(architecture, null, 2)}\n\nTuliskan PRD markdown lengkap.`

    const upstream = await callAI({
      baseUrl,
      apiKey,
      model,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt },
      ],
      stream: true,
    })

    if (!upstream.body) {
      return new Response(JSON.stringify({ error: "No upstream body" }), {
        status: 502,
      })
    }

    // Transform OpenAI-compatible SSE to plain text stream of markdown deltas
    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader()
        const decoder = new TextDecoder()
        const encoder = new TextEncoder()
        let buffer = ""

        try {
          while (true) {
            const { value, done } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })

            const lines = buffer.split("\n")
            buffer = lines.pop() ?? ""

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed.startsWith("data:")) continue
              const data = trimmed.slice(5).trim()
              if (data === "[DONE]") {
                controller.close()
                return
              }
              try {
                const parsed = JSON.parse(data)
                const delta: string | undefined =
                  parsed?.choices?.[0]?.delta?.content
                if (delta) {
                  controller.enqueue(encoder.encode(delta))
                }
              } catch {
                // ignore non-JSON keepalives
              }
            }
          }
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return new Response(JSON.stringify({ error: msg }), { status: 500 })
  }
}
