import { NextResponse } from "next/server"
import { listAIModels, normalizeBaseUrl } from "@/lib/ai"
import type { AIModel } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const { baseUrl, apiKey } = await req.json()
    if (!baseUrl || typeof baseUrl !== "string") {
      return NextResponse.json({ error: "Base URL wajib diisi" }, { status: 400 })
    }
    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json({ error: "Token API wajib diisi" }, { status: 400 })
    }

    const data = await listAIModels({
      baseUrl: normalizeBaseUrl(baseUrl),
      apiKey,
    })
    const models: AIModel[] = Array.isArray(data?.data)
      ? data.data
          .filter((model: Partial<AIModel>) => typeof model.id === "string")
          .map((model: AIModel) => ({
            id: model.id,
            name: model.name,
            context_length: model.context_length,
            pricing: model.pricing
              ? {
                  prompt: model.pricing.prompt,
                  completion: model.pricing.completion,
                }
              : undefined,
          }))
      : []

    return NextResponse.json({ models })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Gagal mengambil model AI",
      },
      { status: 500 }
    )
  }
}
