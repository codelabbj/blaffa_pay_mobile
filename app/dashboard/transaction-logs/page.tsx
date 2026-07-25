"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, FileText, Filter, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { Badge } from "@/components/ui/badge"
import { DateRangeFilter } from "@/components/ui/date-range-filter"




const baseUrl = getApiBaseUrl()

// Colors for consistent theming
const COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981', 
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F97316',
  success: '#22C55E',
  info: '#06B6D4',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1'
};

function TransactionLogsListPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "")
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [sortField, setSortField] = useState<string | null>(searchParams.get("sort_field") || null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">((searchParams.get("sort_dir") as any) || "desc")
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1)
  const [pageSize, setPageSize] = useState(10)
  const [startDate, setStartDate] = useState<string | null>(searchParams.get("start_date"))
  const [endDate, setEndDate] = useState<string | null>(searchParams.get("end_date"))

  const [logs, setLogs] = useState<any[]>([])
  const [count, setCount] = useState(0)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize])

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

  const handleSearchSubmit = () => {
    const trimmed = searchInput.trim()
    setSearchTerm(trimmed)
    setCurrentPage(1)
    updateUrl({ search: trimmed, page: 1 })
  }

  const handleDateChange = (start: string | null, end: string | null) => {
    setStartDate(start)
    setEndDate(end)
    setCurrentPage(1)
    updateUrl({ start_date: start, end_date: end, page: 1 })
  }

  const handleSortChange = (field: string) => {
    const newDir = sortField === field ? (sortDirection === "desc" ? "asc" : "desc") : "desc"
    setSortField(field)
    setSortDirection(newDir)
    setCurrentPage(1)
    updateUrl({ sort_field: field, sort_dir: newDir, page: 1 })
  }

  const handleSort = (field: string) => {
    handleSortChange(field)
  }

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      setError("")
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          page_size: pageSize.toString(),
        })
        if (searchTerm) params.append("search", searchTerm)
        if (sortField) params.append("ordering", `${sortDirection === "asc" ? "+" : "-"}${sortField}`)
        if (startDate) params.append("created_at__gte", startDate)
        if (endDate) params.append("created_at__lte", endDate)

        const endpoint = `payments/transaction-logs/?${params.toString()}`
        const data = await apiFetch(endpoint)

        // API shape example from user: { count, next, previous, results: [] }
        setLogs(Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [])
        setCount(typeof data?.count === "number" ? data.count : (Array.isArray(data?.results) ? data.results.length : 0))

        toast({
          title: t("transactionLogs.success") || "Succès",
          description: t("transactionLogs.loadedSuccessfully") || "Journaux de transaction chargés avec succès",
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("transactionLogs.failedToLoad") || "Échec du chargement des journaux de transaction"
        setError(errorMessage)
        setLogs([])
        setCount(0)
        toast({
          title: t("transactionLogs.failedToLoad") || "Échec du chargement",
          description: errorMessage,
          variant: "destructive",
        })
        console.error("Transaction logs fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [apiFetch, currentPage, pageSize, searchTerm, sortField, sortDirection, startDate, endDate, t])

    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:bg-boxdark-2">
      <div className="w-full">
        
        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
            <div>
              <h1 className="text-base font-bold sm:text-lg sm:text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t("transactionLogs.list") || "Transaction Logs"}
              </h1>
              <p className="text-body dark:text-bodydark mt-2 text-lg">
                Surveiller l'activité des transactions et les journaux système
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="bg-white dark:bg-boxdark rounded-lg px-4 py-2 shadow-sm">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-bodydark">
                    {count} journaux
                  </span>
                </div>
              </div>
            </div>
          </div>
      </div>

        {/* Search and Filters */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-bodydark2" />
            <Input
                  placeholder="Rechercher dans les journaux de transaction..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearchSubmit()}
                  className="pl-10 bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                />
              </div>
            <Button
              onClick={handleSearchSubmit}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
                Rechercher
            </Button>
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={(start) => handleDateChange(start, endDate)}
              onEndDateChange={(end) => handleDateChange(startDate, end)}
              onClear={() => handleDateChange(null, null)}
              placeholder="Filtrer par date"
              className="w-full sm:w-auto"
            />
          </div>
          </CardContent>
        </Card>

        {/* Transaction Logs Table */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <CardHeader className="border-b border-gray-100 dark:border-strokedark">
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <FileText className="h-5 w-5 text-meta-3 dark:text-green-300" />
              </div>
              <span>Journaux de transaction</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-6 sm:py-10">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-body dark:text-bodydark">Chargement des journaux de transaction...</span>
                </div>
              </div>
            ) : error ? (
              <div className="p-3 sm:p-4 md:p-6 text-center">
                <ErrorDisplay error={error} onRetry={() => {/* retry function */}} />
        </div>
            ) : (
              <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-boxdark-2/50">
                      <TableHead className="font-semibold">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort("created_at")}
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                        >
                          Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                      <TableHead className="font-semibold">ID de transaction</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Statut</TableHead>
                      <TableHead className="font-semibold">Montant</TableHead>
                      <TableHead className="font-semibold">Utilisateur</TableHead>
                      <TableHead className="font-semibold">Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id || log.uid} className="hover:bg-gray-50 dark:hover:bg-boxdark-2/50">
                        <TableCell data-label="Date">
                          <div className="text-sm text-body dark:text-bodydark2">
                            {log.created_at 
                              ? new Date(log.created_at).toLocaleString()
                              : 'Inconnu'
                            }
                          </div>
                        </TableCell>
                        <TableCell data-label="ID de transaction">
                          <Badge variant="outline" className="font-mono text-xs">
                            {log.transaction_id || log.id || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell data-label="Type">
                          <Badge 
                            className={
                              log.transaction_type === 'deposit'
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                : log.transaction_type === 'withdrawal'
                                ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                            }
                          >
                            {log.transaction_type || 'Inconnu'}
                          </Badge>
                        </TableCell>
                        <TableCell data-label="Statut">
                          <Badge 
                            className={
                              log.status === 'success' || log.status === 'completed'
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                : log.status === 'failed' || log.status === 'error'
                                ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                            }
                          >
                            <div className="flex items-center space-x-1">
                              {log.status === 'success' || log.status === 'completed' ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : log.status === 'failed' || log.status === 'error' ? (
                                <XCircle className="h-3 w-3" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                              <span>{log.status || 'Inconnu'}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell data-label="Montant">
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4 text-bodydark2" />
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {log.amount ? parseFloat(log.amount).toFixed(2) : '0.00'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell data-label="Utilisateur">
                          <div className="text-sm text-gray-700 dark:text-bodydark">
                            {log.user_name || log.user_id || 'Inconnu'}
                          </div>
                        </TableCell>
                      <TableCell data-label="Détails">
                          <div className="max-w-xs">
                            <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                              {log.message || log.description || 'Aucun détail'}
                            </div>
                            {log.error_message && (
                              <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                                Erreur : {log.error_message}
                              </div>
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
              Affichage de {((currentPage - 1) * pageSize) + 1} à {Math.min(currentPage * pageSize, count)} sur {count} résultats
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
        {!loading && !error && logs.length === 0 && (
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mt-6">
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-bodydark2 mx-auto mb-4" />
              <h3 className="text-sm font-medium sm:text-base text-gray-900 dark:text-gray-100 mb-2">
                Aucun journal de transaction trouvé
              </h3>
              <p className="text-body dark:text-bodydark2 mb-4">
                {searchTerm ? `Aucun journal de transaction ne correspond à "${searchTerm}"` : "Aucun journal de transaction n'a encore été enregistré."}
              </p>
      </CardContent>
    </Card>
        )}

      </div>
    </div>
  )
}


import { Suspense } from 'react'
import { getApiBaseUrl } from "@/lib/env-config"

export default function TransactionLogsListPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <TransactionLogsListPageContent />
    </Suspense>
  )
}
