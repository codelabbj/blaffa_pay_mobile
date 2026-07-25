"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useApi } from "@/lib/useApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Copy, Users, Filter, CheckCircle, XCircle, Mail, Calendar, UserCheck, DollarSign, TrendingUp, Clock, ArrowUpDown as ArrowUpDownIcon, Plus, Eye, Edit, Trash2, ToggleLeft, ToggleRight, BarChart3, Shield, User, AlertTriangle, RefreshCw, MoreHorizontal } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { DateRangeFilter } from "@/components/ui/date-range-filter"
import Link from "next/link"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getApiBaseUrl } from "@/lib/env-config"

interface BettingTransaction {
  uid: string;
  reference: string;
  partner_name: string;
  platform_name: string;
  transaction_type: "deposit" | "withdrawal";
  amount: string;
  status: string;
  betting_user_id?: string;
  commission_amount: string;
  commission_paid: boolean;
  created_at: string;
}

function BettingTransactionsPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all")
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "all")
  const [platformFilter, setPlatformFilter] = useState(searchParams.get("platform") || "all")
  const [commissionFilter, setCommissionFilter] = useState(searchParams.get("commission") || "all")
  const [networkFilter, setNetworkFilter] = useState(searchParams.get("network") || "all")
  const [networks, setNetworks] = useState<any[]>([])
  const [startDate, setStartDate] = useState<string | null>(searchParams.get("start_date"))
  const [endDate, setEndDate] = useState<string | null>(searchParams.get("end_date"))
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1)
  const [sortField, setSortField] = useState<"created_at" | "amount" | "status" | null>((searchParams.get("sort_field") as any) || null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">((searchParams.get("sort_dir") as any) || "desc")
  const { t } = useLanguage()
  const itemsPerPage = 20
  const baseUrl = getApiBaseUrl()
  const { toast } = useToast()
  const apiFetch = useApi();
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailTransaction, setDetailTransaction] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState("")
  const [cancellationLoading, setCancellationLoading] = useState(false)
  const [cancellationError, setCancellationError] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [transactions, setTransactions] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState<any | null>(null)

  // Centralized URL update function
  const updateUrl = useCallback((newParams: Record<string, string | number | null>) => {
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

  const handleTypeChange = (value: string) => {
    setTypeFilter(value)
    setCurrentPage(1)
    updateUrl({ type: value, page: 1 })
  }

  const handlePlatformChange = (value: string) => {
    setPlatformFilter(value)
    setCurrentPage(1)
    updateUrl({ platform: value, page: 1 })
  }

  const handleCommissionChange = (value: string) => {
    setCommissionFilter(value)
    setCurrentPage(1)
    updateUrl({ commission: value, page: 1 })
  }

  const handleNetworkChange = (value: string) => {
    setNetworkFilter(value)
    setCurrentPage(1)
    updateUrl({ network: value, page: 1 })
  }

  const handleDateChange = (start: string | null, end: string | null) => {
    setStartDate(start)
    setEndDate(end)
    setCurrentPage(1)
    updateUrl({ start_date: start, end_date: end, page: 1 })
  }

  const handleSortChange = (field: "created_at" | "amount" | "status") => {
    const newDir = sortField === field ? (sortDirection === "desc" ? "asc" : "desc") : "desc"
    setSortField(field)
    setSortDirection(newDir)
    setCurrentPage(1)
    updateUrl({ sort_field: field, sort_dir: newDir, page: 1 })
  }

  // Success modal state
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [successReason, setSuccessReason] = useState("")
  const [successLoading, setSuccessLoading] = useState(false)
  const [successError, setSuccessError] = useState("")
  const [successTransaction, setSuccessTransaction] = useState<any | null>(null)

  // Refund modal state
  const [refundModalOpen, setRefundModalOpen] = useState(false)
  const [refundReason, setRefundReason] = useState("")
  const [refundError, setRefundError] = useState("")
  const [refundTransaction, setRefundTransaction] = useState<any | null>(null)

  // Failed modal state
  const [failedModalOpen, setFailedModalOpen] = useState(false)
  const [failedReason, setFailedReason] = useState("Tentative de relance après timeout")
  const [failedLoading, setFailedLoading] = useState(false)
  const [failedError, setFailedError] = useState("")
  const [failedTransaction, setFailedTransaction] = useState<any | null>(null)

  // Process Cancellation Request state
  const [processCancellationModalOpen, setProcessCancellationModalOpen] = useState(false)
  const [processCancellationTransaction, setProcessCancellationTransaction] = useState<any | null>(null)
  const [processCancellationNotes, setProcessCancellationNotes] = useState("")
  const [processCancellationLoading, setProcessCancellationLoading] = useState(false)
  const [processCancellationError, setProcessCancellationError] = useState("")

  // Fetch transactions from API
  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: itemsPerPage.toString(),
      })
      if (searchTerm.trim() !== "") {
        params.append("search", searchTerm)
      }
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }
      if (typeFilter !== "all") {
        params.append("transaction_type", typeFilter)
      }
      if (platformFilter !== "all") {
        params.append("platform", platformFilter)
      }
      if (commissionFilter !== "all") {
        params.append("commission_paid", commissionFilter === "paid" ? "true" : "false")
      }
      if (networkFilter !== "all") {
        params.append("network", networkFilter)
      }
      if (startDate) {
        params.append("created_at__gte", startDate)
      }
      if (endDate) {
        params.append("created_at__lt", endDate)
      }
      const orderingParam = sortField
        ? `&ordering=${(sortDirection === "asc" ? "+" : "-")}${sortField}`
        : "&ordering=-created_at"
      const endpoint = `payments/betting/admin/transactions/?${params.toString()}${orderingParam}`
      const data = await apiFetch(endpoint)
      setTransactions(data.results || [])
      setTotalCount(data.count || 0)
      setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      setError(errorMessage)
      setTransactions([])
      setTotalCount(0)
      setTotalPages(1)
      toast({ title: "Erreur", description: errorMessage, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [searchTerm, currentPage, itemsPerPage, baseUrl, statusFilter, typeFilter, platformFilter, commissionFilter, networkFilter, sortField, sortDirection, startDate, endDate, t, toast, apiFetch])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Fetch networks
  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const data = await apiFetch(`payments/networks/`)
        setNetworks(data.results || [])
      } catch (err) {
        console.error("Failed to load networks", err)
      }
    }
    fetchNetworks()
  }, [baseUrl, apiFetch])

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const params = new URLSearchParams()
        if (startDate) params.append("date_from", startDate)
        if (endDate) params.append("date_to", endDate)
        const endpoint = `payments/betting/admin/transactions/stats/?${params.toString()}`
        const data = await apiFetch(endpoint)
        setStats(data)
      } catch (err: any) {
        console.error("Failed to fetch stats:", err)
      }
    }
    fetchStats()
  }, [baseUrl, startDate, endDate, apiFetch])

  const startIndex = (currentPage - 1) * itemsPerPage

  const handleSort = (field: "created_at" | "amount" | "status") => {
    handleSortChange(field)
  }

  // Fetch transaction details
  const handleOpenDetail = async (transaction: BettingTransaction) => {
    setDetailModalOpen(true)
    setDetailLoading(true)
    setDetailError("")
    setDetailTransaction(null)
    try {
      const endpoint = `payments/betting/admin/transactions/${transaction.uid}/`
      const data = await apiFetch(endpoint)
      setDetailTransaction(data)
    } catch (err: any) {
      setDetailError(extractErrorMessages(err))
      toast({ title: "Erreur", description: extractErrorMessages(err), variant: "destructive" })
    } finally {
      setDetailLoading(false)
    }
  }

  // Process cancellation
  const handleProcessCancellation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!detailTransaction && !refundTransaction) return

    const targetTransaction = detailTransaction || refundTransaction
    if (!targetTransaction) return

    setCancellationLoading(true)
    setCancellationError("")
    try {
      const payload = {
        reason: (refundReason || "Autre raison").trim(),
        admin_notes: (refundReason || "Aucune note fournie").trim(),
      }

      const endpoint = `payments/betting/admin/transactions/${targetTransaction.uid}/refund-partner/`
      const data = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        successMessage: "Remboursement effectué avec succès"
      })

      setRefundModalOpen(false)
      setRefundReason("")

      // Refresh data
      router.refresh()
      await fetchTransactions()
    } catch (err: any) {
      const errMsg = extractErrorMessages(err)
      setCancellationError(errMsg)
      setRefundError(errMsg)
      toast({ title: "Erreur", description: errMsg, variant: "destructive" })
    } finally {
      setCancellationLoading(false)
    }
  }

  // Open success modal
  const openSuccessModal = (tx: BettingTransaction) => {
    setSuccessTransaction(tx)
    setSuccessReason("")
    setSuccessError("")
    setSuccessModalOpen(true)
  }

  // Handle success submit
  const handleSuccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!successTransaction) return

    setSuccessLoading(true)
    setSuccessError("")
    try {
      const endpoint = `payments/betting/admin/transactions/${successTransaction.uid}/mark-as-success/`
      await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: (successReason.trim() || "Aucune raison fournie") }),
        successMessage: "Transaction marquée comme succès"
      })
      setSuccessModalOpen(false)
      setSuccessTransaction(null)
      setSuccessReason("")
      router.refresh()
      await fetchTransactions()
    } catch (err: any) {
      const errMsg = extractErrorMessages(err)
      setSuccessError(errMsg)
      toast({ title: "Erreur", description: errMsg, variant: "destructive" })
    } finally {
      setSuccessLoading(false)
    }
  }

  // Open refund modal
  const openRefundModal = (tx: BettingTransaction) => {
    setRefundTransaction(tx)
    setRefundReason("")
    setRefundError("")
    setRefundModalOpen(true)
  }

  // Open failed modal
  const openFailedModal = (tx: BettingTransaction) => {
    setFailedTransaction(tx)
    setFailedReason("Tentative de relance après timeout")
    setFailedError("")
    setFailedModalOpen(true)
  }

  // Handle failed submit
  const handleFailedSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!failedTransaction) return

    setFailedLoading(true)
    setFailedError("")
    try {
      const endpoint = `payments/betting/admin/transactions/${failedTransaction.uid}/mark-as-failed/`
      await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: (failedReason.trim() || "Aucune raison fournie") }),
        successMessage: "Transaction marquée comme échec"
      })
      setFailedModalOpen(false)
      setFailedTransaction(null)
      setFailedReason("Tentative de relance après timeout")
      router.refresh()
      await fetchTransactions()
    } catch (err: any) {
      const errMsg = extractErrorMessages(err)
      setFailedError(errMsg)
      toast({ title: "Erreur", description: errMsg, variant: "destructive" })
    } finally {
      setFailedLoading(false)
    }
  }

  // Handle Process Cancellation Request (Approve/Reject)
  const handleProcessCancellationRequest = async (approve: boolean) => {
    const targetTransaction = processCancellationTransaction || detailTransaction
    if (!targetTransaction) return

    setProcessCancellationLoading(true)
    setProcessCancellationError("")
    try {
      const endpoint = `payments/betting/admin/transactions/${targetTransaction.uid}/process_cancellation/`
      const payload = {
        success: approve,
        admin_notes: processCancellationNotes || (approve ? "Cancellation approved" : "Cancellation rejected")
      }

      await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        successMessage: approve ? "Demande d'annulation approuvée" : "Demande d'annulation rejetée"
      })

      setProcessCancellationModalOpen(false)
      setProcessCancellationTransaction(null)
      setProcessCancellationNotes("")
      setDetailModalOpen(false)
      
      // Refresh data
      router.refresh()
      await fetchTransactions()
    } catch (err: any) {
      const errMsg = extractErrorMessages(err)
      setProcessCancellationError(errMsg)
      toast({ title: "Erreur", description: errMsg, variant: "destructive" })
    } finally {
      setProcessCancellationLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { color: string; icon: any; text: string } } = {
      success: { color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300", icon: CheckCircle, text: "Succès" },
      failed: { color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300", icon: XCircle, text: "Échec" },
      pending: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300", icon: Clock, text: "En attente" },
      cancellation_requested: { color: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300", icon: AlertTriangle, text: "Annulation demandée" },
      cancelled: { color: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300", icon: XCircle, text: "Annulé" },
    }

    const statusInfo = statusMap[status] || { color: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300", icon: Clock, text: status }
    const Icon = statusInfo.icon

    return (
      <Badge className={statusInfo.color}>
        <div className="flex items-center space-x-1">
          <Icon className="h-3 w-3" />
          <span>{statusInfo.text}</span>
        </div>
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    if (type === "deposit") {
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-3 w-3" />
            <span>Dépôt</span>
          </div>
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
          <div className="flex items-center space-x-1">
            <ArrowUpDownIcon className="h-3 w-3" />
            <span>Retrait</span>
          </div>
        </Badge>
      )
    }
  }

  // Calculate summary stats
  const successfulTransactions = transactions.filter(t => t.status === "success").length
  const totalVolume = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0)
  const totalCommissions = transactions.reduce((sum, t) => sum + parseFloat(t.commission_amount), 0)

  return (
    <div className="min-h-screen bg-whiten dark:bg-boxdark-2">
      <div className="w-full">

        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
            <div>
              <h1 className="text-base font-bold sm:text-lg sm:text-2xl bg-gradient-to-r from-primary to-meta-3 bg-clip-text text-transparent">
                Transactions de Paris
              </h1>
              <p className="text-body dark:text-bodydark mt-2 text-lg">
                Gérer les transactions des plateformes de paris
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="bg-white dark:bg-boxdark rounded-lg px-4 py-2 shadow-sm">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-gray-700 dark:text-bodydark">
                    {totalCount} transactions
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-body dark:text-bodydark2">Total Transactions</p>
                  <p className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
                    {stats?.total_transactions || totalCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-meta-3 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-body dark:text-bodydark2">Transactions réussies</p>
                  <p className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
                    {stats?.successful_transactions || successfulTransactions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-3 bg-meta-2 dark:bg-orange-900 rounded-lg">
                  <DollarSign className="h-6 w-6 text-primary dark:text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-body dark:text-bodydark2">Volume total</p>
                  <p className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
                    {(stats?.total_volume || totalVolume).toFixed(2)} FCFA
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-body dark:text-bodydark2">Commissions totales</p>
                  <p className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
                    {(stats?.total_commissions || totalCommissions).toFixed(2)} FCFA
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-bodydark2" />
                <Input
                  placeholder="Rechercher des transactions..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="success">Succès</SelectItem>
                  <SelectItem value="failed">Échec</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="processing">En cours</SelectItem>
                  <SelectItem value="cancellation_requested">Annulation demandée</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={handleTypeChange}>
                <SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
                  <SelectValue placeholder="Filtrer par type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="deposit">Dépôt</SelectItem>
                  <SelectItem value="withdrawal">Retrait</SelectItem>
                </SelectContent>
              </Select>

              {/* Commission Filter */}
              <Select value={commissionFilter} onValueChange={handleCommissionChange}>
                <SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
                  <SelectValue placeholder="Filtrer par commission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les commissions</SelectItem>
                  <SelectItem value="paid">Commission payée</SelectItem>
                  <SelectItem value="unpaid">Commission impayée</SelectItem>
                </SelectContent>
              </Select>

              {/* Network Filter */}
              <Select value={networkFilter} onValueChange={handleNetworkChange}>
                <SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
                  <SelectValue placeholder="Réseau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les réseaux</SelectItem>
                  {networks.map((n) => (
                    <SelectItem key={n.uid} value={n.uid}>
                      {n.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <DateRangeFilter
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={(start) => handleDateChange(start, endDate)}
                onEndDateChange={(end) => handleDateChange(startDate, end)}
                onClear={() => handleDateChange(null, null)}
                placeholder="Filtrer par date"
                className="col-span-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <CardHeader className="border-b border-gray-100 dark:border-strokedark">
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-meta-2 dark:bg-orange-900 rounded-lg">
                <BarChart3 className="h-5 w-5 text-primary dark:text-secondary" />
              </div>
              <span>Liste des transactions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-6 sm:py-10">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-body dark:text-bodydark">Chargement des transactions...</span>
                </div>
              </div>
            ) : error ? (
              <div className="p-3 sm:p-4 md:p-6 text-center">
                <ErrorDisplay error={error} onRetry={() => {/* retry function */ }} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-boxdark-2/50">
                      <TableHead className="font-semibold">Référence</TableHead>
                      <TableHead className="font-semibold">Partenaire</TableHead>
                      <TableHead className="font-semibold">Plateforme</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Montant</TableHead>
                      <TableHead className="font-semibold">Statut</TableHead>
                      <TableHead className="font-semibold">Betting User ID</TableHead>
                      {/* <TableHead className="font-semibold">Commission</TableHead> */}
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.uid} className="hover:bg-gray-50 dark:hover:bg-boxdark-2/50">
                        <TableCell data-label="Référence">
                          <div className="flex items-center space-x-2">
                            <Copy className="h-4 w-4 text-bodydark2" />
                            <span className="text-sm font-mono text-gray-700 dark:text-bodydark">
                              {transaction.reference}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell data-label="Partenaire">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                              {transaction.partner_name?.charAt(0)?.toUpperCase() || 'P'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                {transaction.partner_name}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-label="Plateforme">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary to-meta-3 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                              {transaction.platform_name?.charAt(0)?.toUpperCase() || 'P'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                {transaction.platform_name}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-label="Type">
                          {getTypeBadge(transaction.transaction_type)}
                        </TableCell>
                        <TableCell data-label="Montant">
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4 text-bodydark2" />
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {parseFloat(transaction.amount).toFixed(2)} FCFA
                            </span>
                          </div>
                        </TableCell>
                        <TableCell data-label="Statut">
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell data-label="Betting User ID">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-bodydark2" />
                            <span className="text-sm font-mono text-gray-700 dark:text-bodydark">
                              {transaction.betting_user_id || 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        {/* <TableCell data-label="Commission">
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="h-4 w-4 text-bodydark2" />
                            <span className="text-sm text-body dark:text-bodydark2">
                              {parseFloat(transaction.commission_amount).toFixed(2)} FCFA
                            </span>
                            <Badge className={transaction.commission_paid ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"}>
                              {transaction.commission_paid ? "Payée" : "Impayée"}
                            </Badge>
                          </div>
                        </TableCell> */}
                        <TableCell data-label="Date">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-bodydark2" />
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-700 dark:text-bodydark font-medium">
                                {transaction.created_at
                                  ? new Date(transaction.created_at).toLocaleDateString()
                                  : 'Inconnu'
                                }
                              </span>
                              {transaction.created_at && (
                                <span className="text-xs text-body dark:text-bodydark2">
                                  {new Date(transaction.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-label="Actions">
                          <div className="flex items-center space-x-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                  <span className="sr-only">Ouvrir le menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/betting-transactions/${transaction.uid}`} className="flex items-center">
                                    <Eye className="h-4 w-4 mr-2 text-blue-600" />
                                    <span>Détails</span>
                                  </Link>
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => openSuccessModal(transaction)}>
                                  <CheckCircle className="h-4 w-4 mr-2 text-meta-3" />
                                  <span>Marquer comme Succès</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => openFailedModal(transaction)}>
                                  <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                  <span>Marquer comme Échec</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => openRefundModal(transaction)}>
                                  <RefreshCw className="h-4 w-4 mr-2 text-primary" />
                                  <span>Rembourser</span>
                                </DropdownMenuItem>

                                {transaction.status === "cancellation_requested" && (
                                  <DropdownMenuItem onClick={() => {
                                    setProcessCancellationTransaction(transaction);
                                    setProcessCancellationNotes("");
                                    setProcessCancellationModalOpen(true);
                                  }}>
                                    <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                                    <span>Traiter l'annulation</span>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
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
              Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, totalCount)} sur {totalCount} résultats
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
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
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && transactions.length === 0 && (
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mt-6">
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-12 w-12 text-bodydark2 mx-auto mb-4" />
              <h3 className="text-sm font-medium sm:text-base text-gray-900 dark:text-gray-100 mb-2">
                Aucune transaction trouvée
              </h3>
              <p className="text-body dark:text-bodydark2 mb-4">
                {searchTerm ? `Aucune transaction ne correspond à "${searchTerm}"` : "Aucune transaction de paris n'a encore été effectuée."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Detail Modal */}
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>Détails de la transaction</span>
              </DialogTitle>
            </DialogHeader>
            {detailLoading ? (
              <div className="flex items-center justify-center py-4 sm:py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : detailError ? (
              <ErrorDisplay error={detailError} />
            ) : detailTransaction ? (
              <div className="space-y-6">
                {/* Transaction Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:p-4 md:p-6">
                  <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-3 flex items-center">
                        <User className="h-5 w-5 mr-2" />
                        Partenaire
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-body dark:text-bodydark2">Nom:</span>
                          <p className="text-lg font-semibold text-blue-600">
                            {detailTransaction.partner_name}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-body dark:text-bodydark2">ID:</span>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {detailTransaction.partner}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray dark:bg-orange-900/20 border-stroke dark:border-orange-700">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-orange-800 dark:text-secondary mb-3 flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2" />
                        Plateforme
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-body dark:text-bodydark2">Nom:</span>
                          <p className="text-lg font-semibold text-primary">
                            {detailTransaction.platform_name}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-body dark:text-bodydark2">ID:</span>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {detailTransaction.platform}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-green-800 dark:text-green-300 mb-3 flex items-center">
                        <DollarSign className="h-5 w-5 mr-2" />
                        Transaction
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-body dark:text-bodydark2">Montant:</span>
                          <p className="text-lg font-semibold text-meta-3">
                            {parseFloat(detailTransaction.amount).toFixed(2)} FCFA
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-body dark:text-bodydark2">Type:</span>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {detailTransaction.transaction_type}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Transaction Details */}
                <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Copy className="h-5 w-5 text-body" />
                      <span>Détails de la transaction</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:p-4 md:p-6">
                      <div className="space-y-4">
                        <div>
                          <span className="text-sm font-medium text-body dark:text-bodydark2">Référence:</span>
                          <p className="text-sm font-mono text-gray-900 dark:text-gray-100">
                            {detailTransaction.reference}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-body dark:text-bodydark2">Statut:</span>
                          <div className="mt-1">
                            {getStatusBadge(detailTransaction.status)}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-body dark:text-bodydark2">ID Utilisateur Betting:</span>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {detailTransaction.betting_user_id || 'Non disponible'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-body dark:text-bodydark2">Code de retrait:</span>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {detailTransaction.withdrawal_code || 'Non disponible'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <span className="text-sm font-medium text-body dark:text-bodydark2">ID Transaction Externe:</span>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {detailTransaction.external_transaction_id || 'Non disponible'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-body dark:text-bodydark2">Taux de commission:</span>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {detailTransaction.commission_rate}%
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-body dark:text-bodydark2">Montant de commission:</span>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {parseFloat(detailTransaction.commission_amount).toFixed(2)} FCFA
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-body dark:text-bodydark2">Commission payée:</span>
                          <div className="mt-1">
                            <Badge className={detailTransaction.commission_paid ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"}>
                              {detailTransaction.commission_paid ? "Payée" : "Impayée"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* External Response */}
                {detailTransaction.external_response && (
                  <Card className="bg-gray-50 dark:bg-meta-4 border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <RefreshCw className="h-5 w-5 text-body" />
                        <span>Réponse Externe</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs text-body dark:text-bodydark2 bg-white dark:bg-boxdark p-4 rounded-lg overflow-x-auto">
                        {JSON.stringify(detailTransaction.external_response, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}

                {/* Cancellation Actions */}
                {detailTransaction.status === "cancellation_requested" && (
                  <Card className="bg-gray dark:bg-orange-900/20 border-stroke dark:border-orange-700">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-primary" />
                        <span>Demande d'annulation</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <span className="text-sm font-medium text-body dark:text-bodydark2">Demandée par:</span>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {detailTransaction.cancellation_requested_by_name}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-body dark:text-bodydark2">Date de demande:</span>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {detailTransaction.cancellation_requested_at
                              ? new Date(detailTransaction.cancellation_requested_at).toLocaleString()
                              : 'Non disponible'
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-body dark:text-bodydark2">Notes:</span>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {detailTransaction.notes || 'Aucune note'}
                          </p>
                        </div>
                        <div className="pt-4">
                          <Button
                            onClick={() => {
                              setProcessCancellationTransaction(detailTransaction);
                              setProcessCancellationNotes("");
                              setProcessCancellationModalOpen(true);
                            }}
                            className="bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white"
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Traiter l'annulation
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                  <div>
                    <span className="text-sm font-medium text-body dark:text-bodydark2">Créé le:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {detailTransaction.created_at
                        ? new Date(detailTransaction.created_at).toLocaleString()
                        : 'Non disponible'
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-body dark:text-bodydark2">Mis à jour le:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {detailTransaction.updated_at
                        ? new Date(detailTransaction.updated_at).toLocaleString()
                        : 'Non disponible'
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-body dark:text-bodydark2">Solde partenaire avant:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {parseFloat(detailTransaction.partner_balance_before || 0).toFixed(2)} FCFA
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>


        {/* Mark as Success Modal */}
        <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-meta-3">
                <CheckCircle className="h-5 w-5" />
                <span>Marquer comme Succès</span>
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSuccessSubmit} className="space-y-4">
              {successError && <ErrorDisplay error={successError} />}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-300">
                  Transaction: <span className="font-mono font-bold">{successTransaction?.reference}</span>
                </p>
                <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                  Cette action marquera manuellement cette transaction comme réussie.
                </p>
              </div>
              <div>
                <Label htmlFor="success_reason">Raison / Notes</Label>
                <Textarea
                  id="success_reason"
                  placeholder="Expliquez pourquoi vous marquez cette transaction comme succès..."
                  value={successReason}
                  onChange={(e) => setSuccessReason(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSuccessModalOpen(false)}
                  disabled={successLoading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-meta-3 hover:bg-green-700 text-white"
                  disabled={successLoading}
                >
                  {successLoading ? "Traitement..." : "Confirmer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Refund / Cancellation Modal (From Actions Menu) */}
        <Dialog open={refundModalOpen} onOpenChange={setRefundModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-primary">
                <RefreshCw className="h-5 w-5" />
                <span>Rembourser la transaction</span>
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleProcessCancellation} className="space-y-4">
              {refundError && <ErrorDisplay error={refundError} />}
              <div className="p-4 bg-gray dark:bg-orange-900/20 rounded-lg">
                <p className="text-sm text-orange-800 dark:text-secondary">
                  Transaction: <span className="font-mono font-bold">{refundTransaction?.reference}</span>
                </p>
                <p className="text-xs text-orange-700 dark:text-primary mt-1">
                  Cette action annulera la transaction et remboursera le partenaire.
                </p>
              </div>
              <div>
                <Label htmlFor="refund_reason">Raison / Notes</Label>
                <Textarea
                  id="refund_reason"
                  placeholder="Raison du remboursement..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRefundModalOpen(false)}
                  disabled={cancellationLoading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-opacity-90 text-white"
                  disabled={cancellationLoading}
                >
                  {cancellationLoading ? "Traitement..." : "Confirmer le remboursement"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Mark as Failed Modal */}
        <Dialog open={failedModalOpen} onOpenChange={setFailedModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-red-600">
                <XCircle className="h-5 w-5" />
                <span>Marquer comme Échec</span>
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFailedSubmit} className="space-y-4">
              {failedError && <ErrorDisplay error={failedError} />}
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-300">
                  Transaction: <span className="font-mono font-bold">{failedTransaction?.reference}</span>
                </p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                  Cette action marquera manuellement cette transaction comme échouée.
                </p>
              </div>
              <div>
                <Label htmlFor="failed_reason">Raison / Notes</Label>
                <Textarea
                  id="failed_reason"
                  placeholder="Expliquez pourquoi vous marquez cette transaction comme échec..."
                  value={failedReason}
                  onChange={(e) => setFailedReason(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFailedModalOpen(false)}
                  disabled={failedLoading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={failedLoading}
                >
                  {failedLoading ? "Traitement..." : "Confirmer l'échec"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Process Cancellation Request Modal */}
        <Dialog open={processCancellationModalOpen} onOpenChange={setProcessCancellationModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-primary">
                <AlertTriangle className="h-5 w-5" />
                <span>Traiter la demande d'annulation</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {processCancellationError && <ErrorDisplay error={processCancellationError} />}
              <div className="p-4 bg-gray dark:bg-orange-900/20 rounded-lg">
                <p className="text-sm text-orange-800 dark:text-secondary">
                  Transaction: <span className="font-mono font-bold">{(processCancellationTransaction || detailTransaction)?.reference}</span>
                </p>
                <p className="text-xs text-orange-700 dark:text-primary mt-1">
                  Approuver ou rejeter la demande d'annulation pour cette transaction.
                </p>
              </div>
              <div>
                <Label htmlFor="process_notes">Notes d'administration</Label>
                <Textarea
                  id="process_notes"
                  placeholder="Notes sur la décision..."
                  value={processCancellationNotes}
                  onChange={(e) => setProcessCancellationNotes(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="flex flex-col space-y-2 pt-2">
                <div className="flex space-x-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setProcessCancellationModalOpen(false)}
                    disabled={processCancellationLoading}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleProcessCancellationRequest(false)}
                    disabled={processCancellationLoading}
                  >
                    {processCancellationLoading ? "Chargement..." : "Rejeter"}
                  </Button>
                  <Button
                    type="button"
                    className="bg-meta-3 hover:bg-green-700 text-white"
                    onClick={() => handleProcessCancellationRequest(true)}
                    disabled={processCancellationLoading}
                  >
                    {processCancellationLoading ? "Chargement..." : "Approuver"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}

export default function BettingTransactionsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-body">Chargement...</span>
        </div>
      </div>
    }>
      <BettingTransactionsPageContent />
    </Suspense>
  )
}
