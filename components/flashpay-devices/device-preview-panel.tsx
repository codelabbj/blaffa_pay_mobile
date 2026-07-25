"use client"

import { memo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Circle, Copy, Radio } from "lucide-react"
import type { DeviceFormValues, OperationTab } from "@/lib/types/flashpay-device"
import { UssdTimeline } from "@/components/flashpay-devices/ussd-timeline"
import {
  computeCompletion,
  flashpayTheme,
  formatDeviceMode,
  formatExecutionMode,
  getRequiredUssdOperations,
  hasUssdSteps,
  isAppExecutionMode,
} from "@/lib/flashpay-device-utils"
import { useToast } from "@/hooks/use-toast"

interface DevicePreviewPanelProps {
  form: DeviceFormValues
  networkName?: string
  onPushConfig?: () => void
  pushing?: boolean
}

const OPERATION_LABELS: Record<OperationTab, string> = {
  deposit: "Dépôt",
  withdraw: "Retrait",
  balance: "Solde",
}

export const DevicePreviewPanel = memo(function DevicePreviewPanel({
  form,
  networkName,
  onPushConfig,
  pushing,
}: DevicePreviewPanelProps) {
  const { toast } = useToast()
  const fp = form.custom_settings.flashpay
  const { percent, missing, mode, done, total } = computeCompletion(form)
  const appMode = isAppExecutionMode(fp?.execution_mode)

  const copyId = () => {
    navigator.clipboard.writeText(form.device_id)
    toast({ title: "Copié", description: "device_id copié" })
  }

  const checklist = [
    { ok: !!form.device_id.trim(), label: "device_id unique" },
    { ok: !!form.user, label: "Agent propriétaire" },
    { ok: !!form.network, label: "Réseau" },
    ...getRequiredUssdOperations(mode, fp?.execution_mode).map((op) => ({
      ok: hasUssdSteps(form, op),
      label: op === "deposit" ? "USSD dépôt" : "USSD retrait",
    })),
    { ok: !!fp?.momo_pin?.trim(), label: "PIN MoMo" },
  ]

  const cardTitle = "text-base text-[#0B2545] dark:text-gray-100"

  return (
    <div className="space-y-4 lg:static">
      <Card className={flashpayTheme.panelCard}>
        <CardHeader className="pb-2">
          <CardTitle className={cardTitle}>Aperçu mobile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            FlashPay — {fp?.network_label || networkName || "Réseau"} · SIM {(fp?.sim_slot ?? 0) + 1}
          </p>
          <p className="text-slate-600 dark:text-bodydark2">
            Exécution : {formatExecutionMode(fp?.execution_mode)}
          </p>
          <p className="text-slate-600 dark:text-bodydark2">
            {form.device_name || form.device_id} · {done}/{total} critères
          </p>
          {!appMode && (
            <>
              <p className="text-slate-600 dark:text-bodydark2">
                Dépôt: {(fp?.deposit?.ussd_steps?.filter((s) => s.trim()).length ?? 0)} étapes · {fp?.deposit?.session_type ?? "multi"}
              </p>
              <p className="text-slate-600 dark:text-bodydark2">
                Retrait: {(fp?.withdraw?.ussd_steps?.filter((s) => s.trim()).length ?? 0)} étapes
              </p>
              <p className="text-slate-600 dark:text-bodydark2">
                Solde: {(fp?.balance?.ussd_steps?.filter((s) => s.trim()).length ?? 0)} étapes
              </p>
            </>
          )}
          <p className="text-slate-600 dark:text-bodydark2">PIN: {fp?.momo_pin ? "••••" : "—"}</p>
          <Badge variant="outline" className="mt-2 dark:border-strokedark">
            Complétion {percent}% · {formatDeviceMode(mode)}
          </Badge>
        </CardContent>
      </Card>

      <Card className={flashpayTheme.panelCard}>
        <CardHeader className="pb-2">
          <CardTitle className={cardTitle}>Timelines USSD</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 bg-slate-50/50 dark:bg-boxdark-2/40 rounded-b-xl">
          {(["deposit", "withdraw", "balance"] as OperationTab[]).map((tab) => {
            const steps = fp?.[tab]?.ussd_steps ?? []
            return (
              <div key={tab}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-bodydark2 mb-2">
                  {OPERATION_LABELS[tab]}
                </p>
                <UssdTimeline steps={steps} />
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card className={flashpayTheme.panelCard}>
        <CardHeader className="pb-2">
          <CardTitle className={cardTitle}>Checklist déploiement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              {item.ok ? (
                <CheckCircle2 className="h-4 w-4 text-meta-3 dark:text-green-400" />
              ) : (
                <Circle className="h-4 w-4 text-slate-300 dark:text-body" />
              )}
              <span className={item.ok ? "text-slate-700 dark:text-gray-200" : "text-slate-400 dark:text-body"}>
                {item.label}
              </span>
            </div>
          ))}
          {missing.length > 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">Manquant : {missing.join(", ")}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {onPushConfig && form.device_id && (
          <Button
            type="button"
            variant="outline"
            className={flashpayTheme.navyOutline}
            onClick={onPushConfig}
            disabled={pushing}
          >
            <Radio className="h-4 w-4 mr-2" />
            {pushing ? "Envoi WS…" : "Pousser config mobile"}
          </Button>
        )}
        {form.device_id && (
          <Button type="button" variant="ghost" size="sm" onClick={copyId}>
            <Copy className="h-4 w-4 mr-2" /> Copier device_id
          </Button>
        )}
      </div>
    </div>
  )
})
