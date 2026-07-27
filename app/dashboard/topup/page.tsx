"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, ChevronLeft, ChevronRight, Copy, DollarSign, Clock, CheckCircle, XCircle, Loader2, Eye, AlertTriangle, RefreshCw, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { useApi } from "@/lib/useApi"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DateRangeFilter } from "@/components/ui/date-range-filter"
import { getApiBaseUrl } from "@/lib/env-config"
import { CopyButton } from "@/components/ui/copy-button"

function formatAmount(x: any) {
  const n = Number(x || 0)
  if (Number.isNaN(n)) return "0"
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 0 })
}

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "")
  const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getRelativeTime(iso?: string | null) {
  if (!iso) return ""
  const date = new Date(iso).getTime()
  if (Number.isNaN(date)) return ""
  const diffMs = Date.now() - date
  const s = Math.max(1, Math.floor(diffMs / 1000))
  if (s < 60) return `il y a ${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `il y a ${d}j`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `il y a ${mo} mois`
  const y = Math.floor(mo / 12)
  return `il y a ${y} an${y > 1 ? "s" : ""}`
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending:         { label: "En attente",     color: "#f59e0b" },
  proof_submitted: { label: "Preuve soumise", color: "#8b5cf6" },
  approved:        { label: "Approuve",       color: "#10b981" },
  rejected:        { label: "Rejete",         color: "#ef4444" },
  completed:       { label: "Termine",        color: "#3b82f6" },
  expired:         { label: "Expire",         color: "#6b7280" },
}

function getStatusInfo(statusDisplay: string): { label: string; color: string } {
  if (!statusDisplay) return { label: "-", color: "#adb5bd" }
  const key = statusDisplay.toLowerCase()
  if (key.includes("attente") || key === "pending") return statusConfig.pending
  if (key.includes("preuve") || key === "proof_submitted") return statusConfig.proof_submitted
  if (key.includes("approu")) return statusConfig.approved
  if (key.includes("rejet")) return statusConfig.rejected
  if (key.includes("termin") || key === "completed") return statusConfig.completed
  if (key.includes("expir")) return statusConfig.expired
  return { label: statusDisplay, color: "#adb5bd" }
}

function getStatusRowClass(statusDisplay: string): string {
  if (!statusDisplay) return ""
  const key = statusDisplay.toLowerCase()
  if (key.includes("attente") || key === "pending") return "border-l-4 border-l-yellow-400"
  if (key.includes("preuve") || key === "proof_submitted") return "border-l-4 border-l-purple-500"
  if (key.includes("approu")) return "border-l-4 border-l-green-500"
  if (key.includes("rejet")) return "border-l-4 border-l-red-500"
  if (key.includes("termin") || key === "completed") return "border-l-4 border-l-blue-500"
  if (key.includes("expir")) return "border-l-4 border-l-gray-400"
  return ""
}

export default function TopupPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [topups, setTopups] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [sortField, setSortField] = useState<"amount" | "created_at" | "status" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const { t } = useLanguage()
  const itemsPerPage = 10
  const baseUrl = getApiBaseUrl()
  const { toast } = useToast()
  const apiFetch = useApi()
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailTopup, setDetailTopup] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState("")
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)
  const [actionTopup, setActionTopup] = useState<any | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [pendingAction, setPendingAction] = useState(false)
  const [disabledTopups, setDisabledTopups] = useState<{ [uid: string]: "approved" | "rejected" | undefined }>({})
  const [proofImageModalOpen, setProofImageModalOpen] = useState(false)
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string>("")

  const pendingCount = topups.filter(t => { const s = (t.status_display || t.status || "").toLowerCase(); return s.includes("attente") || s === "pending" }).length
  const approvedCount = topups.filter(t => (t.status_display || t.status || "").toLowerCase().includes("approu")).length
  const rejectedCount = topups.filter(t => (t.status_display || t.status || "").toLowerCase().includes("rejet")).length
  const totalAmount = topups.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
  const startIndex = (currentPage - 1) * itemsPerPage

  const hasActiveFilters = searchTerm.trim() !== "" || statusFilter !== "all" || startDate || endDate

  const fetchTopups = async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: itemsPerPage.toString(),
      })
      if (searchTerm.trim() !== "") params.append("search", searchTerm)
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (startDate) params.append("created_at__gte", startDate)
      if (endDate) params.append("created_at__lte", endDate)
      const orderingParam = sortField ? `&ordering=${sortDirection === "asc" ? "+" : "-"}${sortField}` : ""
      const endpoint = `payments/recharge-requests/?${params.toString()}${orderingParam}`
      const data = await apiFetch(endpoint)
      setTopups(data.results || [])
      setTotalCount(data.count || 0)
      setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      setError(errorMessage)
      setTopups([])
      setTotalCount(0)
      setTotalPages(1)
      toast({ title: t("topup.failedToLoad"), description: errorMessage, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchTopups()
    setRefreshing(false)
  }

  useEffect(() => { fetchTopups() }, [searchTerm, currentPage, statusFilter, sortField, sortDirection, startDate, endDate])

  const handleOpenDetail = async (uid: string) => {
    setDetailModalOpen(true)
    setDetailLoading(true)
    setDetailError("")
    setDetailTopup(null)
    try {
      const found = topups.find((t) => t.uid === uid)
      setDetailTopup(found)
    } catch (err: any) {
      setDetailError(extractErrorMessages(err))
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCloseDetail = () => {
    setDetailModalOpen(false)
    setDetailTopup(null)
    setDetailError("")
  }

  return (
    <div className="min-h-screen bg-whiten dark:bg-boxdark-2">
      <div className="w-full">

        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
            <div>
              <h1 className="text-base font-bold sm:text-lg sm:text-2xl bg-gradient-to-r from-primary to-meta-3 bg-clip-text text-transparent">
                {t("topup.title") || "Top Up Requests"}
              </h1>
              <p className="text-body dark:text-bodydark mt-2 text-lg">
                Gérer et examiner les demandes de recharge
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="bg-white dark:bg-boxdark rounded-lg px-4 py-2 shadow-sm">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-gray-700 dark:text-bodydark">
                    {totalCount} demandes
                  </span>
                </div>
              </div>
              <Button onClick={handleRefresh} disabled={refreshing || loading} variant="outline" size="sm" className="gap-1.5">
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Rafraichir
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 sm:mb-6">
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-body dark:text-bodydark2 mb-1">Total Montant</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatAmount(totalAmount)} FCFA</p>
            </CardContent>
          </Card>
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-yellow-500" />
                <p className="text-xs font-medium text-body dark:text-bodydark2">En attente</p>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{pendingCount}</p>
            </CardContent>
          </Card>
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-meta-3" />
                <p className="text-xs font-medium text-body dark:text-bodydark2">Approuve</p>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{approvedCount}</p>
            </CardContent>
          </Card>
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="h-4 w-4 text-red-500" />
                <p className="text-xs font-medium text-body dark:text-bodydark2">Rejete</p>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{rejectedCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-bodydark2" />
                <Input
                  placeholder={t("topup.search") || "Rechercher..."}
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
                  className="pl-10 bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
                <SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuve</SelectItem>
                  <SelectItem value="rejected">Rejete</SelectItem>
                  <SelectItem value="proof_submitted">Preuve soumise</SelectItem>
                  <SelectItem value="expired">Expire</SelectItem>
                </SelectContent>
              </Select>
              <DateRangeFilter
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onClear={() => { setStartDate(null); setEndDate(null) }}
                placeholder="Filtrer par date"
                className="col-span-1 sm:col-span-2 md:col-span-2"
              />
            </div>
            {hasActiveFilters && (
              <div className="flex justify-end mt-3 pt-3 border-t border-gray-100 dark:border-strokedark">
                <Button type="button" variant="ghost" size="sm" onClick={() => { setSearchTerm(""); setStatusFilter("all"); setStartDate(null); setEndDate(null); setCurrentPage(1) }}>
                  <X className="h-4 w-4 mr-1" /> Effacer filtres
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recharge Card List */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <CardHeader className="border-b border-gray-100 dark:border-strokedark">
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary dark:text-blue-300" />
              </div>
              <span>Demandes de Recharge</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-5">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-body dark:text-bodydark">Chargement des demandes...</span>
                </div>
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <ErrorDisplay error={error} onRetry={fetchTopups} />
              </div>
            ) : topups.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gray-100 dark:bg-meta-4 flex items-center justify-center">
                  <DollarSign className="h-8 w-8 text-bodydark2" />
                </div>
                <p className="text-body dark:text-bodydark">Aucune demande de recharge trouvee.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topups.map((topup) => {
                  const statusInfo = getStatusInfo(topup.status_display || topup.status)
                  const rowClass = getStatusRowClass(topup.status_display || topup.status)
                  const relativeTime = getRelativeTime(topup.created_at)
                  const rawStatus = (topup.status_display || topup.status || "").toLowerCase()
                  const isPending = rawStatus.includes("attente") || rawStatus === "pending" || rawStatus.includes("preuve") || rawStatus === "proof_submitted"
                  const isApproved = rawStatus.includes("approu") || rawStatus === "approved" || rawStatus.includes("termin") || rawStatus === "completed"
                  const isRejected = rawStatus.includes("rejet") || rawStatus === "rejected" || rawStatus.includes("expir") || rawStatus === "expired"
                  const isDisabled = !!disabledTopups[topup.uid] || !!topup.is_expired
                  return (
                    <div
                      key={topup.uid}
                      className={`relative rounded-2xl border bg-white dark:bg-meta-4/20 px-5 pt-5 pb-4 shadow-sm transition hover:shadow-md ${rowClass} ${isPending ? "border-amber-200 dark:border-amber-700/40" : isApproved ? "border-green-200 dark:border-green-700/40" : isRejected ? "border-red-200 dark:border-red-700/40" : "border-stroke dark:border-strokedark"}`}
                    >
                      {/* Row 1: User name + reference + status badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate max-w-[220px]">
                              {topup.user_name || "Utilisateur"}
                            </h3>
                            {topup.user_email && (
                              <span className="text-xs text-body dark:text-bodydark2 truncate">{topup.user_email}</span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-sm text-body dark:text-bodydark2 font-mono">
                            <span className="truncate">{topup.uid}</span>
                            {topup.reference && (
                              <>
                                <span className="opacity-50">·</span>
                                <span className="truncate">{topup.reference}</span>
                              </>
                            )}
                            <CopyButton value={topup.uid} className="h-3.5 w-3.5 opacity-70" iconClassName="h-3 w-3" />
                          </div>
                        </div>
                        <span
                          className="flex-shrink-0 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold"
                          style={{
                            backgroundColor: hexToRgba(statusInfo.color, 0.12),
                            color: statusInfo.color,
                          }}
                        >
                          {statusInfo.label || (topup.status_display || topup.status)}
                        </span>
                      </div>

                      {/* Row 2: Amount */}
                      <div className="mt-2 flex items-center gap-3 flex-wrap">
                        <div className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
                          {formatAmount(topup.amount)} FCFA
                        </div>
                        {topup.formatted_amount && topup.formatted_amount !== topup.amount && (
                          <span className="text-sm text-body dark:text-bodydark2">{topup.formatted_amount}</span>
                        )}
                      </div>

                      {/* Row 3: Date + relative time */}
                      <div className="mt-1.5 flex items-center gap-x-4 gap-y-1 flex-wrap text-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="text-body dark:text-bodydark2">
                            {topup.created_at ? new Date(topup.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-"}
                          </span>
                          {relativeTime && (
                            <span className="text-red-600 dark:text-red-400 font-semibold">{relativeTime}</span>
                          )}
                        </div>
                        {topup.expires_at && (
                          <div className="flex items-center gap-1 text-xs text-body dark:text-bodydark2">
                            <Clock className="h-3 w-3" />
                            Expire: {new Date(topup.expires_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        )}
                      </div>

                      {/* Proof info */}
                      {topup.proof_description && (
                        <div className="mt-2 text-xs text-body dark:text-bodydark2 italic">{topup.proof_description}</div>
                      )}
                      {topup.admin_notes && (
                        <div className="mt-3 rounded-xl bg-blue-50 dark:bg-blue-900/15 border border-blue-200 dark:border-blue-700/40 px-3 py-2.5 text-blue-800 dark:text-blue-300">
                          <div className="text-sm font-semibold leading-snug">Note admin: {topup.admin_notes}</div>
                        </div>
                      )}
                      {topup.rejection_reason && (
                        <div className="mt-3 rounded-xl bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-700/40 px-3 py-2.5 text-red-800 dark:text-red-300">
                          <div className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div className="text-sm font-semibold leading-snug">Raison du rejet: {topup.rejection_reason}</div>
                          </div>
                        </div>
                      )}
                      {topup.is_expired && (
                        <div className="mt-3 rounded-xl bg-gray-50 dark:bg-gray-900/15 border border-gray-200 dark:border-gray-700/40 px-3 py-2.5 text-gray-600 dark:text-gray-300">
                          <div className="text-sm font-semibold leading-snug">Demande expiree</div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="mt-4 flex flex-col gap-2">
                        {isPending && !isDisabled && (
                          <button
                            type="button"
                            onClick={() => { setActionType("approve"); setActionTopup(topup); setAdminNotes(""); setActionModalOpen(true) }}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:brightness-110 text-white px-4 py-3 text-base font-semibold shadow-sm transition"
                          >
                            <CheckCircle className="h-5 w-5" />
                            Approuver
                          </button>
                        )}
                        {disabledTopups[topup.uid] === "approved" && (
                          <div className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-4 py-3 text-base font-semibold border border-green-200 dark:border-green-700/40">
                            <CheckCircle className="h-5 w-5" />
                            Approuve
                          </div>
                        )}
                        {isPending && !isDisabled && (
                          <button
                            type="button"
                            onClick={() => { setActionType("reject"); setActionTopup(topup); setAdminNotes(""); setRejectionReason(""); setActionModalOpen(true) }}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-3 text-base font-semibold border border-red-200 dark:border-red-700/40 transition"
                          >
                            <XCircle className="h-5 w-5" />
                            Rejeter
                          </button>
                        )}
                        {disabledTopups[topup.uid] === "rejected" && (
                          <div className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 px-4 py-3 text-base font-semibold border border-red-200 dark:border-red-700/40">
                            <XCircle className="h-5 w-5" />
                            Rejete
                          </div>
                        )}
                      </div>

                      {/* Secondary: View details + proof */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <button
                          onClick={() => handleOpenDetail(topup.uid)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark px-3 py-2 text-xs font-medium text-body hover:border-primary hover:text-primary dark:text-bodydark dark:hover:border-primary dark:hover:text-white"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Details
                        </button>
                        {topup.proof_image && (
                          <button
                            onClick={() => { setProofImageUrl(topup.proof_image); setProofImageModalOpen(true) }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark px-3 py-2 text-xs font-medium text-body hover:border-secondary hover:text-secondary dark:text-bodydark dark:hover:border-secondary dark:hover:text-white"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Voir preuve
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center mt-6">
            <div className="text-sm text-body dark:text-bodydark2">
              Affichage de {startIndex + 1} a {Math.min(startIndex + itemsPerPage, totalCount)} sur {totalCount} resultats
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" /> Precedent
              </Button>
              <div className="flex items-center space-x-1">
                {(() => {
                  const pages: (number | string)[] = []
                  for (let i = 1; i <= totalPages; i++) {
                    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) pages.push(i)
                    else if (pages[pages.length - 1] !== "...") pages.push("...")
                  }
                  return pages.map((page, index) => {
                    if (page === "...") return <span key={`ellipsis-${index}`} className="px-2 text-body text-sm">...</span>
                    return (
                      <Button
                        key={`page-${page}`}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page as number)}
                        className={currentPage === page ? "bg-primary hover:bg-primary text-white border-primary" : "border-stroke dark:border-strokedark"}
                      >
                        {page}
                      </Button>
                    )
                  })
                })()}
              </div>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                Suivant <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Topup Details Modal */}
        <Dialog open={detailModalOpen} onOpenChange={(open) => { if (!open) handleCloseDetail() }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Details de la demande</span>
              </DialogTitle>
            </DialogHeader>
            {detailLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : detailError ? (
              <ErrorDisplay error={detailError} variant="inline" showRetry={false} />
            ) : detailTopup ? (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><b>UID:</b> <span className="font-mono text-xs">{detailTopup.uid}</span></div>
                  <div><b>Montant:</b> {formatAmount(detailTopup.amount)} FCFA</div>
                  <div><b>Statut:</b> {detailTopup.status_display || detailTopup.status}</div>
                  <div><b>Reference:</b> {detailTopup.reference || "-"}</div>
                  <div><b>Utilisateur:</b> {detailTopup.user_name || "-"}</div>
                  <div><b>Email:</b> {detailTopup.user_email || "-"}</div>
                  <div><b>Cree le:</b> {detailTopup.created_at ? detailTopup.created_at.split("T")[0] : "-"}</div>
                  <div><b>Expire le:</b> {detailTopup.expires_at ? detailTopup.expires_at.split("T")[0] : "-"}</div>
                  <div><b>Expire:</b> {detailTopup.is_expired ? "Oui" : "Non"}</div>
                  <div><b>Temps restant:</b> {detailTopup.time_remaining ? `${detailTopup.time_remaining}s` : "-"}</div>
                  <div><b>Verifie par:</b> {detailTopup.reviewed_by_name || "-"}</div>
                  <div><b>Verifie le:</b> {detailTopup.reviewed_at ? detailTopup.reviewed_at.split("T")[0] : "-"}</div>
                  <div><b>Traite le:</b> {detailTopup.processed_at ? detailTopup.processed_at.split("T")[0] : "-"}</div>
                </div>
                {detailTopup.proof_description && (
                  <div><b>Description preuve:</b> {detailTopup.proof_description}</div>
                )}
                {detailTopup.admin_notes && (
                  <div><b>Notes admin:</b> {detailTopup.admin_notes}</div>
                )}
                {detailTopup.rejection_reason && (
                  <div><b>Raison rejet:</b> {detailTopup.rejection_reason}</div>
                )}
                {detailTopup.proof_image && (
                  <div className="flex items-center gap-2">
                    <b>Preuve:</b>
                    <Button size="sm" variant="outline" onClick={() => { setProofImageUrl(detailTopup.proof_image); setProofImageModalOpen(true) }}>
                      <Eye className="h-3 w-3 mr-1" /> Voir image
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
            <DialogClose asChild>
              <Button className="mt-4 w-full">Fermer</Button>
            </DialogClose>
          </DialogContent>
        </Dialog>

        {/* Proof Image Modal */}
        <Dialog open={proofImageModalOpen} onOpenChange={setProofImageModalOpen}>
          <DialogContent className="flex flex-col items-center justify-center">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Image de preuve</span>
              </DialogTitle>
            </DialogHeader>
            {proofImageUrl && (
              <img src={proofImageUrl} alt="Proof" className="max-w-full max-h-[70vh] rounded border" style={{ objectFit: "contain" }} />
            )}
            <DialogClose asChild>
              <Button className="mt-4 w-full">Fermer</Button>
            </DialogClose>
          </DialogContent>
        </Dialog>

        {/* Approve/Reject Modal */}
        <Dialog open={actionModalOpen} onOpenChange={(open) => { setActionModalOpen(open); if (!open) setActionError("") }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                {actionType === "approve" ? (
                  <CheckCircle className="h-5 w-5 text-meta-3" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span>
                  {actionType === "approve" ? "Approuver la demande" : "Rejeter la demande"}
                </span>
              </DialogTitle>
            </DialogHeader>
            {actionError && (
              <div className="mb-4">
                <ErrorDisplay error={actionError} variant="inline" showRetry={false} showDismiss={true} onDismiss={() => setActionError("")} />
              </div>
            )}
            {actionType === "approve" ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="adminNotes" className="text-sm font-medium text-gray-700 dark:text-bodydark">
                    Notes administrateur
                  </Label>
                  <Input
                    id="adminNotes"
                    placeholder="Notes administrateur"
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rejectionReason" className="text-sm font-medium text-gray-700 dark:text-bodydark">
                    Raison du rejet
                  </Label>
                  <Input
                    id="rejectionReason"
                    placeholder="Raison du rejet"
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                  />
                </div>
              </div>
            )}
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setActionModalOpen(false)}>Annuler</Button>
              <Button
                onClick={async () => {
                  setPendingAction(true)
                  setActionError("")
                  try {
                    const endpoint = `payments/recharge-requests/${actionTopup.uid}/${actionType}/`
                    const payload = actionType === "approve" ? { admin_notes: adminNotes } : { rejection_reason: rejectionReason }
                    await apiFetch(endpoint, {
                      method: "POST",
                      body: JSON.stringify(payload),
                      headers: { "Content-Type": "application/json" },
                      successMessage: actionType === "approve" ? "Demande approuvee" : "Demande rejetee",
                    })
                    setDisabledTopups(prev => ({ ...prev, [actionTopup.uid]: actionType === "approve" ? "approved" : "rejected" }))
                    setActionModalOpen(false)
                    setAdminNotes("")
                    setRejectionReason("")
                    await fetchTopups()
                  } catch (err: any) {
                    const errorMessage = extractErrorMessages(err)
                    setActionError(errorMessage)
                    toast({ title: "Erreur", description: errorMessage, variant: "destructive" })
                  } finally {
                    setPendingAction(false)
                  }
                }}
                disabled={
                  pendingAction
                  || (actionType === "approve" && !adminNotes)
                  || (actionType === "reject" && !rejectionReason)
                  || !!actionTopup?.is_expired
                }
                className={actionType === "approve" ? "bg-meta-3 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
              >
                {pendingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : actionType === "approve" ? "Approuver" : "Rejeter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}
