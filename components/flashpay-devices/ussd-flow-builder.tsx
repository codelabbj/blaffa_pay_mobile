"use client"

import { memo, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"
import { flashpayTheme, stepRowClass, stepTypeLabel } from "@/lib/flashpay-device-utils"
import { cn } from "@/lib/utils"

const SHORTCUTS = ["NUM", "AMOUNT", "PIN", "OPKEY"] as const

interface UssdFlowBuilderProps {
  steps: string[]
  onChange: (steps: string[]) => void
  label?: string
}

export const UssdFlowBuilder = memo(function UssdFlowBuilder({ steps, onChange, label }: UssdFlowBuilderProps) {
  const bulkValue = useMemo(() => steps.join("\n"), [steps])

  const updateStep = (index: number, value: string) => {
    const next = [...steps]
    next[index] = value
    onChange(next)
  }

  const removeStep = (index: number) => {
    onChange(steps.filter((_, i) => i !== index))
  }

  const addStep = (value = "") => {
    onChange([...steps, value])
  }

  const insertShortcut = (token: string) => {
    onChange([...steps, token])
  }

  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= steps.length) return
    const next = [...steps]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {label && <p className="text-sm font-semibold text-[#0B2545] dark:text-gray-100">{label}</p>}

      <div className="flex flex-wrap gap-2">
        {SHORTCUTS.map((token) => (
          <Button
            key={token}
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs border-slate-300 dark:border-strokedark text-gray-800 dark:text-gray-200"
            onClick={() => insertShortcut(token)}
          >
            + {token}
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 text-xs border-slate-300 dark:border-strokedark"
          onClick={() => addStep()}
        >
          <Plus className="h-3 w-3 mr-1" /> Étape
        </Button>
      </div>

      <div className="space-y-2">
        {steps.map((step, index) => {
          const typeLabel = stepTypeLabel(step)
          return (
            <div
              key={index}
              className={cn(
                "flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:gap-2 sm:p-2",
                stepRowClass(step),
                !step.trim() && "border-red-400 dark:border-red-500",
              )}
            >
              <div className="flex w-full sm:w-20 shrink-0 items-center justify-between sm:flex-col sm:items-start sm:justify-start gap-1">
                <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-bodydark2">
                  Étape {index + 1}
                </span>
                {typeLabel && (
                  <Badge
                    variant="outline"
                    className="h-5 px-1.5 text-[10px] font-semibold border-slate-300 dark:border-gray-500 text-slate-700 dark:text-gray-200"
                  >
                    {typeLabel}
                  </Badge>
                )}
              </div>
              <Input
                value={step}
                onChange={(e) => updateStep(index, e.target.value)}
                className="h-10 sm:h-9 w-full min-w-0 flex-1 font-mono text-sm bg-white dark:bg-boxdark-2 border-slate-200 dark:border-strokedark text-gray-900 dark:text-gray-100"
                placeholder="*880# ou NUM, PIN…"
              />
              <div className="flex shrink-0 items-center justify-end gap-1 sm:flex-col sm:gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={index === 0}
                  onClick={() => moveStep(index, -1)}
                  aria-label={`Monter l'étape ${index + 1}`}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={index === steps.length - 1}
                  onClick={() => moveStep(index, 1)}
                  aria-label={`Descendre l'étape ${index + 1}`}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-red-600 hover:text-red-700 dark:text-red-400"
                onClick={() => removeStep(index)}
                aria-label={`Supprimer l'étape ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        })}
        {steps.length === 0 && (
          <p className={`text-sm ${flashpayTheme.muted} rounded-lg border border-dashed border-slate-300 dark:border-gray-600 px-4 py-6 text-center`}>
            Aucune étape — ajoutez le pipeline USSD
          </p>
        )}
      </div>

      <details className="rounded-lg border border-slate-200 dark:border-strokedark bg-slate-50/80 dark:bg-boxdark-2/40 p-3">
        <summary className="cursor-pointer text-sm font-medium text-slate-600 dark:text-bodydark">
          Édition rapide (une étape par ligne)
        </summary>
        <Textarea
          className="mt-2 font-mono text-sm bg-white dark:bg-boxdark-2 border-slate-200 dark:border-strokedark"
          rows={5}
          value={bulkValue}
          onChange={(e) => onChange(e.target.value.split("\n").map((l) => l.trim()).filter(Boolean))}
          placeholder="Une étape par ligne"
        />
      </details>
    </div>
  )
})
