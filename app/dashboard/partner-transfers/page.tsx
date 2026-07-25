"use client"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

import { useState, useEffect , useCallback} from "react"
import { useApi } from "@/lib/useApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Copy, Users, Filter, CheckCircle, XCircle, Mail, Calendar, UserCheck, DollarSign, TrendingUp, Clock, ArrowUpDown as ArrowUpDownIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog"
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

interface Transfer {
  uid: string;
  reference: string;
  sender: number;
  sender_name: string;
  sender_email: string;
  receiver: number;
  receiver_name: string;
  receiver_email: string;
  amount: string;
  fees: string;
  status: string;
  description: string;
  sender_balance_before: string;
  sender_balance_after: string;
  receiver_balance_before: string;
  receiver_balance_after: string;
  completed_at: string;
  failed_reason: string;
  created_at: string;
  updated_at: string;
}

interface TransferStats {
  global_stats: {
    total_transfers: number;
    completed_transfers: number;
    failed_transfers: number;
    pending_transfers: number;
    total_amount: number;
    total_fees: number;
    average_amount: number;
  };
  top_senders: Array<{
    sender__uid: string;
    sender__email: string;
    sender__first_name: string;
    sender__last_name: string;
    transfer_count: number;
    total_sent: number;
    sender_name: string;
  }>;
  top_receivers: Array<{
    receiver__uid: string;
    receiver__email: string;
    receiver__first_name: string;
    receiver__last_name: string;
    transfer_count: number;
    total_received: number;
    receiver_name: string;
  }>;
}

function PartnerTransfersPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateUrl({ page })
  }

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all")
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1)
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sortField, setSortField] = useState<"amount" | "created_at" | "status" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [stats, setStats] = useState<TransferStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const { t } = useLanguage()
  const itemsPerPage = 20
  const baseUrl = getApiBaseUrl()
  const { toast } = useToast()
  const apiFetch = useApi();
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailTransfer, setDetailTransfer] = useState<Transfer | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState("")

  // Fetch transfers from API
  useEffect(() => {
    const fetchTransfers = async () => {
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
        if (startDate) {
          params.append("created_at__gte", startDate)
        }
        if (endDate) {
          params.append("created_at__lt", endDate)
        }
        const orderingParam = sortField
          ? `&ordering=${(sortDirection === "asc" ? "+" : "-")}${sortField}`
          : ""
        const endpoint = `payments/betting/admin/partner-transfers/?${params.toString()}${orderingParam}`
        const data = await apiFetch(endpoint)
        setTransfers(data.results || [])
        setTotalCount(data.count || 0)
        setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        setTransfers([])
        setTotalCount(0)
        setTotalPages(1)
        toast({ title: "Erreur", description: errorMessage, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchTransfers()
  }, [searchTerm, currentPage, itemsPerPage, baseUrl, statusFilter, sortField, sortDirection, startDate, endDate, t, toast, apiFetch])

  // Fetch statistics
  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true)
      try {
        const params = new URLSearchParams()
        if (startDate) {
          params.append("created_at__gte", startDate)
        }
        if (endDate) {
          params.append("created_at__lt", endDate)
        }
        const endpoint = `payments/betting/admin/partner-transfers/statistics/?${params.toString()}`
        const data = await apiFetch(endpoint)
        setStats(data)
      } catch (err: any) {
        console.error("Failed to fetch stats:", err)
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  }, [startDate, endDate, baseUrl, apiFetch])

  const startIndex = (currentPage - 1) * itemsPerPage

  const handleSort = (field: "amount" | "created_at" | "status") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Fetch transfer details
  const handleOpenDetail = async (transfer: Transfer) => {
    setDetailModalOpen(true)
    setDetailLoading(true)
    setDetailError("")
    setDetailTransfer(null)
    try {
      setDetailTransfer(transfer)
    } catch (err: any) {
      setDetailError(extractErrorMessages(err))
      toast({ title: "Erreur", description: extractErrorMessages(err), variant: "destructive" })
    } finally {
      setDetailLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-3 w-3" />
              <span>Terminé</span>
            </div>
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>En attente</span>
            </div>
          </Badge>
        )
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
            <div className="flex items-center space-x-1">
              <XCircle className="h-3 w-3" />
              <span>Échec</span>
            </div>
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-boxdark-2/20 dark:text-bodydark">
            <span>{status}</span>
          </Badge>
        )
    }
  }

  return (
    <div className="min-h-screen bg-whiten dark:bg-boxdark-2">
      <div className="w-full">

        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
            <div>
              <h1 className="text-base font-bold sm:text-lg sm:text-2xl bg-gradient-to-r from-primary to-meta-3 bg-clip-text text-transparent">
                Gestion des Transferts Partenaires
              </h1>
              <p className="text-body dark:text-bodydark mt-2 text-lg">
                Surveiller et gérer les transferts entre partenaires
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="bg-white dark:bg-boxdark rounded-lg px-4 py-2 shadow-sm">
                <div className="flex items-center space-x-2">
                  <ArrowUpDownIcon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-gray-700 dark:text-bodydark">
                    {totalCount} transferts
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
            <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <ArrowUpDownIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-body dark:text-bodydark2">Total transferts</p>
                    <p className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
                      {stats.global_stats.total_transfers}
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
                    <p className="text-sm font-medium text-body dark:text-bodydark2">Terminés</p>
                    <p className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
                      {stats.global_stats.completed_transfers}
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
                    <p className="text-sm font-medium text-body dark:text-bodydark2">Montant total</p>
                    <p className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
                      {stats.global_stats.total_amount.toFixed(2)} FCFA
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
                    <p className="text-sm font-medium text-body dark:text-bodydark2">Moyenne</p>
                    <p className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
                      {stats.global_stats.average_amount.toFixed(2)} FCFA
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-bodydark2" />
                <Input
                  placeholder="Rechercher des transferts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="failed">Échec</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select
                value={sortField || ""}
                onValueChange={(value) => setSortField(value as "amount" | "created_at" | "status" | null)}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount">Montant</SelectItem>
                  <SelectItem value="created_at">Date</SelectItem>
                  <SelectItem value="status">Statut</SelectItem>
                </SelectContent>
              </Select>

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
          </CardContent>
        </Card>

        {/* Transfers Table */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <CardHeader className="border-b border-gray-100 dark:border-strokedark">
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-meta-2 dark:bg-orange-900 rounded-lg">
                <ArrowUpDownIcon className="h-5 w-5 text-primary dark:text-secondary" />
              </div>
              <span>Liste des transferts</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-6 sm:py-10">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-body dark:text-bodydark">Chargement des transferts...</span>
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
                      <TableHead className="font-semibold">Expéditeur</TableHead>
                      <TableHead className="font-semibold">Destinataire</TableHead>
                      <TableHead className="font-semibold">Montant</TableHead>
                      <TableHead className="font-semibold">Statut</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfers.map((transfer) => (
                      <TableRow key={transfer.uid} className="hover:bg-gray-50 dark:hover:bg-boxdark-2/50">
                        <TableCell data-label="Référence">
                          <div className="flex items-center space-x-2">
                            <Copy className="h-4 w-4 text-bodydark2" />
                            <span className="text-sm font-mono text-gray-700 dark:text-bodydark">
                              {transfer.reference}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell data-label="Expéditeur">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary to-meta-3 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                              {transfer.sender_name?.charAt(0)?.toUpperCase() || 'S'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                {transfer.sender_name}
                              </div>
                              <div className="text-xs text-body dark:text-bodydark2">
                                {transfer.sender_email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-label="Destinataire">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            {/* <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                              {transfer.receiver_name?.charAt(0)?.toUpperCase() || 'R'}
                            </div> */}
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                {transfer.receiver_name}
                              </div>
                              <div className="text-xs text-body dark:text-bodydark2">
                                {transfer.receiver_email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-label="Montant">
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4 text-bodydark2" />
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {parseFloat(transfer.amount).toFixed(2)} FCFA
                            </span>
                          </div>
                        </TableCell>
                        <TableCell data-label="Statut">
                          {getStatusBadge(transfer.status)}
                        </TableCell>
                        <TableCell data-label="Date">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-bodydark2" />
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-700 dark:text-bodydark font-medium">
                                {transfer.created_at
                                  ? new Date(transfer.created_at).toLocaleDateString()
                                  : 'Inconnu'
                                }
                              </span>
                              {transfer.created_at && (
                                <span className="text-xs text-body dark:text-bodydark2">
                                  {new Date(transfer.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-label="Actions">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDetail(transfer)}
                            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900/30"
                          >
                            Voir détails
                          </Button>
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
        {!loading && !error && transfers.length === 0 && (
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mt-6">
            <CardContent className="p-12 text-center">
              <ArrowUpDownIcon className="h-12 w-12 text-bodydark2 mx-auto mb-4" />
              <h3 className="text-sm font-medium sm:text-base text-gray-900 dark:text-gray-100 mb-2">
                Aucun transfert trouvé
              </h3>
              <p className="text-body dark:text-bodydark2 mb-4">
                {searchTerm ? `Aucun transfert ne correspond à "${searchTerm}"` : "Aucun transfert n'a encore été effectué."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Detail Modal */}
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <ArrowUpDownIcon className="h-5 w-5 text-primary" />
                <span>Détails du transfert</span>
              </DialogTitle>
            </DialogHeader>
            {detailLoading ? (
              <div className="flex items-center justify-center py-4 sm:py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : detailError ? (
              <ErrorDisplay error={detailError} />
            ) : detailTransfer ? (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-body dark:text-bodydark2">Référence</label>
                    <div className="flex items-center space-x-2 bg-gray-100 dark:bg-meta-4 p-2 rounded">
                      <p className="text-sm font-mono text-gray-900 dark:text-gray-100 flex-1">
                        {detailTransfer.reference}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
                        onClick={() => {
                          navigator.clipboard.writeText(detailTransfer.reference);
                          toast({
                            title: "Copié",
                            description: "Référence copiée dans le presse-papiers",
                          });
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-body dark:text-bodydark2">Statut</label>
                    <div className="mt-1">
                      {getStatusBadge(detailTransfer.status)}
                    </div>
                  </div>
                </div>

                {/* Amount Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                  <div>
                    <label className="text-sm font-medium text-body dark:text-bodydark2">Montant</label>
                    <p className="text-lg font-semibold text-meta-3">
                      {parseFloat(detailTransfer.amount).toFixed(2)} FCFA
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-body dark:text-bodydark2">Frais</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {parseFloat(detailTransfer.fees).toFixed(2)} FCFA
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-body dark:text-bodydark2">Description</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {detailTransfer.description || 'Aucune description'}
                    </p>
                  </div>
                </div>

                {/* Sender Information */}
                <div className="bg-gray dark:bg-orange-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-800 dark:text-secondary mb-3">Expéditeur</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-body dark:text-bodydark2">Nom</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {detailTransfer.sender_name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-body dark:text-bodydark2">Email</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {detailTransfer.sender_email}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-body dark:text-bodydark2">Solde avant</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {parseFloat(detailTransfer.sender_balance_before).toFixed(2)} FCFA
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-body dark:text-bodydark2">Solde après</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {parseFloat(detailTransfer.sender_balance_after).toFixed(2)} FCFA
                      </p>
                    </div>
                  </div>
                </div>

                {/* Receiver Information */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-3">Destinataire</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-body dark:text-bodydark2">Nom</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {detailTransfer.receiver_name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-body dark:text-bodydark2">Email</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {detailTransfer.receiver_email}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-body dark:text-bodydark2">Solde avant</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {parseFloat(detailTransfer.receiver_balance_before).toFixed(2)} FCFA
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-body dark:text-bodydark2">Solde après</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {parseFloat(detailTransfer.receiver_balance_after).toFixed(2)} FCFA
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                  <div>
                    <label className="text-sm font-medium text-body dark:text-bodydark2">Créé le</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {detailTransfer.created_at
                        ? new Date(detailTransfer.created_at).toLocaleString()
                        : 'Non disponible'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-body dark:text-bodydark2">Terminé le</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {detailTransfer.completed_at
                        ? new Date(detailTransfer.completed_at).toLocaleString()
                        : 'Non terminé'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-body dark:text-bodydark2">Mis à jour le</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {detailTransfer.updated_at
                        ? new Date(detailTransfer.updated_at).toLocaleString()
                        : 'Non disponible'
                      }
                    </p>
                  </div>
                </div>

                {/* Failed Reason */}
                {detailTransfer.failed_reason && (
                  <div>
                    <label className="text-sm font-medium text-body dark:text-bodydark2">Raison de l'échec</label>
                    <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded border">
                      {detailTransfer.failed_reason}
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}


import { Suspense } from 'react'
import { getApiBaseUrl } from "@/lib/env-config"

export default function PartnerTransfersPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <PartnerTransfersPageContent />
    </Suspense>
  )
}
