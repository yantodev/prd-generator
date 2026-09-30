"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, Search, Sparkles } from "lucide-react"
import type { AIModel } from "@/lib/types"
import { cn } from "@/lib/utils"

function formatPrice(p?: string) {
  if (!p) return null
  const n = parseFloat(p)
  if (!Number.isFinite(n)) return null
  if (n === 0) return "Gratis"
  // Compatible gateways may expose pricing per token; show per 1M tokens
  const per1M = n * 1_000_000
  if (per1M < 0.01) return `$${per1M.toFixed(4)}/1M`
  if (per1M < 1) return `$${per1M.toFixed(3)}/1M`
  return `$${per1M.toFixed(2)}/1M`
}

function formatContext(ctx?: number) {
  if (!ctx) return null
  if (ctx >= 1_000_000) return `${(ctx / 1_000_000).toFixed(1)}M`
  if (ctx >= 1000) return `${Math.round(ctx / 1000)}K`
  return String(ctx)
}

function isFree(m: AIModel) {
  if (m.id.endsWith(":free")) return true
  const p = parseFloat(m.pricing?.prompt ?? "")
  const c = parseFloat(m.pricing?.completion ?? "")
  return Number.isFinite(p) && Number.isFinite(c) && p === 0 && c === 0
}

export function ModelSelector({
  value,
  options,
  loading,
  onChange,
}: {
  value: string
  options: AIModel[]
  loading?: boolean
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeIdx, setActiveIdx] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.id === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (m) =>
        m.id.toLowerCase().includes(q) ||
        (m.name ?? "").toLowerCase().includes(q)
    )
  }, [options, query])

  // close on outside click
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setQuery("")
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  useEffect(() => {
    setActiveIdx(0)
  }, [query])

  // scroll active item into view
  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-idx="${activeIdx}"]`
    )
    el?.scrollIntoView({ block: "nearest" })
  }, [activeIdx, open])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIdx((i) => Math.min(filtered.length - 1, i + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIdx((i) => Math.max(0, i - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const m = filtered[activeIdx]
      if (m) {
        onChange(m.id)
        setOpen(false)
      }
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg border bg-[#0a0a0a] px-3.5 py-3 text-left transition-all",
          "border-[#2a2a2a] hover:border-[#3a3a3a]",
          open && "border-[#ff1f5a] ring-1 ring-[#ff1f5a]/40"
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#ff1f5a]/30 bg-gradient-to-br from-[#ff1f5a]/20 to-[#ff1f5a]/5">
          <Sparkles className="text-pink h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          {selected ? (
            <>
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold">
                  {selected.name || selected.id}
                </span>
                {isFree(selected) && (
                  <span className="shrink-0 rounded border border-emerald-500/25 bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-emerald-400">
                    GRATIS
                  </span>
                )}
              </div>
              <div className="mt-0.5 truncate font-mono text-[11px] text-[#7a7a7a]">
                {selected.id}
              </div>
            </>
          ) : (
            <span className="text-sm text-[#7a7a7a]">
              {loading ? "Memuat model..." : "Pilih model"}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[#7a7a7a] transition-transform",
            open && "text-pink rotate-180"
          )}
        />
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute right-0 left-0 z-20 mt-2 overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#111111] shadow-2xl shadow-black/60">
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-[#1f1f1f] px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-[#6a6a6a]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Cari: gemini, gpt, claude, llama..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#5a5a5a]"
            />
            <span className="shrink-0 font-mono text-[10px] text-[#5a5a5a]">
              {filtered.length}
            </span>
          </div>

          {/* List */}
          <div ref={listRef} className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[#7a7a7a]">
                Tidak ada model yang cocok.
              </div>
            ) : (
              filtered.map((m, i) => {
                const isSelected = m.id === value
                const isActive = i === activeIdx
                const free = isFree(m)
                const ctx = formatContext(m.context_length)
                const promptPrice = formatPrice(m.pricing?.prompt)
                return (
                  <button
                    key={m.id}
                    data-idx={i}
                    type="button"
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => {
                      onChange(m.id)
                      setOpen(false)
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                      isActive && "bg-[#1a1a1a]",
                      isSelected && "bg-[#ff1f5a]/8"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "truncate text-sm font-medium",
                            isSelected ? "text-white" : "text-[#d6d6d6]"
                          )}
                        >
                          {m.name || m.id}
                        </span>
                        {free && (
                          <span className="shrink-0 rounded border border-emerald-500/25 bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-emerald-400">
                            GRATIS
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#7a7a7a]">
                        <span className="truncate font-mono">{m.id}</span>
                        {ctx && (
                          <>
                            <span className="text-[#3a3a3a]">·</span>
                            <span className="shrink-0">{ctx} ctx</span>
                          </>
                        )}
                        {!free && promptPrice && (
                          <>
                            <span className="text-[#3a3a3a]">·</span>
                            <span className="shrink-0">{promptPrice}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check
                        className="text-pink h-4 w-4 shrink-0"
                        strokeWidth={3}
                      />
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-[#1f1f1f] px-3 py-2 font-mono text-[10px] text-[#5a5a5a]">
            <span>↑↓ navigasi · ↵ pilih · esc tutup</span>
            <span>{loading ? "memuat..." : `${options.length} model`}</span>
          </div>
        </div>
      )}
    </div>
  )
}
