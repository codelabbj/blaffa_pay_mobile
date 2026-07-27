"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useApi } from "@/lib/useApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Copy, Eye, DollarSign, Phone, Calendar, Clock, AlertTriangle, CheckCircle, XCircle, Loader2, MoreHorizontal, Filter, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { BulkActionBar } from "@/components/data-table/bulk-action-bar"
import { SortableHead } from "@/components/data-table/sortable-head"
import { useTableSelection } from "@/hooks/use-table-selection"
import {
  bulkPaymentTransactionFailed,
  bulkPaymentTransactionSuccess,
  bulkWaveBusinessCancel,
  formatBulkToast,
} from "@/lib/transaction-bulk-api"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { DateRangeFilter } from "@/components/ui/date-range-filter"

// Colors for consistent theming - using logo colors
const COLORS = {
  primary: '#194185', // Orange (primary from logo)
  secondary: '#10B981', // Bright green from logo
  accent: '#1E3A8A', // Dark blue from logo
  danger: '#EF4444',
  warning: '#F97316',
  success: '#10B981', // Using bright green for success
  info: '#1E3A8A', // Using dark blue for info
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1'
};

interface WaveBusinessTransaction {
  uid: string
  amount: string
  amount_as_integer: number
  recipient_phone: string
  status: "pending" | "confirmed" | "cancelled" | "expired"
  reference: string
  created_by: number
  fcm_notifications: any[]
  callback_url: string
  confirmed_at: string | null
  expires_at: string
  is_expired: boolean
  created_at: string
  updated_at: string
}

interface ApiResponse {
  count: number
  next: string | null
  previous: string | null
  results: WaveBusinessTransaction[]
}

function WaveBusinessPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all")
  const [phoneFilter, setPhoneFilter] = useState(searchParams.get("phone") || "")
  const [includeExpired, setIncludeExpired] = useState(searchParams.get("include_expired") === "true")
  const [startDate, setStartDate] = useState<string | null>(searchParams.get("start_date"))
  const [endDate, setEndDate] = useState<string | null>(searchParams.get("end_date"))
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1)
  const [transactions, setTransactions] = useState<WaveBusinessTransaction[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sortField, setSortField] = useState<"amount" | "recipient_phone" | "created_at" | "status" | "reference" | null>((searchParams.get("sort_field") as any) || "created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">((searchParams.get("sort_dir") as any) || "desc")
  const baseUrl = getApiBaseUrl()
  const { toast } = useToast()
  const apiFetch = useApi()
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailTransaction, setDetailTransaction] = useState<WaveBusinessTransaction | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState("")

  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [successReason, setSuccessReason] = useState("")
  const [selectedTransactionForSuccess, setSelectedTransactionForSuccess] = useState<WaveBusinessTransaction | null>(null)
  const [successLoading, setSuccessLoading] = useState(false)

  const [failedModalOpen, setFailedModalOpen] = useState(false)
  const [failedReason, setFailedReason] = useState("")
  const [selectedTransactionForFailed, setSelectedTransactionForFailed] = useState<WaveBusinessTransaction | null>(null)
  const [failedLoading, setFailedLoading] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)

  const selection = useTableSelection(transactions)

  // Centralized URL update function
  const updateUrl = useCallback((newParams: Record<string, string | number | boolean | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all" || (key === "page" && value === 1)) {
        params.delete(key)
      } else {
        params.set(key, value.toString())
      }
    })
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, pathname, router])

  // Custom state setters that also update the URL
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateUrl({ page })
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
    updateUrl({ search: value, page: 1 })
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
    updateUrl({ status: value, page: 1 })
  }

  const handlePhoneChange = (value: string) => {
    setPhoneFilter(value)
    setCurrentPage(1)
    updateUrl({ phone: value, page: 1 })
  }

  const handleIncludeExpiredChange = (value: boolean) => {
    setIncludeExpired(value)
    setCurrentPage(1)
    updateUrl({ include_expired: value, page: 1 })
  }

  const handleDateChange = (start: string | null, end: string | null) => {
    setStartDate(start)
    setEndDate(end)
    setCurrentPage(1)
    updateUrl({ start_date: start, end_date: end, page: 1 })
  }

  const handleSortChange = (field: "amount" | "recipient_phone" | "created_at" | "status" | "reference") => {
    const newDir = sortField === field ? (sortDirection === "desc" ? "asc" : "desc") : "desc"
    setSortField(field)
    setSortDirection(newDir)
    setCurrentPage(1)
    updateUrl({ sort_field: field, sort_dir: newDir, page: 1 })
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setPhoneFilter("")
    setIncludeExpired(false)
    setStartDate(null)
    setEndDate(null)
    setCurrentPage(1)
    updateUrl({
      search: null,
      status: null,
      phone: null,
      include_expired: null,
      start_date: null,
      end_date: null,
      page: 1,
    })
  }

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "all" ||
    phoneFilter.trim() !== "" ||
    includeExpired ||
    startDate ||
    endDate

  const itemsPerPage = 20

  // Récupérer les transactions depuis l'API
  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: itemsPerPage.toString(),
      })

      if (searchTerm.trim() !== "") {
        params.append("reference", searchTerm)
      }
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }
      if (phoneFilter.trim() !== "") {
        params.append("phone", phoneFilter)
      }
      if (includeExpired) {
        params.append("include_expired", "true")
      }
      if (startDate) {
        params.append("created_at__gte", startDate)
      }
      if (endDate) {
        params.append("created_at__lte", endDate)
      }
      if (sortField) {
        params.append("ordering", sortDirection === "desc" ? `-${sortField}` : sortField)
      }

      const endpoint = `payments/wave-business-transactions/?${params.toString()}`
      const data: ApiResponse = await apiFetch(endpoint)

      setTransactions(data.results || [])
      setTotalCount(data.count || 0)
      setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      setError(errorMessage)
      setTransactions([])
      setTotalCount(0)
      setTotalPages(1)
      toast({
        title: "Erreur de chargement",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [searchTerm, currentPage, itemsPerPage, baseUrl, statusFilter, phoneFilter, includeExpired, sortField, sortDirection, startDate, endDate, toast, apiFetch])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const startIndex = (currentPage - 1) * itemsPerPage

  const handleSort = (field: "amount" | "recipient_phone" | "created_at" | "status" | "reference") => {
    handleSortChange(field)
  }

  const runBulk = async (action: "success" | "failed" | "cancel") => {
    const uids = selection.selectedRows.map((t) => t.uid)
    if (!uids.length) return
    setBulkLoading(true)
    try {
      let result
      if (action === "success") result = await bulkPaymentTransactionSuccess(apiFetch, uids)
      else if (action === "failed") result = await bulkPaymentTransactionFailed(apiFetch, uids)
      else result = await bulkWaveBusinessCancel(apiFetch, uids)
      const labels = { success: "Succès groupé", failed: "Échec groupé", cancel: "Annulation groupée" }
      const { title, description } = formatBulkToast(labels[action], result)
      toast({ title, description, variant: result.failed ? "destructive" : "default" })
      selection.clear()
      await fetchTransactions()
    } catch (err: any) {
      toast({ title: "Erreur", description: extractErrorMessages(err), variant: "destructive" })
    } finally {
      setBulkLoading(false)
    }
  }

  const getStatusBadge = (status: string, isExpired: boolean) => {
    if (isExpired) {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Expiré
        </Badge>
      )
    }

    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        )
      case "confirmed":
        return (
          <Badge className="bg-green-100 text-meta-3 dark:bg-green-900/20 dark:text-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmé
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-boxdark-2/20 dark:text-bodydark">
            <XCircle className="h-3 w-3 mr-1" />
            Annulé
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-boxdark-2/20 dark:text-bodydark">
            {status}
          </Badge>
        )
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const formatAmount = (amount: string) => {
    return `${parseFloat(amount).toLocaleString("fr-FR")} FCFA`
  }

  // Ouvrir les détails d'une transaction
  const handleOpenDetail = (transaction: WaveBusinessTransaction) => {
    setDetailModalOpen(true)
    setDetailTransaction(transaction)
    setDetailError("")
    toast({
      title: "Détail chargé",
      description: "Détails de la transaction affichés avec succès"
    })
  }

  const handleCloseDetail = () => {
    setDetailModalOpen(false)
    setDetailTransaction(null)
    setDetailError("")
  }

  // Marquer la transaction comme réussie
  const handleMarkAsSuccess = async () => {
    if (!selectedTransactionForSuccess) return
    setSuccessLoading(true)
    try {
      const endpoint = `payments/transactions/${selectedTransactionForSuccess.uid}/success/`
      await apiFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: successReason || "other reasons" })
      })

      toast({
        title: "Succès",
        description: "Transaction marquée comme réussie"
      })

      setSuccessModalOpen(false)
      setSuccessReason("")
      setSelectedTransactionForSuccess(null)
      
      // Refresh list
      await fetchTransactions()
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setSuccessLoading(false)
    }
  }

  // Marquer la transaction comme échouée
  const handleMarkAsFailed = async () => {
    if (!selectedTransactionForFailed) return
    setFailedLoading(true)
    try {
      const endpoint = `payments/transactions/${selectedTransactionForFailed.uid}/mark-failed/`
      await apiFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: failedReason || "other reasons" })
      })

      toast({
        title: "Succès",
        description: "Transaction marquée comme échouée"
      })

      setFailedModalOpen(false)
      setFailedReason("")
      setSelectedTransactionForFailed(null)
      
      await fetchTransactions()
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setFailedLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: `${label} copié !` })
  }

  return (
    <div className="min-h-screen bg-whiten dark:bg-boxdark-2">
      <div className="w-full">

        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
            <div>
              <h1 className="text-base font-bold sm:text-lg sm:text-2xl bg-gradient-to-r from-primary to-meta-3 bg-clip-text text-transparent">
                <span>Transactions Wave Business</span>
              </h1>
              <p className="text-body dark:text-bodydark mt-2 text-lg">
                <span>Gérer et surveiller les transactions Wave Business</span>
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="bg-white dark:bg-boxdark rounded-lg px-4 py-2 shadow-sm">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-meta-3" />
                  <span className="text-sm font-medium text-gray-700 dark:text-bodydark">
                    <span>{totalCount} transactions</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-bodydark2" />
                <Input
                  placeholder="Rechercher par référence..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                />
              </div>

              {/* Phone Filter */}
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-bodydark2" />
                <Input
                  placeholder="Filtrer par téléphone..."
                  value={phoneFilter}
                  onChange={(e) => setPhoneFilter(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="confirmed">Confirmé</SelectItem>
                  <SelectItem value="expired">Expiré</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>

              {/* Include Expired Switch */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 bg-gray-50 dark:bg-meta-4 rounded-lg border border-stroke dark:border-strokedark">
                <Switch
                  id="include-expired"
                  checked={includeExpired}
                  onCheckedChange={setIncludeExpired}
                />
                <label htmlFor="include-expired" className="text-sm font-medium text-gray-700 dark:text-bodydark">
                  Inclure les expirés
                </label>
              </div>

              {/* Date Range Filter */}
              <DateRangeFilter
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onClear={() => {
                  setStartDate(null)
                  setEndDate(null)
                }}
                placeholder="Filtrer par date"
                className="col-span-1"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-strokedark">
              <Filter className="h-4 w-4 text-body" />
              <Select
                value={`${sortField || "created_at"}:${sortDirection}`}
                onValueChange={(v) => {
                  const [field, dir] = v.split(":") as [typeof sortField & string, "asc" | "desc"]
                  setSortField(field as any)
                  setSortDirection(dir)
                  setCurrentPage(1)
                  updateUrl({ sort_field: field, sort_dir: dir, page: 1 })
                }}
              >
                <SelectTrigger className="w-[200px] h-9 bg-gray-50 dark:bg-meta-4">
                  <SelectValue placeholder="Tri" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at:desc">Date ↓</SelectItem>
                  <SelectItem value="created_at:asc">Date ↑</SelectItem>
                  <SelectItem value="amount:desc">Montant ↓</SelectItem>
                  <SelectItem value="amount:asc">Montant ↑</SelectItem>
                  <SelectItem value="recipient_phone:asc">Téléphone ↑</SelectItem>
                  <SelectItem value="status:asc">Statut ↑</SelectItem>
                  <SelectItem value="reference:asc">Référence ↑</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" /> Effacer filtres
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <BulkActionBar count={selection.count} onClear={selection.clear} loading={bulkLoading}>
          <Button size="sm" variant="outline" disabled={bulkLoading} onClick={() => runBulk("success")}>
            <CheckCircle className="h-4 w-4 mr-1" /> Marquer succès
          </Button>
          <Button size="sm" variant="outline" disabled={bulkLoading} onClick={() => runBulk("failed")}>
            <XCircle className="h-4 w-4 mr-1" /> Marquer échec
          </Button>
          <Button size="sm" variant="outline" disabled={bulkLoading} onClick={() => runBulk("cancel")}>
            Annuler
          </Button>
        </BulkActionBar>

        {/* Transactions Table */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <CardHeader className="border-b border-gray-100 dark:border-strokedark">
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-meta-2 dark:bg-orange-900 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary dark:text-secondary" />
              </div>
              <span>Liste des Transactions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-6 sm:py-10">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-body dark:text-bodydark"><span>Chargement des transactions...</span></span>
                </div>
              </div>
            ) : error ? (
              <div className="p-3 sm:p-4 md:p-6 text-center">
                <ErrorDisplay
                  error={error}
                  onRetry={() => {
                    setCurrentPage(1)
                    setError("")
                  }}
                  variant="full"
                  showDismiss={false}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-boxdark-2/50">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selection.allSelected ? true : selection.someSelected ? "indeterminate" : false}
                          onCheckedChange={(v) => selection.toggleAll(v === true)}
                          aria-label="Tout sélectionner"
                        />
                      </TableHead>
                      <SortableHead label="Référence" field="reference" activeField={sortField} direction={sortDirection} onSort={handleSort} />
                      <SortableHead label="Montant" field="amount" activeField={sortField} direction={sortDirection} onSort={handleSort} />
                      <SortableHead label="Téléphone destinataire" field="recipient_phone" activeField={sortField} direction={sortDirection} onSort={handleSort} />
                      <SortableHead label="Statut" field="status" activeField={sortField} direction={sortDirection} onSort={handleSort} />
                      <SortableHead label="Date de création" field="created_at" activeField={sortField} direction={sortDirection} onSort={handleSort} />
                      <TableHead className="font-semibold">Date d'expiration</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.uid} className={`transition-colors hover:brightness-95 ${
                        ["completed","success","confirmed"].includes(transaction.status) ? "bg-meta-3/5 dark:bg-meta-3/10 border-l-4 border-l-meta-3" :
                        ["pending"].includes(transaction.status) ? "bg-warning/5 dark:bg-warning/10 border-l-4 border-l-warning" :
                        ["processing","sent_to_user"].includes(transaction.status) ? "bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary" :
                        ["failed","cancelled","timeout"].includes(transaction.status) ? "bg-danger/5 dark:bg-danger/10 border-l-4 border-l-danger" :
                        ["expired"].includes(transaction.status) ? "bg-gray dark:bg-meta-4/30 border-l-4 border-l-bodydark2" : ""
                      }`}>
                        <TableCell>
                          <Checkbox
                            checked={selection.selected.has(transaction.uid)}
                            onCheckedChange={(v) => selection.toggleRow(transaction.uid, v === true)}
                            aria-label={`Sélectionner ${transaction.reference}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm" data-label="Référence">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary to-meta-3 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                              {transaction.reference.charAt(0).toUpperCase()}
                            </div>
                            <span>{transaction.reference}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium" data-label="Montant">
                          <div className="flex items-center space-x-2">
                            {/* <DollarSign className="h-4 w-4 text-meta-3" /> */}
                            <span>{formatAmount(transaction.amount)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-blue-600" />
                            <span>{transaction.recipient_phone}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status, transaction.is_expired)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-bodydark2" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-700 dark:text-bodydark">
                                {new Date(transaction.created_at).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-body dark:text-bodydark2">
                                {new Date(transaction.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>{formatDate(transaction.expires_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right" data-label="Actions">
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              onClick={() => handleOpenDetail(transaction)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-stroke bg-white px-2.5 py-1.5 text-xs font-medium text-body shadow-sm hover:border-primary hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-bodydark"
                            >
                              <Eye className="h-3.5 w-3.5 flex-shrink-0" />
                              Détails
                            </button>
                            {["pending", "expired"].includes(transaction.status) && (
                              <button
                                onClick={() => { setSelectedTransactionForSuccess(transaction); setSuccessModalOpen(true); }}
                                className="inline-flex items-center gap-1.5 rounded-md bg-meta-3 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-opacity-90"
                              >
                                <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                                Succès
                              </button>
                            )}
                            {["pending", "confirmed", "accept", "successfull"].includes(transaction.status) && (
                              <button
                                onClick={() => { setSelectedTransactionForFailed(transaction); setFailedModalOpen(true); }}
                                className="inline-flex items-center gap-1.5 rounded-md bg-danger px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-opacity-90"
                              >
                                <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
                                Échoué
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center mt-6">
            <div className="text-sm text-body dark:text-bodydark2">
              Résultats affichés : {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalCount)} sur {totalCount}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="border-stroke dark:border-strokedark"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Précédent</span>
              </Button>
              <div className="flex items-center space-x-1">
                {(() => {
                  const pages = [];
                  for (let i = 1; i <= totalPages; i++) {
                    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
                      pages.push(i);
                    } else if (pages[pages.length - 1] !== '...') {
                      pages.push('...');
                    }
                  }
                  
                  return pages.map((page, index) => {
                    if (page === '...') {
                      return <span key={`ellipsis-${index}`} className="px-2 text-body text-sm">...</span>;
                    }
                    return (
                      <Button
                        key={`page-${page}`}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page as number)}
                        className={currentPage === page ? "bg-primary hover:bg-primary text-white border-primary" : "border-stroke dark:border-strokedark"}
                      >
                        {page}
                      </Button>
                    );
                  });
                })()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="border-stroke dark:border-strokedark"
              >
                <span>Suivant</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Modal des détails de la transaction */}
        <Dialog open={detailModalOpen} onOpenChange={(open) => { if (!open) handleCloseDetail() }}>
          <DialogContent className="bg-white dark:bg-boxdark border-0 shadow-xl max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <div className="p-2 bg-meta-2 dark:bg-orange-900 rounded-lg">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <span>Détails de la transaction</span>
              </DialogTitle>
            </DialogHeader>
            {detailLoading ? (
              <div className="flex items-center justify-center py-6 sm:py-10">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-body dark:text-bodydark"><span>Chargement des détails...</span></span>
                </div>
              </div>
            ) : detailError ? (
              <ErrorDisplay
                error={detailError}
                variant="inline"
                showRetry={false}
                className="mb-4"
              />
            ) : detailTransaction ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 bg-gray-50 dark:bg-boxdark-2/50 rounded-lg">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-body dark:text-bodydark2">UID</div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-medium">{detailTransaction.uid}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(detailTransaction.uid, "UID")}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 bg-gray-50 dark:bg-boxdark-2/50 rounded-lg">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <DollarSign className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm text-body dark:text-bodydark2">Référence</div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-medium">{detailTransaction.reference}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(detailTransaction.reference, "Référence")}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 bg-gray-50 dark:bg-boxdark-2/50 rounded-lg">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <DollarSign className="h-4 w-4 text-meta-3" />
                    </div>
                    <div>
                      <div className="text-sm text-body dark:text-bodydark2">Montant</div>
                      <div className="font-medium">{formatAmount(detailTransaction.amount)}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 bg-gray-50 dark:bg-boxdark-2/50 rounded-lg">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                      <Phone className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <div className="text-sm text-body dark:text-bodydark2">Téléphone</div>
                      <div className="font-medium">{detailTransaction.recipient_phone}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 bg-gray-50 dark:bg-boxdark-2/50 rounded-lg">
                    <div className="p-2 bg-meta-2 dark:bg-orange-900 rounded-lg">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-body dark:text-bodydark2">Créé le</div>
                      <div className="font-medium">{formatDate(detailTransaction.created_at)}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 bg-gray-50 dark:bg-boxdark-2/50 rounded-lg">
                    <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                      <Clock className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <div className="text-sm text-body dark:text-bodydark2">Expire le</div>
                      <div className="font-medium">{formatDate(detailTransaction.expires_at)}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center p-3 bg-gray-50 dark:bg-boxdark-2/50 rounded-lg">
                    <span className="text-sm font-medium">Statut</span>
                    {getStatusBadge(detailTransaction.status, detailTransaction.is_expired)}
                  </div>

                  <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center p-3 bg-gray-50 dark:bg-boxdark-2/50 rounded-lg">
                    <span className="text-sm font-medium">Créé par</span>
                    <span className="text-sm">{detailTransaction.created_by}</span>
                  </div>

                  <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center p-3 bg-gray-50 dark:bg-boxdark-2/50 rounded-lg">
                    <span className="text-sm font-medium">Notifications FCM</span>
                    <span className="text-sm">{detailTransaction.fcm_notifications.length} notification(s)</span>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-boxdark-2/50 rounded-lg">
                    <div className="text-sm font-medium mb-2">URL de callback</div>
                    <div className="text-sm break-all text-body dark:text-bodydark2">{detailTransaction.callback_url}</div>
                  </div>
                </div>
              </div>
            ) : null}
            <DialogClose asChild>
              <Button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white">
                <span>Fermer</span>
              </Button>
            </DialogClose>
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
          <DialogContent className="bg-white dark:bg-boxdark border-0 shadow-xl max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-meta-3" />
                </div>
                <span>Marquer comme succès</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-body dark:text-bodydark2">
                Voulez-vous vraiment marquer cette transaction comme réussie ? Cette action est irréversible.
              </p>
              <div className="space-y-2">
                <label htmlFor="success-reason" className="text-sm font-medium">Raison (optionnel)</label>
                <Input
                  id="success-reason"
                  placeholder="Ex: Confirmation manuelle reçue"
                  value={successReason}
                  onChange={(e) => setSuccessReason(e.target.value)}
                  className="bg-gray-50 dark:bg-meta-4"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSuccessModalOpen(false)}
                disabled={successLoading}
              >
                Annuler
              </Button>
              <Button
                onClick={handleMarkAsSuccess}
                disabled={successLoading}
                className="bg-meta-3 hover:bg-green-700 text-white"
              >
                {successLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  "Confirmer"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Failed Modal */}
        <Dialog open={failedModalOpen} onOpenChange={setFailedModalOpen}>
          <DialogContent className="bg-white dark:bg-boxdark border-0 shadow-xl max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <span>Marquer comme échoué</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-body dark:text-bodydark2">
                Voulez-vous vraiment marquer cette transaction comme échouée ? Cette action est irréversible.
              </p>
              <div className="space-y-2">
                <label htmlFor="failed-reason" className="text-sm font-medium">Raison (optionnel)</label>
                <Input
                  id="failed-reason"
                  placeholder="Ex: Paiement non reçu après vérification"
                  value={failedReason}
                  onChange={(e) => setFailedReason(e.target.value)}
                  className="bg-gray-50 dark:bg-meta-4"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setFailedModalOpen(false)}
                disabled={failedLoading}
              >
                Annuler
              </Button>
              <Button
                onClick={handleMarkAsFailed}
                disabled={failedLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {failedLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  "Confirmer"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

import { Suspense } from 'react'
import { getApiBaseUrl } from "@/lib/env-config"

export default function WaveBusinessPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <WaveBusinessPageContent />
    </Suspense>
  )
}
