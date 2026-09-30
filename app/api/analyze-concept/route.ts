import { NextResponse } from "next/server"
import { callAIJSON } from "@/lib/ai"
import type { ConceptResult } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SYSTEM = `Kamu adalah analis produk senior. Diberikan deskripsi konsep produk dari pengguna (dalam Bahasa Indonesia), hasilkan analisis terstruktur.

Selalu kembalikan JSON valid persis dengan skema berikut (tanpa markdown, tanpa code fence):
{
  "elevatorPitch": "string - 3-5 kalimat ringkas tentang apa, untuk siapa, dan keunggulannya",
  "targetUser": "string - 2-3 kalimat tentang segmen pengguna utama",
  "keyProblems": ["string", "string", "string"],
  "useCases": ["string", "string", "string", "string"]
}

Tulis dalam Bahasa Indonesia yang natural dan profesional.`

export async function POST(req: Request) {
  try {
    const { concept, feedback, previous, baseUrl, apiKey, model } = await req.json()

    if (!baseUrl || !apiKey) {
      return NextResponse.json({ error: "Base URL dan token API wajib diisi" }, { status: 400 })
    }
    if (!concept || typeof concept !== "string") {
      return NextResponse.json({ error: "concept required" }, { status: 400 })
    }

    let userPrompt = `Konsep produk:\n"""\n${concept}\n"""\n\nHasilkan analisis JSON.`
    if (feedback && previous) {
      userPrompt = `Konsep produk awal:\n"""\n${concept}\n"""\n\nAnalisis sebelumnya:\n${JSON.stringify(previous)}\n\nFeedback dari pengguna untuk merevisi:\n"""\n${feedback}\n"""\n\nPerbarui dan keluarkan JSON terbaru sesuai skema.`
    }

    const result = await callAIJSON<ConceptResult>({
      baseUrl,
      apiKey,
      model,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt },
      ],
    })

    // Defensive normalization
    const normalized: ConceptResult = {
      elevatorPitch: String(result.elevatorPitch ?? ""),
      targetUser: String(result.targetUser ?? ""),
      keyProblems: Array.isArray(result.keyProblems)
        ? result.keyProblems.map(String)
        : [],
      useCases: Array.isArray(result.useCases)
        ? result.useCases.map(String)
        : [],
    }

    return NextResponse.json(normalized)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
