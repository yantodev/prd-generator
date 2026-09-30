export type AIMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

export function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "")
  return trimmed
    .replace(/\/chat\/completions$/i, "")
    .replace(/\/models$/i, "")
}

function endpoint(baseUrl: string, path: string): string {
  return `${normalizeBaseUrl(baseUrl)}${path}`
}

function headers(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  }
}

export async function callAI(opts: {
  baseUrl: string
  apiKey: string
  model: string
  messages: AIMessage[]
  json?: boolean
  stream?: boolean
}) {
  const body: Record<string, unknown> = {
    model: opts.model,
    messages: opts.messages,
  }
  if (opts.json) body.response_format = { type: "json_object" }
  if (opts.stream) body.stream = true

  const res = await fetch(endpoint(opts.baseUrl, "/chat/completions"), {
    method: "POST",
    headers: headers(opts.apiKey),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`AI gateway ${res.status}: ${text.slice(0, 500)}`)
  }
  return res
}

export async function callAIJSON<T>(opts: {
  baseUrl: string
  apiKey: string
  model: string
  messages: AIMessage[]
}): Promise<T> {
  const res = await callAI({ ...opts, json: true })
  const data = await res.json()
  const content: string = data?.choices?.[0]?.message?.content ?? ""
  const cleaned = content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()

  try {
    return JSON.parse(cleaned) as T
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as T
    throw new Error("AI response was not valid JSON: " + content.slice(0, 300))
  }
}

export async function listAIModels(opts: {
  baseUrl: string
  apiKey: string
}) {
  const res = await fetch(endpoint(opts.baseUrl, "/models"), {
    headers: { Authorization: `Bearer ${opts.apiKey}` },
    cache: "no-store",
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`AI gateway ${res.status}: ${text.slice(0, 300)}`)
  }
  return res.json()
}
