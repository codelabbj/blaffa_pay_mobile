"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Copy,
  Filter,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  MessageSquare,
  Radio,
  RefreshCw,
  Search,
  Smartphone,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useApi } from "@/lib/useApi"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { DevicePickerDrawer } from "@/components/flashpay-devices/device-picker-drawer"
import {
  bulkDeleteDevices,
  bulkPushDeviceConfig,
  bulkToggleDevicePause,
  deleteDevice,
  fetchNetworks,
  fetchStaffDevices,
  pushDeviceConfig,
  toggleDevicePause,
} from "@/lib/flashpay-device-api"
import type { PaymentDevice } from "@/lib/types/flashpay-device"
import {
  activeKpiFromFilters,
  applyClientConfigFilter,
  buildDeviceListApiParams,
  DEFAULT_DEVICE_LIST_FILTERS,
  DEFAULT_DEVICE_SORT,
  DEVICE_SORT_COLUMNS,
  filtersFromKpi,
  hasActiveFilters,
  toggleSort,
  type DeviceListFilters,
  type DeviceSortField,
  type DeviceSortState,
} from "@/lib/flashpay-device-list"
import {
  computeCompletion,
  flashpayTheme,
  formatDeviceMode,
  formatRelativeTime,
  isDeviceConfigured,
  isDeviceEffectivelyOnline,
  isSmsSenderDevice,
  networkChipClass,
  networkInitials,
  ussdConfigSummary,
} from "@/lib/flashpay-device-utils"

function StatusDot({ device }: { device: PaymentDevice }) {
  if (device.is_paused) {
    return (
      <span className="inline-flex items-center gap-1 text-primary dark:text-primary text-xs font-medium">
        ⏸ Pause
      </span>
    )
  }
  if (isDeviceEffectivelyOnline(device)) {
    return (
      <span className="inline-flex items-center gap-1.5 text-meta-3 dark:text-green-400 text-xs font-medium">
        <span className="h-2 w-2 rounded-full bg-meta-3 animate-pulse" /> En ligne
      </span>
    )
  }
  return <span className="inline-flex items-center gap-1 text-slate-400 dark:text-body text-xs">○ Hors ligne</span>
}

function SortableHead({
  label,
  field,
  sort,
  onSort,
  className,
}: {
  label: string
  field: DeviceSortField
  sort: DeviceSortState
  onSort: (field: DeviceSortField) => void
  className?: string
}) {
  const active = sort.field === field
  const Icon = active ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 font-medium hover:text-[#0B2545] dark:hover:text-gray-100 transition-colors"
      >
        {label}
        <Icon className={`h-3.5 w-3.5 ${active ? "text-[#D4A24C]" : "text-slate-400"}`} />
      </button>
    </TableHead>
  )
}

export default function FlashPayDevicesPage() {
  const apiFetch = useApi()
  const router = useRouter()
  const { toast } = useToast()
  const [devices, setDevices] = useState<PaymentDevice[]>([])
  const [networks, setNetworks] = useState<{ uid: string; nom: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [error, setError] = useState("")
  const [filters, setFilters] = useState<DeviceListFilters>(DEFAULT_DEVICE_LIST_FILTERS)
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [sort, setSort] = useState<DeviceSortState>(DEFAULT_DEVICE_SORT)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pickerOpen, setPickerOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PaymentDevice[] | null>(null)
  const [deleting, setDeleting] = useState(false)

  const kpiFilter = activeKpiFromFilters(filters)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(filters.search.trim())
    }, 350)
    return () => clearTimeout(t)
  }, [filters.search])

  useEffect(() => {
    fetchNetworks(apiFetch).then(setNetworks).catch(() => setNetworks([]))
  }, [apiFetch])

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true)
      setError("")
      try {
        const apiFilters = { ...filters, search: debouncedSearch }
        const params = buildDeviceListApiParams(apiFilters, sort)
        const data = await fetchStaffDevices(apiFetch, params)
        setDevices(data)
        setSelected(new Set())
      } catch (e: any) {
        if (!opts?.silent) {
          setError(extractErrorMessages(e) || "Impossible de charger les devices")
          setDevices([])
        }
      } finally {
        if (!opts?.silent) setLoading(false)
      }
    },
    [apiFetch, debouncedSearch, filters, sort],
  )

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load({ silent: true })
    }, 30_000)
    return () => clearInterval(id)
  }, [load])

  const displayed = useMemo(
    () => applyClientConfigFilter(devices, filters.config),
    [devices, filters.config],
  )

  const selectedDevices = useMemo(
    () => displayed.filter((d) => selected.has(d.uid)),
    [displayed, selected],
  )

  const allSelected = displayed.length > 0 && displayed.every((d) => selected.has(d.uid))
  const someSelected = displayed.some((d) => selected.has(d.uid))

  const kpis = useMemo(
    () => ({
      total: displayed.length,
      online: displayed.filter((d) => isDeviceEffectivelyOnline(d)).length,
      paused: displayed.filter((d) => d.is_paused).length,
      unconfigured: displayed.filter((d) => !isDeviceConfigured(d)).length,
    }),
    [displayed],
  )

  const patchFilters = (partial: Partial<DeviceListFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }))
  }

  const handleSort = (field: DeviceSortField) => {
    setSort((prev) => toggleSort(prev, field))
  }

  const toggleRow = (uid: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(uid)
      else next.delete(uid)
      return next
    })
  }

  const toggleAll = (checked: boolean) => {
    if (checked) setSelected(new Set(displayed.map((d) => d.uid)))
    else setSelected(new Set())
  }

  const handlePush = async (device: PaymentDevice) => {
    try {
      await pushDeviceConfig(apiFetch, device.device_id)
    } catch (e: any) {
      toast({ title: "Erreur", description: extractErrorMessages(e), variant: "destructive" })
    }
  }

  const handlePauseToggle = async (device: PaymentDevice) => {
    try {
      await toggleDevicePause(apiFetch, device, !device.is_paused)
      toast({ title: device.is_paused ? "Device repris" : "Device en pause" })
      load()
    } catch (e: any) {
      toast({ title: "Erreur", description: extractErrorMessages(e), variant: "destructive" })
    }
  }

  const runBulk = async (
    action: "pause" | "resume" | "push",
    targets: PaymentDevice[],
  ) => {
    if (!targets.length) return
    setBulkLoading(true)
    try {
      if (action === "push") {
        const { ok, failed } = await bulkPushDeviceConfig(apiFetch, targets)
        toast({
          title: "Config poussée",
          description: `${ok} envoyé(s)${failed ? `, ${failed} échec(s)` : ""}`,
          variant: failed ? "destructive" : "default",
        })
      } else {
        const pause = action === "pause"
        const { ok, failed } = await bulkToggleDevicePause(apiFetch, targets, pause)
        toast({
          title: pause ? "Pause groupée" : "Reprise groupée",
          description: `${ok} mis à jour${failed ? `, ${failed} échec(s)` : ""}`,
          variant: failed ? "destructive" : "default",
        })
        load()
      }
      setSelected(new Set())
    } catch (e: any) {
      toast({ title: "Erreur", description: extractErrorMessages(e), variant: "destructive" })
    } finally {
      setBulkLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?.length) return
    setDeleting(true)
    try {
      if (deleteTarget.length === 1) {
        await deleteDevice(apiFetch, deleteTarget[0].uid)
      } else {
        const { ok, failed } = await bulkDeleteDevices(apiFetch, deleteTarget)
        toast({
          title: "Suppression groupée",
          description: `${ok} supprimé(s)${failed ? `, ${failed} échec(s)` : ""}`,
          variant: failed ? "destructive" : "default",
        })
      }
      setDeleteTarget(null)
      setSelected(new Set())
      load()
    } catch (e: any) {
      toast({ title: "Erreur", description: extractErrorMessages(e), variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={flashpayTheme.page}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={flashpayTheme.title}>Appareils FlashPay</h1>
            <p className={`${flashpayTheme.muted} mt-1`}>
              Gérez les téléphones agents et leurs configs MoMo
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className={flashpayTheme.navyOutline} asChild>
              <Link href="/dashboard/sms-outbound">
                <MessageSquare className="h-4 w-4 mr-2" /> SMS sortants
              </Link>
            </Button>
            <Button variant="outline" className={flashpayTheme.navyOutline} onClick={() => setPickerOpen(true)}>
              <Copy className="h-4 w-4 mr-2" /> Depuis modèle
            </Button>
            <Button className={flashpayTheme.accentBtn} asChild>
              <Link href="/dashboard/devices/flashpay/new">
                <Plus className="h-4 w-4 mr-2" /> Nouveau
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {(
            [
              ["all", "Total", kpis.total],
              ["online", "En ligne", kpis.online],
              ["paused", "En pause", kpis.paused],
              ["unconfigured", "Non configuré", kpis.unconfigured],
            ] as const
          ).map(([key, label, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilters((prev) => filtersFromKpi(key, prev))}
              className={flashpayTheme.kpiCard(kpiFilter === key)}
            >
              <p className="text-lg font-bold sm:text-xl text-[#0B2545] dark:text-gray-100">{value}</p>
              <p className={flashpayTheme.muted}>{label}</p>
            </button>
          ))}
        </div>

        <Card className={flashpayTheme.card}>
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-body" />
                <Input
                  className="pl-9 bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                  placeholder="Rechercher device_id, nom, agent, email, téléphone, réseau…"
                  value={filters.search}
                  onChange={(e) => patchFilters({ search: e.target.value })}
                />
              </div>
              <Button variant="outline" onClick={() => load()}>
                <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500 shrink-0" />
              <Select value={filters.status} onValueChange={(v) => patchFilters({ status: v as DeviceListFilters["status"] })}>
                <SelectTrigger className="w-[130px] h-9 bg-gray-50 dark:bg-meta-4">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="online">En ligne</SelectItem>
                  <SelectItem value="offline">Hors ligne</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.pause} onValueChange={(v) => patchFilters({ pause: v as DeviceListFilters["pause"] })}>
                <SelectTrigger className="w-[130px] h-9 bg-gray-50 dark:bg-meta-4">
                  <SelectValue placeholder="Pause" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Pause / actif</SelectItem>
                  <SelectItem value="paused">En pause</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.mode} onValueChange={(v) => patchFilters({ mode: v as DeviceListFilters["mode"] })}>
                <SelectTrigger className="w-[120px] h-9 bg-gray-50 dark:bg-meta-4">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous modes</SelectItem>
                  <SelectItem value="deposit">Dépôt</SelectItem>
                  <SelectItem value="withdrawal">Retrait</SelectItem>
                  <SelectItem value="both">Les deux</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.network} onValueChange={(v) => patchFilters({ network: v })}>
                <SelectTrigger className="w-[160px] h-9 bg-gray-50 dark:bg-meta-4">
                  <SelectValue placeholder="Réseau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous réseaux</SelectItem>
                  {networks.map((n) => (
                    <SelectItem key={n.uid} value={n.uid}>
                      {n.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.config} onValueChange={(v) => patchFilters({ config: v as DeviceListFilters["config"] })}>
                <SelectTrigger className="w-[150px] h-9 bg-gray-50 dark:bg-meta-4">
                  <SelectValue placeholder="Config" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toute config</SelectItem>
                  <SelectItem value="configured">Configurés</SelectItem>
                  <SelectItem value="unconfigured">Incomplets</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={`${sort.field}:${sort.dir}`}
                onValueChange={(v) => {
                  const [field, dir] = v.split(":") as [DeviceSortField, "asc" | "desc"]
                  setSort({ field, dir })
                }}
              >
                <SelectTrigger className="w-[180px] h-9 bg-gray-50 dark:bg-meta-4">
                  <SelectValue placeholder="Tri" />
                </SelectTrigger>
                <SelectContent>
                  {DEVICE_SORT_COLUMNS.flatMap((col) => [
                    <SelectItem key={`${col.field}:desc`} value={`${col.field}:desc`}>
                      {col.label} ↓
                    </SelectItem>,
                    <SelectItem key={`${col.field}:asc`} value={`${col.field}:asc`}>
                      {col.label} ↑
                    </SelectItem>,
                  ])}
                </SelectContent>
              </Select>

              {hasActiveFilters(filters) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-slate-600"
                  onClick={() => setFilters({ ...DEFAULT_DEVICE_LIST_FILTERS, search: filters.search })}
                >
                  <X className="h-4 w-4 mr-1" /> Effacer filtres
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {selected.size > 0 && (
          <Card className="border-[#D4A24C] bg-amber-50/80 dark:bg-amber-900/20">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-sm font-medium text-[#0B2545] dark:text-gray-100">
                {selected.size} device{selected.size > 1 ? "s" : ""} sélectionné{selected.size > 1 ? "s" : ""}
              </p>
              <div className="flex flex-wrap gap-2 sm:ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={bulkLoading}
                  onClick={() => runBulk("pause", selectedDevices)}
                >
                  <Pause className="h-4 w-4 mr-1" /> Mettre en pause
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={bulkLoading}
                  onClick={() => runBulk("resume", selectedDevices)}
                >
                  <Play className="h-4 w-4 mr-1" /> Reprendre
                </Button>
                <Button
                  size="sm"
                  className={flashpayTheme.accentBtn}
                  disabled={bulkLoading}
                  onClick={() => runBulk("push", selectedDevices)}
                >
                  <Radio className="h-4 w-4 mr-1" /> Pousser config
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={bulkLoading}
                  className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                  onClick={() => setDeleteTarget(selectedDevices)}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className={`${flashpayTheme.card} overflow-hidden`}>
          <CardHeader className={flashpayTheme.cardHeader}>
            <CardTitle className="text-[#0B2545] dark:text-gray-100 flex items-center gap-2">
              <Smartphone className="h-5 w-5" /> Liste ({displayed.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-3 sm:p-4 md:p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="p-3 sm:p-4 md:p-6">
                <ErrorDisplay error={error} onRetry={load} />
              </div>
            ) : displayed.length === 0 ? (
              <div className="p-12 text-center">
                <Sparkles className="h-10 w-10 text-slate-300 dark:text-body mx-auto mb-3" />
                <p className="text-slate-600 dark:text-bodydark font-medium">Aucun appareil</p>
                {hasActiveFilters(filters) || debouncedSearch ? (
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => setFilters(DEFAULT_DEVICE_LIST_FILTERS)}
                  >
                    Réinitialiser les filtres
                  </Button>
                ) : (
                  <Button className={`mt-4 ${flashpayTheme.accentBtn}`} asChild>
                    <Link href="/dashboard/devices/flashpay/new">Créer le premier</Link>
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected ? true : someSelected ? "indeterminate" : false}
                        onCheckedChange={(v) => toggleAll(v === true)}
                        aria-label="Tout sélectionner"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableHead>
                    <SortableHead label="Statut" field="is_online" sort={sort} onSort={handleSort} />
                    <SortableHead label="Device" field="device_name" sort={sort} onSort={handleSort} />
                    <TableHead>Agent</TableHead>
                    <TableHead>Réseau</TableHead>
                    <SortableHead label="Config" field="mode" sort={sort} onSort={handleSort} />
                    <SortableHead label="Activité" field="last_seen" sort={sort} onSort={handleSort} />
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.map((device) => (
                    <TableRow
                      key={device.uid}
                      className={flashpayTheme.tableRowHover}
                      data-state={selected.has(device.uid) ? "selected" : undefined}
                      onClick={() => router.push(`/dashboard/devices/flashpay/${device.uid}`)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected.has(device.uid)}
                          onCheckedChange={(v) => toggleRow(device.uid, v === true)}
                          aria-label={`Sélectionner ${device.device_id}`}
                        />
                      </TableCell>
                      <TableCell data-label="Agent">
                        <StatusDot device={device} />
                      </TableCell>
                      <TableCell data-label="Réseau">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-[#0B2545] text-white text-xs font-bold flex items-center justify-center">
                            {networkInitials(device.network_name, device.custom_settings?.flashpay?.network_code)}
                          </div>
                            <div>
                            <p className="font-semibold text-[#0B2545] dark:text-gray-100">{device.device_name || "—"}</p>
                            <p className="font-mono text-xs text-slate-500 dark:text-bodydark2">{device.device_id}</p>
                            {isSmsSenderDevice(device) && (
                              <Badge variant="outline" className="mt-1 text-xs border-violet-300 text-violet-800">
                                Émetteur SMS
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-900 dark:text-gray-200">{device.user_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={networkChipClass(device.custom_settings?.flashpay?.network_code)}>
                          {device.network_name || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const progress = computeCompletion(device)
                          return isDeviceConfigured(device) ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/30">
                              {progress.percent}% · {formatDeviceMode(device.mode)} · {ussdConfigSummary(device)}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-300 text-amber-800 dark:border-amber-700 dark:text-amber-300">
                              {progress.percent}% · {formatDeviceMode(device.mode)}
                            </Badge>
                          )
                        })()}
                      </TableCell>
                      <TableCell className={`text-sm ${flashpayTheme.muted}`}>{formatRelativeTime(device.last_seen)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/devices/flashpay/${device.uid}`)}>
                              Ouvrir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/devices/flashpay/new?from=${device.uid}`)}>
                              Dupliquer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePush(device)}>
                              <Radio className="h-4 w-4 mr-2" /> Pousser config
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePauseToggle(device)}>
                              <span className="inline-flex items-center">
                                {device.is_paused ? (
                                  <Play className="h-4 w-4 mr-2" />
                                ) : (
                                  <Pause className="h-4 w-4 mr-2" />
                                )}
                                {device.is_paused ? "Reprendre" : "Mettre en pause"}
                              </span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => setDeleteTarget([device])}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <DevicePickerDrawer
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        devices={devices}
        onSelect={(d) => router.push(`/dashboard/devices/flashpay/new?from=${d.uid}`)}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget && deleteTarget.length > 1
                ? `Supprimer ${deleteTarget.length} devices`
                : "Supprimer le device"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && deleteTarget.length === 1 ? (
                <>
                  Êtes-vous sûr de vouloir supprimer{" "}
                  <strong>{deleteTarget[0].device_name || deleteTarget[0].device_id}</strong> ?
                  Cette action est irréversible.
                </>
              ) : (
                <>Êtes-vous sûr de vouloir supprimer les devices sélectionnés ? Cette action est irréversible.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
