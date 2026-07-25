"use client"

import { useState, useEffect , useCallback} from "react"
import { useApi } from "@/lib/useApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Copy, Users, Filter, CheckCircle, XCircle, Mail, Calendar, UserCheck, DollarSign, TrendingUp, Clock, ArrowUpDown as ArrowUpDownIcon, Plus, Eye, Edit, Trash2, ToggleLeft, ToggleRight, BarChart3, Shield, User, AlertTriangle, RefreshCw, Settings, Key, Globe, Timer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { DateRangeFilter } from "@/components/ui/date-range-filter"
import Link from "next/link"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"




interface Partner {
  user_uid: string;
  display_name: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  permission_summary: {
    total_permissions: number;
    active_permissions: number;
    deposit_permissions: number;
    withdrawal_permissions: number;
  };
  transaction_summary: {
    total_transactions: number;
    successful_transactions: number;
    total_commission: number;
    unpaid_commission: number;
  };
  commission_config?: {
    deposit_commission_rate: number;
    withdrawal_commission_rate: number;
    status?: string;
  };
  platforms_with_permissions?: Array<{
    uid: string;
    platform_name: string;
    platform_external_id: string;
    can_deposit: boolean;
    can_withdraw: boolean;
    is_active: boolean;
    transaction_stats?: {
      total_transactions: number;
      successful_transactions: number;
      total_amount: number;
    };
  }>;
}

function PartnerPermissionsSummaryPageContent() {
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
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1)
  const [partners, setPartners] = useState<Partner[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sortField, setSortField] = useState<"display_name" | "email" | "is_active" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const { t } = useLanguage()
  const itemsPerPage = 20
  const baseUrl = getApiBaseUrl()
  const { toast } = useToast()
  const apiFetch = useApi();
  

  // Fetch partners from API
  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true)
      setError("")
      try {
        const endpoint = `payments/betting/admin/permissions/user_platforms_summary/`
        const data = await apiFetch(endpoint)
        let filteredPartners = data.partners || []
        
        // Apply search filter
        if (searchTerm.trim() !== "") {
          filteredPartners = filteredPartners.filter((partner: Partner) =>
            partner.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            partner.email?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }
        
        // Apply status filter
        if (statusFilter !== "all") {
          filteredPartners = filteredPartners.filter((partner: Partner) =>
            statusFilter === "active" ? partner.is_active : !partner.is_active
          )
        }
        
        // Apply sorting
        if (sortField) {
          filteredPartners.sort((a: Partner, b: Partner) => {
            let aValue = a[sortField as keyof Partner]
            let bValue = b[sortField as keyof Partner]
            
            // Handle undefined values
            if (aValue === undefined) aValue = ""
            if (bValue === undefined) bValue = ""
            
            if (typeof aValue === "string" && typeof bValue === "string") {
              aValue = (aValue || "").toLowerCase()
              bValue = (bValue || "").toLowerCase()
            }
            
            if (sortDirection === "asc") {
              return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
            } else {
              return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
            }
          })
        }
        
        setTotalCount(filteredPartners.length)
        setTotalPages(Math.ceil(filteredPartners.length / itemsPerPage))
        
        // Apply pagination
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        setPartners(filteredPartners.slice(startIndex, endIndex))
        
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        setPartners([])
        setTotalCount(0)
        setTotalPages(1)
        toast({ title: "Erreur", description: errorMessage, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchPartners()
  }, [searchTerm, currentPage, itemsPerPage, baseUrl, statusFilter, sortField, sortDirection, t, toast, apiFetch])

  const startIndex = (currentPage - 1) * itemsPerPage

  const handleSort = (field: "display_name" | "email" | "is_active") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }


  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-3 w-3" />
            <span>Actif</span>
          </div>
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
          <div className="flex items-center space-x-1">
            <XCircle className="h-3 w-3" />
            <span>Inactif</span>
          </div>
        </Badge>
      )
    }
  }

  // Calculate summary stats
  const activePartners = partners.filter(p => p.is_active).length
  const totalPermissions = partners.reduce((sum, p) => sum + p.permission_summary.total_permissions, 0)
  const totalTransactions = partners.reduce((sum, p) => sum + p.transaction_summary.total_transactions, 0)
  const totalCommissions = partners.reduce((sum, p) => sum + p.transaction_summary.total_commission, 0)

  return (
    <div className="min-h-screen bg-whiten dark:bg-boxdark-2">
      <div className="w-full">
        
        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
            <div>
              <h1 className="text-base font-bold sm:text-lg sm:text-2xl bg-gradient-to-r from-primary to-meta-3 bg-clip-text text-transparent">
                Résumé Permissions Partenaires
              </h1>
              <p className="text-body dark:text-bodydark mt-2 text-lg">
                Vue d'ensemble des permissions et transactions des partenaires
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="bg-white dark:bg-boxdark rounded-lg px-4 py-2 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-gray-700 dark:text-bodydark">
                    {totalCount} partenaires
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
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-body dark:text-bodydark2">Partenaires actifs</p>
                  <p className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
                    {activePartners}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Shield className="h-6 w-6 text-meta-3 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-body dark:text-bodydark2">Total permissions</p>
                  <p className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
                    {totalPermissions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-3 bg-meta-2 dark:bg-orange-900 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-primary dark:text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-body dark:text-bodydark2">Total transactions</p>
                  <p className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
                    {totalTransactions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-body dark:text-bodydark2">Commissions totales</p>
                  <p className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
                    {totalCommissions.toFixed(2)} FCFA
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-bodydark2" />
                <Input
                  placeholder="Rechercher des partenaires..."
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
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select 
                value={sortField || ""} 
                onValueChange={(value) => setSortField(value as "display_name" | "email" | "is_active" | null)}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="display_name">Nom</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="is_active">Statut</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Partners Table */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <CardHeader className="border-b border-gray-100 dark:border-strokedark">
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-meta-2 dark:bg-orange-900 rounded-lg">
                <Users className="h-5 w-5 text-primary dark:text-secondary" />
              </div>
              <span>Liste des partenaires</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-6 sm:py-10">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-body dark:text-bodydark">Chargement des partenaires...</span>
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
                      <TableHead className="font-semibold">Partenaire</TableHead>
                      <TableHead className="font-semibold">E-mail</TableHead>
                      <TableHead className="font-semibold">Statut</TableHead>
                      <TableHead className="font-semibold">Permissions</TableHead>
                      <TableHead className="font-semibold">Transactions</TableHead>
                      <TableHead className="font-semibold">Commissions</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partners.map((partner) => (
                      <TableRow key={partner.user_uid} className="hover:bg-gray-50 dark:hover:bg-boxdark-2/50">
                        <TableCell data-label="Partenaire">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-meta-3 rounded-full flex items-center justify-center text-white font-semibold">
                              {partner.display_name?.charAt(0)?.toUpperCase() || 'P'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {partner.display_name}
                              </div>
                              <div className="text-sm text-body dark:text-bodydark2">
                                {partner.first_name} {partner.last_name}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-label="E-mail">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-bodydark2" />
                            <span className="text-sm text-gray-700 dark:text-bodydark">
                              {partner.email || 'Aucun e-mail'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell data-label="Statut">
                          {getStatusBadge(partner.is_active)}
                        </TableCell>
                        <TableCell data-label="Permissions">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Shield className="h-3 w-3 text-bodydark2" />
                              <span className="text-sm text-body dark:text-bodydark2">
                                Total: {partner.permission_summary.total_permissions}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-3 w-3 text-meta-3" />
                              <span className="text-sm text-body dark:text-bodydark2">
                                Actives: {partner.permission_summary.active_permissions}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-label="Transactions">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <BarChart3 className="h-3 w-3 text-bodydark2" />
                              <span className="text-sm text-body dark:text-bodydark2">
                                Total: {partner.transaction_summary.total_transactions}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-3 w-3 text-meta-3" />
                              <span className="text-sm text-body dark:text-bodydark2">
                                Réussies: {partner.transaction_summary.successful_transactions}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-label="Commissions">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-3 w-3 text-bodydark2" />
                              <span className="text-sm text-body dark:text-bodydark2">
                                Total: {partner.transaction_summary.total_commission.toFixed(2)} FCFA
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="h-3 w-3 text-primary" />
                              <span className="text-sm text-body dark:text-bodydark2">
                                Impayées: {partner.transaction_summary.unpaid_commission.toFixed(2)} FCFA
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-label="Actions">
                          <div className="flex items-center space-x-2">
                            <Link href={`/dashboard/partner-permissions-summary/${partner.user_uid}`}>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900/30"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Détails
                              </Button>
                            </Link>
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
        {!loading && !error && partners.length === 0 && (
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mt-6">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-bodydark2 mx-auto mb-4" />
              <h3 className="text-sm font-medium sm:text-base text-gray-900 dark:text-gray-100 mb-2">
                Aucun partenaire trouvé
              </h3>
              <p className="text-body dark:text-bodydark2 mb-4">
                {searchTerm ? `Aucun partenaire ne correspond à "${searchTerm}"` : "Aucun partenaire n'a encore été enregistré."}
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

export default function PartnerPermissionsSummaryPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <PartnerPermissionsSummaryPageContent />
    </Suspense>
  )
}
