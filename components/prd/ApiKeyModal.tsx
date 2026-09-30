"use client"

import { useEffect, useState } from "react"
import {
  Eye,
  EyeOff,
  X,
  ExternalLink,
  KeyRound,
  ShieldCheck,
  Loader2,
} from "lucide-react"
import { DEFAULT_MODELS, type AIModel, type ApiKeyConfig } from "@/lib/types"
import { ModelSelector } from "./ModelSelector"

const STORAGE_KEY = "prd-engine-config"
const DEFAULT_BASE_URL = "http://127.0.0.1:20128/v1"

export function loadConfig(): ApiKeyConfig {
  if (typeof window === "undefined")
    return { baseUrl: DEFAULT_BASE_URL, apiKey: "", model: "auto" }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        baseUrl: parsed.baseUrl || DEFAULT_BASE_URL,
        apiKey: parsed.apiKey || "",
        model: parsed.model || "auto",
      }
    }
  } catch {}
  return { baseUrl: DEFAULT_BASE_URL, apiKey: "", model: "auto" }
}

export function saveConfig(cfg: ApiKeyConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
}

export function ApiKeyModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (cfg: ApiKeyConfig) => void
}) {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL)
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("auto")
  const [models, setModels] = useState<AIModel[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsError, setModelsError] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    if (open) {
      const cfg = loadConfig()
      setBaseUrl(cfg.baseUrl)
      setApiKey(cfg.apiKey)
      setModel(cfg.model)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setModelsLoading(true)
    setModelsError(null)

    const cfg = loadConfig()
    if (!cfg.apiKey) {
      setModels(DEFAULT_MODELS.map((id) => ({ id })))
      setModelsLoading(false)
      return () => {
        cancelled = true
      }
    }

    fetch("/api/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseUrl: cfg.baseUrl, apiKey: cfg.apiKey }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok)
          throw new Error(data.error || "Gagal mengambil model dari endpoint AI")
        return data.models as AIModel[]
      })
      .then((nextModels) => {
        if (cancelled) return
        setModels(nextModels)
        setModel((current) => {
          if (nextModels.some((item) => item.id === current)) return current
          return nextModels[0]?.id || current
        })
      })
      .catch((error) => {
        if (cancelled) return
        setModelsError(
          error instanceof Error
            ? error.message
            : "Gagal mengambil model dari endpoint AI"
        )
        setModels(DEFAULT_MODELS.map((id) => ({ id })))
      })
      .finally(() => {
        if (!cancelled) setModelsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open])

  if (!open) return null

  const handleSave = () => {
    const cfg = {
      baseUrl: baseUrl.trim().replace(/\/+$/, ""),
      apiKey: apiKey.trim(),
      model,
    }
    saveConfig(cfg)
    onSave(cfg)
    onClose()
  }

  const modelOptions: AIModel[] = models.length
    ? models
    : DEFAULT_MODELS.map((id) => ({ id }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div
        className="relative w-full max-w-xl rounded-2xl border border-[#232323] shadow-2xl shadow-black/60"
        style={{
          background:
            "radial-gradient(120% 120% at 0% 0%, rgba(255,31,90,0.08) 0%, rgba(20,20,20,1) 45%, #141414 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <button
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-md text-[#9a9a9a] transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative p-7">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff1f5a] to-[#c40d40] shadow-lg shadow-[#ff1f5a]/30">
              <KeyRound className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="pt-0.5">
              <h2 className="text-xl font-bold tracking-tight">
                Konfigurasi API
              </h2>
              <p className="mt-0.5 text-[13px] text-[#9a9a9a]">
                Hubungkan 9Router atau endpoint AI OpenAI-compatible lainnya.
              </p>
            </div>
          </div>

          <div className="mb-5">
            <label className="text-pink mb-2 block text-[11px] font-bold tracking-[0.18em]">
              BASE URL ENDPOINT
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://127.0.0.1:20128/v1"
              className="mb-3 w-full rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3.5 py-3 font-mono text-sm transition-all outline-none focus:border-[#ff1f5a] focus:ring-1 focus:ring-[#ff1f5a]/40"
            />
            <p className="mb-4 text-[11px] text-[#6a6a6a]">
              Contoh 9Router: <span className="font-mono text-[#b7b7b7]">http://127.0.0.1:20128/v1</span>. Suffix <span className="font-mono">/chat/completions</span> tidak perlu ditulis.
            </p>
            <label className="text-pink mb-2 block text-[11px] font-bold tracking-[0.18em]">
              API TOKEN
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Token 9Router / Bearer token"
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3.5 py-3 pr-10 font-mono text-sm transition-all outline-none focus:border-[#ff1f5a] focus:ring-1 focus:ring-[#ff1f5a]/40"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                aria-label={showKey ? "Sembunyikan" : "Tampilkan"}
                className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[#7a7a7a] transition-colors hover:bg-white/5 hover:text-white"
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <a
                href="https://github.com/decolua/9router"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink inline-flex items-center gap-1 text-xs hover:underline"
              >
                Lihat dokumentasi 9Router
                <ExternalLink className="h-3 w-3" />
              </a>
              <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-[#6a6a6a]">
                <ShieldCheck className="h-3 w-3" />
                Disimpan lokal
              </span>
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-pink block text-[11px] font-bold tracking-[0.18em]">
                MODEL AI
              </label>
              {modelsLoading && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-[#7a7a7a]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  memuat model...
                </span>
              )}
            </div>
            <ModelSelector
              value={model}
              options={modelOptions}
              loading={modelsLoading}
              onChange={setModel}
            />
            {modelsError ? (
              <p className="mt-2 text-[11px] text-red-300">
                {modelsError} — pakai daftar fallback.
              </p>
            ) : (
              <p className="mt-2 text-[11px] text-[#6a6a6a]">
                Daftar model diambil real-time dari endpoint yang kamu masukkan. Model{" "}
                <span className="font-semibold text-emerald-400">GRATIS</span>{" "}
                ditandai otomatis bila gateway menyediakannya.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#2a2a2a] px-4 py-3 text-sm font-semibold transition-colors hover:bg-white/5"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={!baseUrl.trim() || !apiKey.trim()}
              className="btn-pink flex-1 rounded-lg px-4 py-3 text-sm font-semibold"
            >
              Simpan & Lanjut
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
