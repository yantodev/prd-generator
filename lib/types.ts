export type Step =
  | "concept-input"
  | "concept-loading"
  | "concept-result"
  | "arch-loading"
  | "arch-result"
  | "doc-loading"
  | "doc-result"

export type ConceptResult = {
  elevatorPitch: string
  targetUser: string
  keyProblems: string[]
  useCases: string[]
}

export type TechTier = "hemat" | "standard" | "populer" | "pro"

export type TechOption = {
  tier: TechTier
  name: string
  description: string
}

export type ArchitectureResult = {
  frontend: TechOption[]
  backend: TechOption[]
  database: TechOption[]
  deployment: TechOption[]
}

export type ArchCategory = keyof ArchitectureResult

export type SelectedArchitecture = {
  frontend?: TechOption
  backend?: TechOption
  database?: TechOption
  deployment?: TechOption
}

export type ApiKeyConfig = {
  baseUrl: string
  apiKey: string
  model: string
}

export type AIModel = {
  id: string
  name?: string
  context_length?: number
  pricing?: {
    prompt?: string
    completion?: string
  }
}

export const TIER_LABELS: Record<TechTier, string> = {
  hemat: "PALING HEMAT",
  standard: "STANDARD",
  populer: "POPULER",
  pro: "PALING PRO",
}

export const CATEGORY_LABELS: Record<ArchCategory, string> = {
  frontend: "Frontend",
  backend: "Backend",
  database: "Database",
  deployment: "Deployment & Infrastruktur",
}

export const DEFAULT_MODELS = [
  "auto",
  "openai/gpt-4o-mini",
  "google/gemini-2.0-flash",
  "anthropic/claude-3-5-sonnet",
  "meta-llama/llama-3.3-70b-instruct",
]
