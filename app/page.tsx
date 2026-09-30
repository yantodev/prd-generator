"use client"

import { useEffect, useRef, useState } from "react"
import { Header } from "@/components/prd/Header"
import { ApiKeyModal, loadConfig } from "@/components/prd/ApiKeyModal"
import { ConceptStep } from "@/components/prd/ConceptStep"
import { ConceptRefinement } from "@/components/prd/ConceptRefinement"
import { ArchitectureStep } from "@/components/prd/ArchitectureStep"
import { DocumentStep } from "@/components/prd/DocumentStep"
import { LoadingScreen } from "@/components/prd/LoadingScreen"
import type {
  ApiKeyConfig,
  ArchCategory,
  ArchitectureResult,
  ConceptResult,
  SelectedArchitecture,
  Step,
  TechOption,
} from "@/lib/types"

type StepKey = "concept" | "architecture" | "document"

const STEP_KEY: Record<Step, StepKey> = {
  "concept-input": "concept",
  "concept-loading": "concept",
  "concept-result": "concept",
  "arch-loading": "architecture",
  "arch-result": "architecture",
  "doc-loading": "document",
  "doc-result": "document",
}

export default function Page() {
  const [step, setStep] = useState<Step>("concept-input")
  const [concept, setConcept] = useState("")
  const [conceptResult, setConceptResult] = useState<ConceptResult | null>(null)
  const [arch, setArch] = useState<ArchitectureResult | null>(null)
  const [selected, setSelected] = useState<SelectedArchitecture>({})
  const [markdown, setMarkdown] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [docPhase, setDocPhase] = useState<"research" | "compile">("research")
  const [revising, setRevising] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [config, setConfig] = useState<ApiKeyConfig>({
    baseUrl: "http://127.0.0.1:20128/v1",
    apiKey: "",
    model: "auto",
  })
  const [apiKeyOpen, setApiKeyOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const cfg = loadConfig()
    setConfig(cfg)
    setHydrated(true)
    if (!cfg.apiKey) setApiKeyOpen(true)
  }, [])

  const ensureKey = (): boolean => {
    if (!config.baseUrl || !config.apiKey) {
      setApiKeyOpen(true)
      return false
    }
    return true
  }

  const handleAnalyze = async (text: string) => {
    if (!ensureKey()) return
    setConcept(text)
    setStep("concept-loading")
    setError(null)
    try {
      const res = await fetch("/api/analyze-concept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept: text, ...config }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menganalisis konsep")
      setConceptResult(data)
      setStep("concept-result")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
      setStep("concept-input")
    }
  }

  const handleRevise = async (feedback: string) => {
    if (!ensureKey() || !conceptResult) return
    setRevising(true)
    setError(null)
    try {
      const res = await fetch("/api/analyze-concept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept,
          feedback,
          previous: conceptResult,
          ...config,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal merevisi konsep")
      setConceptResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setRevising(false)
    }
  }

  const handleProceedArch = async () => {
    if (!ensureKey() || !conceptResult) return
    setStep("arch-loading")
    setError(null)
    try {
      const res = await fetch("/api/generate-architecture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept, conceptResult, ...config }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal membuat arsitektur")
      setArch(data)
      setStep("arch-result")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
      setStep("concept-result")
    }
  }

  const handleSelect = (cat: ArchCategory, opt: TechOption) => {
    setSelected((s) => ({ ...s, [cat]: opt }))
  }

  const handleProceedDoc = async () => {
    if (!ensureKey() || !conceptResult || !arch) return
    setMarkdown("")
    setStep("doc-loading")
    setDocPhase("research")
    setError(null)

    // Quick "research" phase visual delay (1.2s) before compile
    await new Promise((r) => setTimeout(r, 1200))
    setDocPhase("compile")

    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    try {
      const res = await fetch("/api/generate-prd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept,
          conceptResult,
          architecture: selected,
          ...config,
        }),
        signal: ac.signal,
      })
      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => "")
        throw new Error(txt || "Gagal generate PRD")
      }
      setStep("doc-result")
      setStreaming(true)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ""
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setMarkdown(acc)
      }
      setStreaming(false)
    } catch (e) {
      setStreaming(false)
      if ((e as Error).name === "AbortError") return
      setError(e instanceof Error ? e.message : "Error")
      setStep("arch-result")
    }
  }

  const handleReset = () => {
    abortRef.current?.abort()
    setStep("concept-input")
    setConcept("")
    setConceptResult(null)
    setArch(null)
    setSelected({})
    setMarkdown("")
    setError(null)
  }

  if (!hydrated) {
    return <div className="min-h-svh bg-[#0a0a0a]" />
  }

  const activeStep = STEP_KEY[step]
  const completed: Record<StepKey, boolean> = {
    concept: [
      "arch-loading",
      "arch-result",
      "doc-loading",
      "doc-result",
    ].includes(step),
    architecture: ["doc-loading", "doc-result"].includes(step),
    document: step === "doc-result" && !streaming && !!markdown,
  }

  return (
    <div className="flex min-h-svh flex-col">
      <Header
        active={activeStep}
        completed={completed}
        onReset={handleReset}
        onOpenApiKey={() => setApiKeyOpen(true)}
      />

      {error && (
        <div className="border-y border-red-900 bg-red-950/40 px-6 py-3 text-sm text-red-200">
          <strong>Error:</strong> {error}
        </div>
      )}

      <main className="flex flex-1 flex-col">
        {step === "concept-input" && (
          <ConceptStep initial={concept} onAnalyze={handleAnalyze} />
        )}
        {step === "concept-loading" && <LoadingScreen variant="concept" />}
        {step === "concept-result" && conceptResult && (
          <ConceptRefinement
            result={conceptResult}
            onRevise={handleRevise}
            onProceed={handleProceedArch}
            revising={revising}
          />
        )}
        {step === "arch-loading" && <LoadingScreen variant="architecture" />}
        {step === "arch-result" && arch && (
          <ArchitectureStep
            arch={arch}
            selected={selected}
            onSelect={handleSelect}
            onProceed={handleProceedDoc}
          />
        )}
        {step === "doc-loading" && (
          <LoadingScreen
            variant={docPhase === "research" ? "research" : "compile"}
            phaseLabel={docPhase === "compile" ? "Fase 1/1" : undefined}
          />
        )}
        {step === "doc-result" && (
          <DocumentStep markdown={markdown} isStreaming={streaming} />
        )}
      </main>

      <ApiKeyModal
        open={apiKeyOpen}
        onClose={() => setApiKeyOpen(false)}
        onSave={(cfg) => setConfig(cfg)}
      />
    </div>
  )
}
