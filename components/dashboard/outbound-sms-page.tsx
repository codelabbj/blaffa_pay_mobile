"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, MessageSquare, Plus, RefreshCw, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useApi } from "@/lib/useApi"
import { useToast } from "@/hooks/use-toast"
import { extractErrorMessages } from "@/components/ui/error-display"
import { useLanguage } from "@/components/providers/language-provider"
import {
  createOutboundSmsJob,
  fetchNetworks,
  fetchOutboundSmsJobs,
  fetchStaffDevices,
  type OutboundSmsJob,
} from "@/lib/flashpay-device-api"
import { flashpayTheme, isSmsSenderDevice } from "@/lib/flashpay-device-utils"
import type { PaymentDevice } from "@/lib/types/flashpay-device"

const STATUS_VARIANT: Record<string, string> = {
  pending: "border-amber-300 text-amber-800",
  claimed: "border-blue-300 text-blue-800",
  sent: "border-green-300 text-green-800",
  failed: "border-red-300 text-red-800",
  cancelled: "border-slate-300 text-slate-600",
}

export function OutboundSmsPageContent() {
  const apiFetch = useApi()
  const { toast } = useToast()
  const { t } = useLanguage()
  const [jobs, setJobs] = useState<OutboundSmsJob[]>([])
  const [devices, setDevices] = useState<PaymentDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [deviceUid, setDeviceUid] = useState("")
  const [networkUid, setNetworkUid] = useState("")
  const [networks, setNetworks] = useState<{ uid: string; nom: string; code?: string }[]>([])
  const [toPhone, setToPhone] = useState("")
  const [message, setMessage] = useState("")

  const smsDevices = useMemo(() => {
    let list = devices.filter(isSmsSenderDevice)
    if (networkUid) list = list.filter((d) => d.network === networkUid)
    return list
  }, [devices, networkUid])

  const smsNetworks = useMemo(() => {
    const ids = new Set(devices.filter(isSmsSenderDevice).map((d) => d.network).filter(Boolean))
    return networks.filter((n) => ids.has(n.uid))
  }, [devices, networks])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [jobList, deviceList, networkList] = await Promise.all([
        fetchOutboundSmsJobs(apiFetch, statusFilter !== "all" ? { status: statusFilter } : undefined),
        fetchStaffDevices(apiFetch),
        fetchNetworks(apiFetch),
      ])
      setJobs(jobList)
      setDevices(deviceList)
      setNetworks(networkList)
    } catch (e: unknown) {
      toast({ title: "Erreur", description: extractErrorMessages(e), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [apiFetch, statusFilter, toast])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async () => {
    if (!toPhone.trim() || !message.trim()) {
      toast({ title: "Validation", description: "Numéro et message requis", variant: "destructive" })
      return
    }
    setSending(true)
    try {
      await createOutboundSmsJob(apiFetch, {
        to_phone: toPhone.trim(),
        message: message.trim(),
        ...(deviceUid ? { device: deviceUid } : {}),
        ...(networkUid && !deviceUid ? { network: networkUid } : {}),
      })
      setToPhone("")
      setMessage("")
      load()
    } catch (e: unknown) {
      toast({ title: "Erreur", description: extractErrorMessages(e), variant: "destructive" })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={flashpayTheme.page}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={flashpayTheme.title}>{t("outboundSms.title")}</h1>
            <p className={flashpayTheme.muted}>{t("outboundSms.subtitle")}</p>
          </div>
          <Button variant="outline" onClick={() => load()}>
            <RefreshCw className="h-4 w-4 mr-2" /> {t("common.refresh")}
          </Button>
        </div>

        <Card className={flashpayTheme.card}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0B2545] dark:text-gray-100">
              <Send className="h-5 w-5" /> {t("outboundSms.newRequest")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>{t("outboundSms.networkOptional")}</Label>
                <Select
                  value={networkUid || "__auto__"}
                  onValueChange={(v) => {
                    const next = v === "__auto__" ? "" : v
                    setNetworkUid(next)
                    if (next && deviceUid) {
                      const dev = devices.find((d) => d.uid === deviceUid)
                      if (dev?.network && dev.network !== next) setDeviceUid("")
                    }
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={t("outboundSms.allNetworks")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__auto__">{t("outboundSms.allNetworksAuto")}</SelectItem>
                    {smsNetworks.map((n) => (
                      <SelectItem key={n.uid} value={n.uid}>
                        {n.nom} {n.code ? `(${n.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className={`${flashpayTheme.mutedXs} mt-2`}>{t("outboundSms.networkHint")}</p>
              </div>
              <div>
                <Label>{t("outboundSms.deviceOptional")}</Label>
                <Select value={deviceUid || "__auto__"} onValueChange={(v) => setDeviceUid(v === "__auto__" ? "" : v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={t("outboundSms.deviceAuto")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__auto__">{t("outboundSms.deviceAuto")}</SelectItem>
                    {smsDevices.map((d) => (
                      <SelectItem key={d.uid} value={d.uid}>
                        {d.device_name || d.device_id}
                        {d.network_name ? ` · ${d.network_name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {smsDevices.length === 0 && (
                  <p className={`${flashpayTheme.mutedXs} mt-2`}>{t("outboundSms.noSenderDevice")}</p>
                )}
              </div>
            </div>
            <div>
              <Label>{t("outboundSms.recipient")}</Label>
              <Input className="mt-1" placeholder="+22670123456" value={toPhone} onChange={(e) => setToPhone(e.target.value)} />
            </div>
            <div>
              <Label>{t("outboundSms.message")}</Label>
              <Textarea className="mt-1 min-h-[100px]" value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
            <Button className={flashpayTheme.accentBtn} onClick={handleCreate} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {t("outboundSms.createRequest")}
            </Button>
          </CardContent>
        </Card>

        <Card className={flashpayTheme.card}>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-[#0B2545] dark:text-gray-100">
              <MessageSquare className="h-5 w-5" /> {t("outboundSms.queue")} ({jobs.length})
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("outboundSms.statusAll")}</SelectItem>
                <SelectItem value="pending">{t("outboundSms.statusPending")}</SelectItem>
                <SelectItem value="claimed">{t("outboundSms.statusClaimed")}</SelectItem>
                <SelectItem value="sent">{t("outboundSms.statusSent")}</SelectItem>
                <SelectItem value="failed">{t("outboundSms.statusFailed")}</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-6 sm:py-10">
                <Loader2 className={`h-8 w-8 animate-spin ${flashpayTheme.spinner}`} />
              </div>
            ) : jobs.length === 0 ? (
              <p className={`text-center py-12 ${flashpayTheme.muted}`}>{t("outboundSms.empty")}</p>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div key={job.uid} className="rounded-lg border border-slate-200 dark:border-strokedark p-4 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                      <p className="font-mono text-sm font-semibold">{job.to_phone}</p>
                      <Badge variant="outline" className={STATUS_VARIANT[job.status] ?? ""}>
                        {job.status_display || job.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-bodydark whitespace-pre-wrap">{job.message}</p>
                    <p className={`text-xs ${flashpayTheme.muted}`}>
                      {job.device_id ? `Device: ${job.device_id}` : "Device: auto"}
                      {job.network_name ? ` · ${job.network_name}` : ""}
                      {job.error_message ? ` · ${job.error_message}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
