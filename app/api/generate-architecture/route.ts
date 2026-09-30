import { NextResponse } from "next/server"
import { callAIJSON } from "@/lib/ai"
import type { ArchitectureResult } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SYSTEM = `Kamu adalah arsitek solusi senior. Diberikan konsep produk dan analisisnya, hasilkan rekomendasi tech stack untuk 4 kategori: frontend, backend, database, dan deployment.

Untuk setiap kategori, berikan TEPAT 4 opsi dengan tier berbeda:
- "hemat" = paling hemat biaya / cepat dipasang
- "standard" = pilihan yang seimbang
- "populer" = paling banyak diadopsi komunitas
- "pro" = enterprise-grade / paling skalabel

Selalu kembalikan JSON valid persis dengan skema berikut (tanpa markdown, tanpa code fence):
{
  "frontend":   [{ "tier": "hemat", "name": "...", "description": "..." }, { "tier": "standard", ...}, { "tier": "populer", ...}, { "tier": "pro", ...}],
  "backend":    [4 opsi dengan tier sama],
  "database":   [4 opsi dengan tier sama],
  "deployment": [4 opsi dengan tier sama]
}

Setiap "description" 2-3 kalimat dalam Bahasa Indonesia yang menjelaskan kelebihan dan use-case kontekstual untuk produk ini. Sertakan alasan spesifik kenapa cocok untuk konsep produk yang diberikan.`

export async function POST(req: Request) {
  try {
    const { concept, conceptResult, baseUrl, apiKey, model } = await req.json()
    if (!baseUrl || !apiKey)
      return NextResponse.json({ error: "Base URL dan token API wajib diisi" }, { status: 400 })

    const userPrompt = `Konsep produk:\n"""\n${concept}\n"""\n\nAnalisis konsep:\n${JSON.stringify(conceptResult, null, 2)}\n\nHasilkan rekomendasi arsitektur JSON sesuai skema.`

    const result = await callAIJSON<ArchitectureResult>({
      baseUrl,
      apiKey,
      model,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt },
      ],
    })

    const cats: (keyof ArchitectureResult)[] = [
      "frontend",
      "backend",
      "database",
      "deployment",
    ]
    const validTiers = new Set(["hemat", "standard", "populer", "pro"])
    const normalized: ArchitectureResult = {
      frontend: [],
      backend: [],
      database: [],
      deployment: [],
    }
    for (const c of cats) {
      const arr = Array.isArray(result[c]) ? result[c] : []
      normalized[c] = arr
        .filter((o) => o && validTiers.has(o.tier))
        .map((o) => ({
          tier: o.tier,
          name: String(o.name ?? ""),
          description: String(o.description ?? ""),
        }))
    }

    return NextResponse.json(normalized)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
