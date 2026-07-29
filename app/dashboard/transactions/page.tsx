"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLanguage } from "@/components/providers/language-provider"
import { useApi } from "@/lib/useApi"
import { Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ArrowUpDown, Pencil, Trash, CreditCard, TrendingUp, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Plus, Filter, MoreHorizontal, Eye, TrendingDown, Calendar, X, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
// import { useWebSocket } from "@/components/providers/websocket-provider"
import Link from "next/link"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DateRangeFilter } from "@/components/ui/date-range-filter"
import { CopyButton } from "@/components/ui/copy-button"
import { Checkbox } from "@/components/ui/checkbox"
import { BulkActionBar } from "@/components/data-table/bulk-action-bar"
import { SortableHead } from "@/components/data-table/sortable-head"
import { useTableSelection } from "@/hooks/use-table-selection"
import { getApiBaseUrl } from "@/lib/env-config"
import {
  bulkPaymentTransactionCancel,
  bulkPaymentTransactionFailed,
  bulkPaymentTransactionSuccess,
  formatBulkToast,
} from "@/lib/transaction-bulk-api"


const baseUrl = getApiBaseUrl()

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

function truncate(str: string, n: number) {
  if (!str) return "";
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}

function formatAmount(x: any) {
  const n = Number(x || 0);
  if (Number.isNaN(n)) return "0";
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
}

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function networkColor(network?: string | null): string {
  if (!network) return "#9ca3af";
  const n = network.toLowerCase();
  if (n.includes("orange")) return "#ff7900";
  if (n.includes("mtn") || n.includes("momo")) return "#ffcc00";
  if (n.includes("wave")) return "#00b140";
  if (n.includes("moov")) return "#00aeef";
  if (n.includes("celtic")) return "#1e40af";
  return "#6b7280";
}

function getRelativeTime(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso).getTime();
  if (Number.isNaN(date)) return "";
  const diffMs = Date.now() - date;
  const s = Math.max(1, Math.floor(diffMs / 1000));
  if (s < 60) return `il y a ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `il y a ${d}j`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `il y a ${mo} mois`;
  const y = Math.floor(mo / 12);
  return `il y a ${y} an${y > 1 ? "s" : ""}`;
}

function TransactionsPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all")
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "all")
  const [networkFilter, setNetworkFilter] = useState(searchParams.get("network") || "all")
  const [networks, setNetworks] = useState<any[]>([])
  const [startDate, setStartDate] = useState<string | null>(searchParams.get("start_date"))
  const [endDate, setEndDate] = useState<string | null>(searchParams.get("end_date"))
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1)
  const [sortField, setSortField] = useState<"amount" | "created_at" | "status" | "type" | "recipient_phone" | null>(() => {
    const f = searchParams.get("sort_field")
    if (f === "date") return "created_at"
    return (f as any) || "created_at"
  })
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">((searchParams.get("sort_dir") as any) || "desc")
  const [bulkLoading, setBulkLoading] = useState(false)
  const [expandedUssd, setExpandedUssd] = useState<Set<string>>(new Set())
  const [transactions, setTransactions] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { t } = useLanguage()
  const itemsPerPage = 10
  const apiFetch = useApi()
  const { toast } = useToast()
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState("")
  const [editTransaction, setEditTransaction] = useState<any | null>(null)
  const [deleteUid, setDeleteUid] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [showEditConfirm, setShowEditConfirm] = useState(false)
  const [pendingEditPayload, setPendingEditPayload] = useState<any | null>(null)

  // Pull-to-refresh
  const [ptrStartY, setPtrStartY] = useState<number | null>(null)
  const [ptrDistance, setPtrDistance] = useState(0)
  const [ptrRefreshing, setPtrRefreshing] = useState(false)
  const PTR_THRESHOLD = 72
  const PTR_MAX = 140

  const selection = useTableSelection(transactions)

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    networkFilter !== "all" ||
    startDate ||
    endDate

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setTypeFilter("all")
    setNetworkFilter("all")
    setStartDate(null)
    setEndDate(null)
    setCurrentPage(1)
    updateUrl({
      search: null,
      status: null,
      type: null,
      network: null,
      start_date: null,
      end_date: null,
      page: 1,
    })
  }

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

  const handleSortChange = (field: "amount" | "created_at" | "status" | "type" | "recipient_phone") => {
    const newDir = sortField === field ? (sortDirection === "desc" ? "asc" : "desc") : "desc"
    setSortField(field)
    setSortDirection(newDir)
    setCurrentPage(1)
    updateUrl({ sort_field: field, sort_dir: newDir, page: 1 })
  }

  // Edit form state
  const [editForm, setEditForm] = useState({
    status: "",
    external_transaction_id: "",
    balance_before: "",
    balance_after: "",
    fees: "",
    confirmation_message: "",
    raw_sms: "",
    completed_at: "",
    error_message: "",
  })

  // Fetch transactions from API
  const fetchTransactions = async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: itemsPerPage.toString(),
      })
      if (searchTerm.trim() !== "") params.append("search", searchTerm)
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (typeFilter !== "all") params.append("type", typeFilter)
      if (networkFilter !== "all") params.append("network", networkFilter)
      if (startDate) params.append("created_at__gte", startDate)
      if (endDate) params.append("created_at__lte", endDate)
      const orderField = sortField || "created_at"
      params.append("ordering", sortDirection === "desc" ? `-${orderField}` : orderField)

      const endpoint = `payments/transactions/?${params.toString()}`
      const data = await apiFetch(endpoint)
      setTransactions(data.results || []);
      setTotalCount(data.count || 0);
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("transactions.failedToLoad");
      setError(errorMessage);
      setTransactions([]);
      toast({
        title: t("transactions.failedToLoad"),
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Transactions fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [searchTerm, statusFilter, typeFilter, networkFilter, currentPage, sortField, sortDirection, startDate, endDate]);

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
  }, [apiFetch])

  // Remove client-side filtering and sorting since it's now handled by the API
  const filteredAndSortedTransactions = transactions
  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTransactions = filteredAndSortedTransactions

  const handleSort = (field: "amount" | "created_at" | "status" | "type" | "recipient_phone") => {
    handleSortChange(field)
  }

  const runBulk = async (action: "cancel" | "success" | "failed") => {
    const uids = selection.selectedRows.map((t) => t.uid)
    if (!uids.length) return
    setBulkLoading(true)
    try {
      let result
      if (action === "cancel") result = await bulkPaymentTransactionCancel(apiFetch, uids)
      else if (action === "success") result = await bulkPaymentTransactionSuccess(apiFetch, uids)
      else result = await bulkPaymentTransactionFailed(apiFetch, uids)
      const labels = { cancel: "Annulation groupée", success: "Succès groupé", failed: "Échec groupé" }
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


  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: "En attente", color: "#ffc107" },
    sent_to_user: { label: "Envoyé", color: "#17a2b8" },
    processing: { label: "En cours", color: "#fd7e14" },
    completed: { label: "Terminé", color: "#28a745" },
    success: { label: "Succès", color: "#20c997" },
    failed: { label: "Échec", color: "#dc3545" },
    cancelled: { label: "Annulé", color: "#6c757d" },
    timeout: { label: "Délai dépassé", color: "#6f42c1" },
    confirmed: { label: "Confirmé", color: "#007bff" },
    expired: { label: "Expiré", color: "#343a40" },
  };

  // Returns Tailwind classes for the table row background based on status
  const getStatusRowClass = (status: string): string => {
    switch (status) {
      case "completed":
      case "success":
        return "bg-meta-3/5 dark:bg-meta-3/10 border-l-4 border-l-meta-3"
      case "pending":
        return "bg-warning/5 dark:bg-warning/10 border-l-4 border-l-warning"
      case "processing":
      case "sent_to_user":
        return "bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary"
      case "failed":
      case "cancelled":
      case "timeout":
        return "bg-danger/5 dark:bg-danger/10 border-l-4 border-l-danger"
      case "confirmed":
        return "bg-secondary/10 dark:bg-secondary/15 border-l-4 border-l-secondary"
      case "expired":
        return "bg-graydark/5 dark:bg-meta-4/30 border-l-4 border-l-graydark"
      default:
        return ""
    }
  }

  const getStatusBadge = (status: string) => {
    const info = statusMap[status] || { label: status, color: "#adb5bd" };
    return (
      <span
        style={{
          backgroundColor: info.color,
          color: "#fff",
          borderRadius: "0.375rem",
          padding: "0.25em 0.75em",
          fontWeight: 500,
          fontSize: "0.875rem",
          display: "inline-block",
        }}
      >
        {info.label}
      </span>
    );
  };


  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      deposit: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      withdrawal: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
      transfer: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
    }
    return <Badge className={colors[type] || ""}>{t(`transactions.${type}`) || type}</Badge>
  }

  // Open edit modal and populate form
  const handleOpenEdit = (transaction: any) => {
    setEditTransaction(transaction)
    setEditForm({
      status: transaction.status || "",
      external_transaction_id: transaction.external_transaction_id || "",
      balance_before: transaction.balance_before || "",
      balance_after: transaction.balance_after || "",
      fees: transaction.fees || "",
      confirmation_message: transaction.confirmation_message || "",
      raw_sms: transaction.raw_sms || "",
      completed_at: transaction.completed_at || "",
      error_message: transaction.error_message || "",
    })
    setEditModalOpen(true)
    setEditError("")
  }
  // Handle edit form change
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }
  // Submit edit -> open confirm modal
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTransaction) return
    const payload = { ...editForm }
    setPendingEditPayload(payload)
    setShowEditConfirm(true)
  }

  // Confirm and send PATCH
  const confirmEditAndSend = async () => {
    if (!editTransaction || !pendingEditPayload) return
    setEditLoading(true)
    setEditError("")
    try {
      const endpoint = `payments/transactions/${editTransaction.uid}/`
      await apiFetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingEditPayload),
        successMessage: t("transactions.transactionUpdatedSuccessfully") || "Transaction mise à jour avec succès"
      })
      setShowEditConfirm(false)
      setPendingEditPayload(null)
      setEditModalOpen(false)
      setEditTransaction(null)
      setEditForm({
        status: "",
        external_transaction_id: "",
        balance_before: "",
        balance_after: "",
        fees: "",
        confirmation_message: "",
        raw_sms: "",
        completed_at: "",
        error_message: "",
      })
      router.refresh()
      await fetchTransactions()
    } catch (err: any) {
      const backendError = extractErrorMessages(err) || t("transactions.failedToEdit")
      setEditError(backendError)
      toast({ title: t("transactions.failedToEdit"), description: backendError, variant: "destructive" })
    } finally {
      setEditLoading(false)
    }
  }
  // Delete transaction
  const handleDelete = async () => {
    if (!deleteUid) return
    setLoading(true)
    setError("")
    try {
      const endpoint = `payments/transactions/${deleteUid}/`
      await apiFetch(endpoint, {
        method: "DELETE",
        successMessage: t("transactions.transactionDeletedSuccessfully") || "Transaction supprimée avec succès"
      })
      setDeleteUid(null)
      // Refetch transactions
      await fetchTransactions()
    } catch (err: any) {
      const backendError = err?.message || t("transactions.failedToDelete")
      setError(backendError)
      toast({
        title: t("transactions.failedToDelete"),
        description: backendError,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // WEBSOCKET CODE COMMENTED OUT
  // Listen for transaction_update WebSocket messages
  // const { lastMessage } = useWebSocket();
  // useEffect(() => {
  //   if (!lastMessage) return;
  //   try {
  //     const data = typeof lastMessage.data === "string" ? JSON.parse(lastMessage.data) : lastMessage.data;

  //     // Handle new transaction creation (per backend docs)
  //     if (data.type === "new_transaction" && data.event === "transaction_created" && data.transaction_data) {
  //       const newTx = data.transaction_data;
  //       // If user is on page 1, show it immediately on top; otherwise, just bump count
  //       setTransactions(prev => (currentPage === 1 ? [newTx, ...prev].slice(0, itemsPerPage) : prev));
  //       setTotalCount(prev => prev + 1);
  //       toast({
  //         title: t("transactions.created") || "Transaction created",
  //         description: data.message || `${t("transactions.transaction")} ${newTx.uid} ${t("transactions.createdSuccessfully") || "was created."}`,
  //       });
  //       return;
  //     }

  //     // Handle live transaction updates (existing behavior)
  //     if (data.type === "transaction_update" && data.transaction_uid) {
  //       setTransactions((prev) =>
  //         prev.map((tx) =>
  //           tx.uid === data.transaction_uid
  //             ? { ...tx, status: data.status, ...data.data }
  //             : tx
  //         )
  //       );
  //       toast({
  //         title: t("transactions.liveUpdate"),
  //         description: `${t("transactions.transaction")} ${data.transaction_uid} ${t("transactions.statusUpdated")}: ${data.status}`,
  //       });
  //       return;
  //     }

  //     // Optionally surface system events as informational toasts
  //     if (data.type === "system_event" && data.event === "system_event_created") {
  //       toast({
  //         title: t("transactions.systemEvent") || "System event",
  //         description: data.message || data?.event_data?.description || "",
  //       });
  //       return;
  //     }
  //   } catch (err) {
  //     // Optionally log or handle parse errors
  //   }
  // }, [lastMessage, t, toast, currentPage, itemsPerPage]);

  // Retry modal state
  const [retryModalOpen, setRetryModalOpen] = useState(false)
  const [retryReason, setRetryReason] = useState("")
  const [retryLoading, setRetryLoading] = useState(false)
  const [retryError, setRetryError] = useState("")
  const [retryTransaction, setRetryTransaction] = useState<any | null>(null)

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState("")
  const [cancelTransaction, setCancelTransaction] = useState<any | null>(null)

  // Mark as success modal state
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [successReason, setSuccessReason] = useState("")
  const [successLoading, setSuccessLoading] = useState(false)
  const [successError, setSuccessError] = useState("")
  const [successTransaction, setSuccessTransaction] = useState<any | null>(null)

  // Mark as failed modal state
  const [failedModalOpen, setFailedModalOpen] = useState(false)
  const [failedReason, setFailedReason] = useState("Tentative de relance après timeout")
  const [failedLoading, setFailedLoading] = useState(false)
  const [failedError, setFailedError] = useState("")
  const [failedTransaction, setFailedTransaction] = useState<any | null>(null)

  // Extract a user uid from transaction, trying several likely fields
  const extractUserUid = (tx: any): string | null => {
    return tx?.user_uid || tx?.user_id || tx?.user?.uid || tx?.owner_uid || null
  }

  // Assign transaction to its user
  const handleAssign = async (tx: any) => {
    const userUid = extractUserUid(tx)
    if (!userUid) {
      toast({
        title: t("transactions.assignFailed") || "Assign failed",
        description: t("transactions.userIdMissing") || "User ID not found on this transaction.",
        variant: "destructive",
      })
      return
    }
    try {
      const endpoint = `payments/transactions/${tx.uid}/assign/`
      await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_uid: userUid }),
        successMessage: t("transactions.assignedSuccessfully") || "Transaction assignée avec succès"
      })
      // Refresh list
      router.refresh()
      await fetchTransactions()
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("transactions.assignFailed") || "Failed to assign transaction"
      toast({ title: t("transactions.assignFailed") || "Assign failed", description: errorMessage, variant: "destructive" })
    }
  }

  // Open retry modal
  const openRetryModal = (tx: any) => {
    setRetryTransaction(tx)
    setRetryReason("")
    setRetryError("")
    setRetryModalOpen(true)
  }

  // Submit retry request
  const handleRetrySubmit = async () => {
    if (!retryTransaction) return
    setRetryLoading(true)
    setRetryError("")
    try {
      const endpoint = `payments/transactions/${retryTransaction.uid}/retry/`
      await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Aucune raison fournie" }),
        successMessage: t("transactions.retryRequested") || "Demande de relance envoyée avec succès"
      })
      setRetryModalOpen(false)
      setRetryTransaction(null)
      setRetryReason("")
      // Refresh list
      router.refresh()
      await fetchTransactions()
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("transactions.retryFailed") || "Failed to retry transaction"
      setRetryError(errorMessage)
      toast({ title: t("transactions.retryFailed") || "Retry failed", description: errorMessage, variant: "destructive" })
    } finally {
      setRetryLoading(false)
    }
  }

  // Open/submit cancel
  const openCancelModal = (tx: any) => {
    setCancelTransaction(tx)
    setCancelReason("")
    setCancelError("")
    setCancelModalOpen(true)
  }
  const handleCancelSubmit = async () => {
    if (!cancelTransaction) return
    setCancelLoading(true)
    setCancelError("")
    try {
      const endpoint = `payments/transactions/${cancelTransaction.uid}/cancel/`
      await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason.trim() || "Aucune raison fournie" }),
        successMessage: t("transactions.cancelRequested") || "Demande d'annulation envoyée avec succès"
      })
      setCancelModalOpen(false)
      setCancelTransaction(null)
      setCancelReason("")
      router.refresh()
      await fetchTransactions()
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("transactions.cancelFailed") || "Failed to cancel transaction"
      setCancelError(errorMessage)
      toast({ title: t("transactions.cancelFailed") || "Cancel failed", description: errorMessage, variant: "destructive" })
    } finally {
      setCancelLoading(false)
    }
  }

  // Open/submit success
  const openSuccessModal = (tx: any) => {
    setSuccessTransaction(tx)
    setSuccessReason("")
    setSuccessError("")
    setSuccessModalOpen(true)
  }
  const handleSuccessSubmit = async () => {
    if (!successTransaction) return
    setSuccessLoading(true)
    setSuccessError("")
    try {
      const endpoint = `payments/transactions/${successTransaction.uid}/success/`
      await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: successReason.trim() || "Aucune raison fournie" }),
        successMessage: t("transactions.successRequested") || "Success update sent successfully."
      })
      setSuccessModalOpen(false)
      setSuccessTransaction(null)
      setSuccessReason("")
      router.refresh()
      await fetchTransactions()
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("transactions.successFailed") || "Failed to mark transaction as success"
      setSuccessError(errorMessage)
      toast({ title: t("transactions.successFailed") || "Mark as success failed", description: errorMessage, variant: "destructive" })
    } finally {
      setSuccessLoading(false)
    }
  }

  // Open/submit failed
  const openFailedModal = (tx: any) => {
    setFailedTransaction(tx)
    setFailedReason("Tentative de relance après timeout")
    setFailedError("")
    setFailedModalOpen(true)
  }
  const handleFailedSubmit = async () => {
    if (!failedTransaction) return
    setFailedLoading(true)
    setFailedError("")
    try {
      const endpoint = `payments/transactions/${failedTransaction.uid}/mark-failed/`
      await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: failedReason.trim() || "Aucune raison fournie" }),
        successMessage: t("transactions.failedRequested") || "Mark as failed request sent successfully."
      })
      setFailedModalOpen(false)
      setFailedTransaction(null)
      setFailedReason("Tentative de relance après timeout")
      router.refresh()
      await fetchTransactions()
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("transactions.failedFailed") || "Failed to mark transaction as failed"
      setFailedError(errorMessage)
      toast({ title: t("transactions.failedFailed") || "Mark as failed failed", description: errorMessage, variant: "destructive" })
    } finally {
      setFailedLoading(false)
    }
  }

  // Pull-to-refresh: start tracking
  const handlePtrStart = (clientY: number) => {
    if (ptrRefreshing || loading) return
    const atTop = (typeof window !== "undefined" ? window.scrollY : 0) <= 0
    if (!atTop) return
    setPtrStartY(clientY)
    setPtrDistance(0)
  }

  const handlePtrMove = (clientY: number) => {
    if (ptrStartY === null || ptrRefreshing) return
    const rawDelta = clientY - ptrStartY
    if (rawDelta <= 0) {
      setPtrDistance(0)
      return
    }
    // Damped over-pull past PTR_MAX
    let d = rawDelta * 0.5
    if (d > PTR_MAX) d = PTR_MAX + (rawDelta * 0.5 - PTR_MAX) * 0.25
    setPtrDistance(d)
  }

  const handlePtrEnd = () => {
    if (ptrStartY === null) return
    setPtrStartY(null)
    if (ptrDistance >= PTR_THRESHOLD && !ptrRefreshing) {
      // Snap to refreshing height, run fetch, then reset
      setPtrRefreshing(true)
      setPtrDistance(PTR_THRESHOLD)
      const onDone = () => {
        setTimeout(() => {
          setPtrRefreshing(false)
          setPtrDistance(0)
        }, 320)
      }
      fetchTransactions().then(onDone, onDone)
    } else {
      // Release without triggering: snap back
      setPtrDistance(0)
    }
  }

  if (false && loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-lg font-semibold">{t("common.loading")}</span>
      </div>
    )
  }

  if (false && error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={fetchTransactions}
        variant="full"
        showDismiss={false}
      />
    )
  }

  function triggerPtrRefresh(): void {
    throw new Error("Function not implemented.")
  }

  return (
    <div
      className="min-h-screen bg-whiten dark:bg-boxdark-2 overscroll-contain touch-pan-y select-none"
      onTouchStart={(e) => handlePtrStart(e.touches[0].clientY)}
      onTouchMove={(e) => handlePtrMove(e.touches[0].clientY)}
      onTouchEnd={handlePtrEnd}
      onTouchCancel={handlePtrEnd}
      onMouseDown={(e) => { if (e.button === 0) handlePtrStart(e.clientY) }}
      onMouseMove={(e) => { if (e.buttons & 1) handlePtrMove(e.clientY) }}
      onMouseUp={handlePtrEnd}
      onMouseLeave={handlePtrEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div
        className="w-full flex justify-center overflow-hidden transition-[height] duration-300 ease-out"
        style={{ height: ptrDistance }}
        aria-hidden={ptrDistance <= 0}
      >
        <div
          className="flex items-center gap-2 text-sm font-semibold text-body dark:text-bodydark2"
          style={{ height: PTR_THRESHOLD }}
        >
          <RefreshCw className={`h-5 w-5 ${ptrRefreshing ? "animate-spin text-primary" : ptrDistance >= PTR_THRESHOLD ? "text-meta-3" : ""}`} />
          <span>
            {ptrRefreshing ? "Actualisation…" : ptrDistance >= PTR_THRESHOLD ? "Relâcher pour actualiser" : ptrDistance > 0 ? "Tirer pour actualiser" : ""}
          </span>
        </div>
      </div>

      <div className="w-full">

        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
            <div>
              <h1 className="text-base font-bold sm:text-lg sm:text-2xl bg-gradient-to-r from-primary to-meta-3 bg-clip-text text-transparent">
                <span>{t("transactions.title")}</span>
              </h1>
              <p className="text-body dark:text-bodydark mt-2 text-lg">
                <span>Surveiller et gérer les transactions de paiement</span>
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="bg-white dark:bg-boxdark rounded-lg px-4 py-2 shadow-sm">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-gray-700 dark:text-bodydark">
                    <span>{totalCount}</span> <span>transactions</span>
                  </span>
                </div>
              </div>
              <Button
                onClick={() => triggerPtrRefresh()}
                disabled={ptrRefreshing || loading}
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                <RefreshCw className={`h-4 w-4 ${ptrRefreshing ? "animate-spin" : ""}`} />
                Rafraîchir
              </Button>
              {/* <Button
                onClick={() => setCreateModalOpen(true)}
                className="bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Transaction
            </Button> */}
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="grid grid-cols-1 grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-bodydark2" />
                <Input
                  placeholder={t("transactions.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
                  <SelectValue placeholder={t("transactions.filterByStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("transactions.allStatuses")}</SelectItem>
                  <SelectItem value="pending">{t("transactions.pending")}</SelectItem>
                  <SelectItem value="sent_to_user">{t("transactions.sent_to_user")}</SelectItem>
                  <SelectItem value="processing">{t("transactions.processing")}</SelectItem>
                  <SelectItem value="completed">{t("transactions.completed")}</SelectItem>
                  <SelectItem value="success">{t("transactions.success")}</SelectItem>
                  <SelectItem value="failed">{t("transactions.failed")}</SelectItem>
                  <SelectItem value="cancelled">{t("transactions.cancelled")}</SelectItem>
                  <SelectItem value="timeout">{t("transactions.timeout")}</SelectItem>
                  <SelectItem value="confirmed">{t("transactions.confirmed")}</SelectItem>
                  <SelectItem value="expired">{t("transactions.expired")}</SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={handleTypeChange}>
                <SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
                  <SelectValue placeholder={t("transactions.filterByType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("transactions.allTypes")}</SelectItem>
                  <SelectItem value="deposit">{t("transactions.deposit")}</SelectItem>
                  <SelectItem value="withdrawal">{t("transactions.withdrawal")}</SelectItem>
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

              {/* Sort */}
              <Select
                value={`${sortField || "created_at"}:${sortDirection}`}
                onValueChange={(value) => {
                  const [field, dir] = value.split(":") as [
                    "amount" | "created_at" | "status" | "type" | "recipient_phone",
                    "asc" | "desc",
                  ]
                  setSortField(field)
                  setSortDirection(dir)
                  setCurrentPage(1)
                  updateUrl({ sort_field: field, sort_dir: dir, page: 1 })
                }}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at:desc">Date ↓</SelectItem>
                  <SelectItem value="created_at:asc">Date ↑</SelectItem>
                  <SelectItem value="amount:desc">Montant ↓</SelectItem>
                  <SelectItem value="amount:asc">Montant ↑</SelectItem>
                  <SelectItem value="status:asc">Statut ↑</SelectItem>
                  <SelectItem value="type:asc">Type ↑</SelectItem>
                  <SelectItem value="recipient_phone:asc">Téléphone ↑</SelectItem>
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
                className="col-span-1"
              />
            </div>
            {hasActiveFilters && (
              <div className="flex justify-end mt-3 pt-3 border-t border-gray-100 dark:border-strokedark">
                <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" /> Effacer filtres
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <BulkActionBar count={selection.count} onClear={selection.clear} loading={bulkLoading}>
          <Button size="sm" variant="outline" disabled={bulkLoading} onClick={() => runBulk("cancel")}>
            <XCircle className="h-4 w-4 mr-1" /> Annuler
          </Button>
          <Button size="sm" variant="outline" disabled={bulkLoading} onClick={() => runBulk("success")}>
            <CheckCircle className="h-4 w-4 mr-1" /> Marquer succès
          </Button>
          <Button size="sm" variant="outline" disabled={bulkLoading} onClick={() => runBulk("failed")}>
            <AlertCircle className="h-4 w-4 mr-1" /> Marquer échec
          </Button>
        </BulkActionBar>

        {/* Transactions Card List */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <CardHeader className="border-b border-gray-100 dark:border-strokedark">
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CreditCard className="h-5 w-5 text-meta-3 dark:text-green-300" />
              </div>
              <span><span>Liste des transactions</span></span>
              <span className="ml-auto text-sm font-normal text-body dark:text-bodydark2">
                <Checkbox
                  className="mr-2 !h-4 !w-4"
                  checked={selection.allSelected ? true : selection.someSelected ? "indeterminate" : false}
                  onCheckedChange={(v) => selection.toggleAll(v === true)}
                  aria-label="Tout sélectionner"
                />
                Tout sélectionner
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-5">
            {loading ? (
              <div className="flex items-center justify-center py-6 sm:py-10">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-body dark:text-bodydark"><span>Chargement des transactions...</span></span>
                </div>
              </div>
            ) : error ? (
              <div className="p-3 sm:p-4 md:p-6 text-center">
                <ErrorDisplay error={error} onRetry={fetchTransactions} />
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gray-100 dark:bg-meta-4 flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-bodydark2" />
                </div>
                <p className="text-body dark:text-bodydark">Aucune transaction trouvée.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => {
                  const statusInfo = statusMap[transaction.status] || { label: transaction.status, color: "#adb5bd" }
                  const relativeTime = getRelativeTime(transaction.created_at)
                  const isPending = ["pending", "sent_to_user", "processing"].includes(transaction.status)
                  const isPaid = ["success", "completed", "confirmed"].includes(transaction.status)
                  const isFailed = ["failed", "cancelled", "timeout", "expired"].includes(transaction.status)
                  return (
                    <div
                      key={transaction.uid}
                      className={`relative rounded-2xl border bg-white dark:bg-meta-4/20 px-5 pt-5 pb-4 shadow-sm transition hover:shadow-md ${getStatusRowClass(transaction.status)} ${isPending ? "border-amber-200 dark:border-amber-700/40" : isPaid ? "border-green-200 dark:border-green-700/40" : isFailed ? "border-red-200 dark:border-red-700/40" : "border-stroke dark:border-strokedark"}`}
                    >
                      {/* Row 1: Checkbox + platform/name · refs · status badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <Checkbox
                            checked={selection.selected.has(transaction.uid)}
                            onCheckedChange={(v) => selection.toggleRow(transaction.uid, v === true)}
                            aria-label={`Sélectionner ${transaction.uid}`}
                            className="!mt-1"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate max-w-[220px]">
                                {transaction.recipient_name || transaction.user_name || transaction.partner?.name || "Client"}
                              </h3>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-sm text-body dark:text-bodydark2 font-mono">
                              <span className="truncate">{transaction.uid || transaction.reference}</span>
                              {transaction.external_transaction_id && (
                                <>
                                  <span className="opacity-50">·</span>
                                  <span className="truncate">cl {transaction.external_transaction_id}</span>
                                </>
                              )}
                              <CopyButton value={transaction.uid || transaction.reference} className="h-3.5 w-3.5 opacity-70" iconClassName="h-3 w-3" />
                            </div>
                          </div>
                        </div>

                        <span
                          className="flex-shrink-0 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold"
                          style={{
                            backgroundColor: hexToRgba(statusInfo.color, 0.12),
                            color: statusInfo.color,
                          }}
                        >
                          {isPending ? "À payer" : statusInfo.label}
                        </span>
                      </div>

                      {/* Row 2: Amount + network badge */}
                      <div className="mt-2 flex items-center gap-3 flex-wrap">
                        <div className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
                          {formatAmount(transaction.amount)} F
                        </div>
                        <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 dark:bg-boxdark-2 px-3 py-1 text-sm font-semibold text-gray-800 dark:text-gray-100">
                          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: networkColor(transaction.network_name || transaction.network) }} />
                          {transaction.network_name || transaction.network || "Réseau"}
                        </span>
                        {getTypeBadge(transaction.type)}
                      </div>

                      {/* Row 3: Phone + verified · Date · relative */}
                      <div className="mt-1.5 flex items-center gap-x-4 gap-y-1 flex-wrap text-sm">
                        <div className="flex items-center gap-1.5 font-semibold text-gray-800 dark:text-gray-100">
                          <span>{transaction.recipient_phone || "—"}</span>
                          {transaction.recipient_phone && (
                            <CopyButton
                              value={transaction.recipient_phone}
                              className="h-4 w-4 opacity-70"
                              iconClassName="h-3 w-3"
                            />
                          )}
                          <span title="Numéro vérifié">
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-body dark:text-bodydark2">
                            {transaction.created_at ? new Date(transaction.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                          </span>
                          <span className="text-red-600 dark:text-red-400 font-semibold">
                            {relativeTime}
                          </span>
                        </div>
                      </div>

                      {/* Created by meta line */}
                      {(transaction.created_by_name || transaction.created_by_email) && (
                        <div className="mt-1.5 text-xs text-body dark:text-bodydark2">
                          Créé par <span className="font-medium text-gray-700 dark:text-gray-200">{transaction.created_by_name || "—"}</span>
                          {transaction.created_by_email && <span> · {transaction.created_by_email}</span>}
                        </div>
                      )}

                      {/* Warning banner: already-paid / error / confirmation */}
                      {transaction.error_message && (
                        <div className="mt-3 rounded-xl bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-700/40 px-3 py-2.5 text-red-800 dark:text-red-300">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div className="text-sm font-semibold leading-snug">⚠️ {transaction.error_message}</div>
                          </div>
                        </div>
                      )}
                      {transaction.confirmation_message && !transaction.error_message && isPaid && (
                        <div className="mt-3 rounded-xl bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-700/40 px-3 py-2.5 text-green-800 dark:text-green-300">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div className="text-sm font-semibold leading-snug">{transaction.confirmation_message}</div>
                          </div>
                        </div>
                      )}
                      {isPaid && !transaction.error_message && !transaction.confirmation_message && (
                        <div className="mt-3 rounded-xl bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-700/40 px-3 py-2.5 text-red-800 dark:text-red-300">
                          <div className="flex items-start gap-2">
                            <div className="text-sm font-bold leading-snug">
                              ⚠️ DÉJÀ PAYÉ chez nous — vérifier avant de repayer (risque de double paiement)
                            </div>
                          </div>
                        </div>
                      )}
                      {/* USSD Path Trace */}
                      {(() => {
                        const rawPath = transaction.ussd_path
                        if (!rawPath || !Array.isArray(rawPath) || rawPath.length === 0) return null

                        const parseStep = (entry: string): { role: "sent" | "received"; text: string } | null => {
                          const s = String(entry)
                          if (s.startsWith("Envoyé:") || s.startsWith("Envoye:")) {
                            return { role: "sent", text: s.replace(/^Envoy[eé]:\s*/, "").trim() }
                          }
                          if (s.startsWith("Reçu:") || s.startsWith("Recu:")) {
                            return { role: "received", text: s.replace(/^Re[cç]u:\s*/, "").trim() }
                          }
                          return null
                        }

                        const firstParsed = parseStep(rawPath[0])
                        const dialedCode = firstParsed?.role === "sent" ? firstParsed.text : rawPath[0]
                        const steps = rawPath.slice(1)

                        let lastReceivedIdx = -1
                        steps.forEach((entry: string, i: number) => {
                          const p = parseStep(entry)
                          if (p?.role === "received") lastReceivedIdx = i
                        })
                        const isFailed = ["failed", "cancelled", "timeout"].includes(transaction.status)
                        const isExpanded = expandedUssd.has(transaction.uid)
                        const toggleExpand = () => setExpandedUssd(prev => {
                          const next = new Set(prev)
                          next.has(transaction.uid) ? next.delete(transaction.uid) : next.add(transaction.uid)
                          return next
                        })

                        // Collapsed: show only dialed code header + first received step
                        const firstReceivedIdx = steps.findIndex(e => parseStep(e)?.role === "received")
                        const visibleSteps = isExpanded ? steps : steps.slice(0, firstReceivedIdx + 1)
                        const hiddenCount = steps.length - (firstReceivedIdx + 1)

                        const StepRow = ({ entry, idx }: { entry: string; idx: number }) => {
                          const parsed = parseStep(entry)
                          if (!parsed) return null
                          const isReceived = parsed.role === "received"
                          const isFailStep = isFailed && isReceived && idx === lastReceivedIdx
                          return (
                            <div className="grid grid-cols-[140px_1fr] gap-x-3 px-3 py-2.5 border-t border-gray-100 dark:border-strokedark/60 items-start">
                              {/* Fixed-width badge column */}
                              <div className="pt-0.5 flex-shrink-0">
                                {isReceived ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700/50 px-2 py-1 text-xs font-semibold text-green-800 dark:text-green-300 leading-tight">
                                    📩 Réponse opérateur
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700/50 px-2 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300 leading-tight">
                                    ▬ Le robot envoie
                                  </span>
                                )}
                              </div>
                              {/* Text column: min-w-0 forces wrap within this column only */}
                              <p className={`min-w-0 text-sm font-medium leading-snug break-words ${isFailStep ? "text-red-600 dark:text-red-400" : "text-gray-800 dark:text-gray-100"}`}>
                                {parsed.text}
                                {isFailStep && (
                                  <span className="ml-2 font-bold text-red-600 dark:text-red-400">← la raison de l'échec</span>
                                )}
                              </p>
                            </div>
                          )
                        }

                        return (
                          <div className="mt-3 rounded-xl border border-gray-200 dark:border-strokedark bg-gray-50 dark:bg-boxdark-2 overflow-hidden">
                            {/* Header: dialed code */}
                            <div className="flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-boxdark">
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 dark:bg-meta-4 border border-gray-300 dark:border-strokedark px-2.5 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap flex-shrink-0">
                                📞 Code composé
                              </span>
                              <span className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">{dialedCode}</span>
                            </div>
                            {/* Visible steps */}
                            {visibleSteps.map((entry: string, idx: number) => (
                              <StepRow key={idx} entry={entry} idx={idx} />
                            ))}
                            {/* Expand / collapse toggle */}
                            {hiddenCount > 0 && (
                              <button
                                type="button"
                                onClick={toggleExpand}
                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-primary dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-meta-4/40 transition border-t border-gray-100 dark:border-strokedark/60"
                              >
                                {isExpanded ? (
                                  <><ChevronUp className="h-3.5 w-3.5" /> Réduire</>
                                ) : (
                                  <><ChevronDown className="h-3.5 w-3.5" /> Voir {hiddenCount} étape{hiddenCount > 1 ? "s" : ""} de plus</>
                                )}
                              </button>
                            )}
                          </div>
                        )
                      })()}

                      {transaction.raw_sms && (
                        <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">
                          [DEJA PAYE] ⚠️ <span>{truncate(transaction.raw_sms, 120)}</span>
                        </div>
                      )}

                      {/* Action buttons */}
                      {transaction.status !== "success" && (
                        <div className="mt-4 flex flex-col gap-2 ml-8">
                          <button
                            type="button"
                            onClick={() => openRetryModal(transaction)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#194185] to-[#3b82f6] hover:brightness-110 text-white px-4 py-3 text-base font-semibold shadow-sm transition"
                          >
                            <ArrowUpDown className="h-5 w-5" />
                            Relancer
                          </button>

                          <button
                            type="button"
                            onClick={() => openSuccessModal(transaction)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-100 hover:bg-green-200 dark:bg-green-900/40 dark:hover:bg-green-900/60 text-green-800 dark:text-green-200 px-4 py-3 text-base font-semibold border border-green-200 dark:border-green-700/40 transition"
                          >
                            <CheckCircle className="h-5 w-5" />
                            Succès
                          </button>

                          <button
                            type="button"
                            onClick={() => openCancelModal(transaction)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-3 text-base font-semibold border border-red-200 dark:border-red-700/40 transition"
                          >
                            <XCircle className="h-5 w-5" />
                            Annuler
                          </button>

                          <button
                            type="button"
                            onClick={() => openFailedModal(transaction)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-700 to-red-800 hover:brightness-110 text-white px-4 py-3 text-base font-semibold shadow-sm transition"
                          >
                            <AlertCircle className="h-5 w-5" />
                            Échec
                          </button>
                        </div>
                      )}

                      {/* Secondary actions: Modifier · Assigner */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <button
                          onClick={() => router.push(`/dashboard/transactions/${transaction.uid}/edit`)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark px-3 py-2 text-xs font-medium text-body hover:border-primary hover:text-primary dark:text-bodydark dark:hover:border-primary dark:hover:text-white"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Modifier
                        </button>
                        <button
                          onClick={() => handleAssign(transaction)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark px-3 py-2 text-xs font-medium text-body hover:border-secondary hover:text-secondary dark:text-bodydark dark:hover:border-secondary dark:hover:text-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Assigner
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {Math.ceil(totalCount / itemsPerPage) > 1 && (
          <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center mt-6">
            <div className="text-sm text-body dark:text-bodydark2">
              <span>Affichage de</span> <span>{((currentPage - 1) * itemsPerPage) + 1}</span> <span>à</span> <span>{Math.min(currentPage * itemsPerPage, totalCount)}</span> <span>sur</span> <span>{totalCount}</span> <span>résultats</span>
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
                  const totalPages = Math.ceil(totalCount / itemsPerPage);
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
                onClick={() => handlePageChange(Math.min(Math.ceil(totalCount / itemsPerPage), currentPage + 1))}
                disabled={currentPage === Math.ceil(totalCount / itemsPerPage)}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier la transaction</DialogTitle>
              <DialogDescription>
                Mettre à jour les détails de la transaction
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {editError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">{editError}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Statut</label>
                  <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="processing">En cours</SelectItem>
                      <SelectItem value="completed">Terminé</SelectItem>
                      <SelectItem value="failed">Échec</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">ID Transaction externe</label>
                  <Input
                    name="external_transaction_id"
                    value={editForm.external_transaction_id}
                    onChange={handleEditChange}
                    placeholder="ID de transaction externe"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Solde avant</label>
                  <Input
                    name="balance_before"
                    value={editForm.balance_before}
                    onChange={handleEditChange}
                    placeholder="Solde avant la transaction"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Solde après</label>
                  <Input
                    name="balance_after"
                    value={editForm.balance_after}
                    onChange={handleEditChange}
                    placeholder="Solde après la transaction"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Frais</label>
                  <Input
                    name="fees"
                    value={editForm.fees}
                    onChange={handleEditChange}
                    placeholder="Frais de transaction"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Terminé le</label>
                  <Input
                    name="completed_at"
                    value={editForm.completed_at}
                    onChange={handleEditChange}
                    placeholder="Date de fin"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Message de confirmation</label>
                <textarea
                  name="confirmation_message"
                  value={editForm.confirmation_message}
                  onChange={handleEditChange}
                  placeholder="Message de confirmation"
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-meta-4 border border-stroke dark:border-strokedark rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-sm font-medium">SMS brut</label>
                <textarea
                  name="raw_sms"
                  value={editForm.raw_sms}
                  onChange={handleEditChange}
                  placeholder="Contenu du SMS brut"
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-meta-4 border border-stroke dark:border-strokedark rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Message d'erreur</label>
                <textarea
                  name="error_message"
                  value={editForm.error_message}
                  onChange={handleEditChange}
                  placeholder="Message d'erreur"
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-meta-4 border border-stroke dark:border-strokedark rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditModalOpen(false)}
                  disabled={editLoading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={editLoading}
                  className="bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white"
                >
                  {editLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Mise à jour...
                    </>
                  ) : (
                    "Mettre à jour la transaction"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Confirmation Modal */}
        <Dialog open={showEditConfirm} onOpenChange={setShowEditConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la mise à jour de la transaction</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir mettre à jour cette transaction ? Cette action ne peut pas être annulée.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditConfirm(false)}
                disabled={editLoading}
              >
                Annuler
              </Button>
              <Button
                onClick={confirmEditAndSend}
                disabled={editLoading}
                className="bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white"
              >
                {editLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Mise à jour...
                  </>
                ) : (
                  "Mettre à jour la transaction"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Retry Modal */}
        <Dialog open={retryModalOpen} onOpenChange={setRetryModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Relancer la transaction</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir relancer cette transaction ?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {retryError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">{retryError}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRetryModalOpen(false)}
                disabled={retryLoading}
              >
                Annuler
              </Button>
              <Button
                onClick={handleRetrySubmit}
                disabled={retryLoading}
                className="bg-gradient-to-r from-primary to-primary hover:from-orange-700 hover:to-primary text-white"
              >
                {retryLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Relancement...
                  </>
                ) : (
                  "Relancer la transaction"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Modal */}
        <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Annuler la transaction</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir annuler cette transaction ?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {cancelError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">{cancelError}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelLoading}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCancelSubmit}
                disabled={cancelLoading}
                className="bg-gradient-to-r from-red-600 to-red-600 hover:from-red-700 hover:to-red-700 text-white"
              >
                {cancelLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Annulation...
                  </>
                ) : (
                  "Annuler la transaction"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Marquer comme Succès</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir marquer cette transaction comme réussie ?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {successError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">{successError}</p>
                </div>
              )}
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
                onClick={handleSuccessSubmit}
                disabled={successLoading}
                className="bg-gradient-to-r from-meta-3 to-meta-3 hover:from-green-700 hover:to-green-700 text-white"
              >
                {successLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Marquage...
                  </>
                ) : (
                  "Marquer comme Succès"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Failed Modal */}
        <Dialog open={failedModalOpen} onOpenChange={setFailedModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Marquer comme Échec</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir marquer cette transaction comme échouée ?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {failedError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">{failedError}</p>
                </div>
              )}
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
                onClick={handleFailedSubmit}
                disabled={failedLoading}
                className="bg-gradient-to-r from-red-600 to-red-600 hover:from-red-700 hover:to-red-700 text-white"
              >
                {failedLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Marquage...
                  </>
                ) : (
                  "Marquer comme Échec"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <AlertDialog open={!!deleteUid} onOpenChange={(open) => { if (!open) setDeleteUid(null) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer la transaction</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action ne peut pas être annulée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? "Suppression..." : "Supprimer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create Transaction Modal */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle transaction</DialogTitle>
              <DialogDescription>
                Choisir le type de transaction que vous voulez créer
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <Button
                  onClick={() => {
                    setCreateModalOpen(false)
                    router.push("/dashboard/transactions/deposit")
                  }}
                  className="h-20 bg-gradient-to-r from-meta-3 to-meta-3 hover:from-meta-3 hover:to-green-700 text-white"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <DollarSign className="h-6 w-6" />
                    <span className="font-semibold">Dépôt</span>
                    <span className="text-sm opacity-90">Ajouter de l'argent au compte</span>
                  </div>
                </Button>

                <Button
                  onClick={() => {
                    setCreateModalOpen(false)
                    router.push("/dashboard/transactions/withdraw")
                  }}
                  className="h-20 bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <TrendingDown className="h-6 w-6" />
                    <span className="font-semibold">Retrait</span>
                    <span className="text-sm opacity-90">Retirer de l'argent du compte</span>
                  </div>
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
              >
                Annuler
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-body">Chargement...</span>
        </div>
      </div>
    }>
      <TransactionsPageContent />
    </Suspense>
  )
}
