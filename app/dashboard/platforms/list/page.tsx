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
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Copy, Users, Filter, CheckCircle, XCircle, Mail, Calendar, UserCheck, DollarSign, TrendingUp, Clock, ArrowUpDown as ArrowUpDownIcon, Plus, Edit, Trash2, ToggleLeft, ToggleRight, BarChart3, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { DateRangeFilter } from "@/components/ui/date-range-filter"
import { CopyButton } from "@/components/ui/copy-button"

import Link from "next/link"
import { useRouter, useSearchParams, usePathname } from "next/navigation"




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

interface Platform {
  uid: string;
  name: string;
  external_id: string;
  logo: string | null;
  is_active: boolean;
  min_deposit_amount: string;
  max_deposit_amount: string;
  min_withdrawal_amount: string;
  max_withdrawal_amount: string;
  description: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  active_partners_count: number;
  total_transactions_count: number;
}


function PlatformsListPageContent() {
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
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sortField, setSortField] = useState<"name" | "created_at" | "is_active" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const { t } = useLanguage()
  const itemsPerPage = 20
  const baseUrl = getApiBaseUrl()
  const { toast } = useToast()
  const apiFetch = useApi();
  
  const [toggleLoading, setToggleLoading] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [platformToDelete, setPlatformToDelete] = useState<Platform | null>(null)

  // Fetch platforms from API
  useEffect(() => {
    const fetchPlatforms = async () => {
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
          params.append("is_active", statusFilter === "active" ? "true" : "false")
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
        const endpoint = `payments/betting/admin/platforms/?${params.toString()}${orderingParam}`
        const data = await apiFetch(endpoint)
        setPlatforms(data.results || [])
        setTotalCount(data.count || 0)
        setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        setPlatforms([])
        setTotalCount(0)
        setTotalPages(1)
        toast({ title: "Erreur", description: errorMessage, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchPlatforms()
  }, [searchTerm, currentPage, itemsPerPage, baseUrl, statusFilter, sortField, sortDirection, startDate, endDate, t, toast, apiFetch])

  const startIndex = (currentPage - 1) * itemsPerPage

  const handleSort = (field: "name" | "created_at" | "is_active") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }


  // Toggle platform status
  const handleToggleStatus = async (platform: Platform) => {
    setToggleLoading(platform.uid)
    try {
      const endpoint = `payments/betting/admin/platforms/${platform.uid}/toggle_status/`
      const data = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      // Update the platform in the list
      setPlatforms(prev => prev.map(p =>
        p.uid === platform.uid
          ? { ...p, is_active: data.is_active }
          : p
      ))

      toast({
        title: "Succès",
        description: data.message || `Plateforme ${data.is_active ? 'activée' : 'désactivée'}`
      })
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      toast({ title: "Erreur", description: errorMessage, variant: "destructive" })
    } finally {
      setToggleLoading(null)
    }
  }

  // Delete platform
  const handleDeletePlatform = async () => {
    if (!platformToDelete) return

    setDeleteLoading(platformToDelete.uid)
    try {
      const endpoint = `payments/betting/admin/platforms/${platformToDelete.uid}/`
      await apiFetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        successMessage: `Plateforme "${platformToDelete.name}" supprimée avec succès`
      })

      // Remove the platform from the list
      setPlatforms(prev => prev.filter(p => p.uid !== platformToDelete.uid))
      setTotalCount(prev => prev - 1)

      setDeleteModalOpen(false)
      setPlatformToDelete(null)
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      toast({ title: "Erreur", description: errorMessage, variant: "destructive" })
    } finally {
      setDeleteLoading(null)
    }
  }

  // Open delete confirmation modal
  const openDeleteModal = (platform: Platform) => {
    setPlatformToDelete(platform)
    setDeleteModalOpen(true)
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
  const activePlatforms = platforms.filter(p => p.is_active).length
  const totalPartners = platforms.reduce((sum, platform) => sum + platform.active_partners_count, 0)
  const totalTransactions = platforms.reduce((sum, platform) => sum + platform.total_transactions_count, 0)

  return (
    <div className="min-h-screen bg-whiten dark:bg-boxdark-2">
      <div className="w-full">

        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-base font-bold sm:text-lg sm:text-2xl bg-gradient-to-r from-primary to-meta-3 bg-clip-text text-transparent">
                Gestion des Plateformes de Paris
              </h1>
              <p className="text-body dark:text-bodydark mt-2 text-sm sm:text-base lg:text-lg">
                Gérer les plateformes de paris et leurs configurations
              </p>
            </div>
            <div className="flex items-center space-x-2 sm:gap-2 sm:gap-4">
              <div className="bg-white dark:bg-boxdark rounded-lg px-3 sm:px-4 py-2 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-bodydark">
                    {totalCount} plateformes
                  </span>
                </div>
              </div>
              <Link href="/dashboard/platforms/create">
                <Button className="bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white text-xs sm:text-sm">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Nouvelle Plateforme</span>
                  <span className="sm:hidden">Nouvelle</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <CardContent className="p-4 sm:p-3 sm:p-4 md:p-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-meta-3 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-body dark:text-bodydark2">Plateformes actives</p>
                  <p className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
                    {activePlatforms}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <CardContent className="p-4 sm:p-3 sm:p-4 md:p-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-body dark:text-bodydark2">Partenaires actifs</p>
                  <p className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
                    {totalPartners}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <CardContent className="p-4 sm:p-3 sm:p-4 md:p-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-body dark:text-bodydark2">Transactions totales</p>
                  <p className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
                    {totalTransactions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-bodydark2" />
                <Input
                  placeholder="Rechercher des plateformes..."
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
                onValueChange={(value) => setSortField(value as "name" | "created_at" | "is_active" | null)}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nom</SelectItem>
                  <SelectItem value="created_at">Date</SelectItem>
                  <SelectItem value="is_active">Statut</SelectItem>
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

        {/* Platforms Table */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <CardHeader className="border-b border-gray-100 dark:border-strokedark">
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-meta-2 dark:bg-orange-900 rounded-lg">
                <Users className="h-5 w-5 text-primary dark:text-secondary" />
              </div>
              <span>Liste des plateformes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-6 sm:py-10">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-body dark:text-bodydark">Chargement des plateformes...</span>
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
                      <TableHead className="font-semibold">Plateforme</TableHead>
                      <TableHead className="font-semibold">Limites</TableHead>
                      <TableHead className="font-semibold">Statut</TableHead>
                      <TableHead className="font-semibold">Partenaires</TableHead>
                      <TableHead className="font-semibold">Transactions</TableHead>
                      <TableHead className="font-semibold">Créé le</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {platforms.map((platform) => (
                      <TableRow key={platform.uid} className="hover:bg-gray-50 dark:hover:bg-boxdark-2/50">
                        <TableCell data-label="Plateforme">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <div className="w-12 h-12 overflow-hidden rounded-lg border border-gray-100 dark:border-strokedark bg-white dark:bg-boxdark flex items-center justify-center shadow-sm">
                              {platform.logo ? (
                                <img 
                                  src={platform.logo.startsWith('http') ? platform.logo : `${baseUrl.replace(/\/$/, "")}/${platform.logo.replace(/^\//, "")}`} 
                                  alt={platform.name}
                                  className="object-contain w-full h-full p-1 transition-opacity duration-300"
                                  onLoad={(e) => (e.target as any).style.opacity = '1'}
                                  onError={(e) => {
                                    console.warn(`Failed to load platform logo: ${platform.logo} for ${platform.name}`);
                                    (e.target as any).style.display = 'none';
                                    const parent = (e.target as any).parentElement;
                                    if (parent) {
                                      parent.innerHTML = `<span class="text-white font-semibold">${platform.name?.charAt(0)?.toUpperCase() || 'P'}</span>`;
                                      parent.className = "w-full h-full bg-gradient-to-br from-orange-500 to-green-600 flex items-center justify-center rounded-lg shadow-sm";
                                    }
                                  }}
                                  style={{ opacity: 0 }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary to-meta-3 flex items-center justify-center text-white font-semibold text-lg">
                                  {platform.name?.charAt(0)?.toUpperCase() || 'P'}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900 dark:text-gray-100">{platform.name}</span>
                                <CopyButton value={platform.uid} className="h-4 w-4" iconClassName="h-3 w-3" />
                              </div>

                              <div className="text-sm text-body dark:text-bodydark2">
                                {platform.description}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-label="Limites">
                          <div className="text-sm">
                            <div className="text-body dark:text-bodydark2">
                              Dépôt: {parseFloat(platform.min_deposit_amount).toFixed(0)} - {parseFloat(platform.max_deposit_amount).toFixed(0)} FCFA
                            </div>
                            <div className="text-body dark:text-bodydark2">
                              Retrait: {parseFloat(platform.min_withdrawal_amount).toFixed(0)} - {parseFloat(platform.max_withdrawal_amount).toFixed(0)} FCFA
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-label="Statut">
                          {getStatusBadge(platform.is_active)}
                        </TableCell>
                        <TableCell data-label="Partenaires">
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4 text-bodydark2" />
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {platform.active_partners_count}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell data-label="Transactions">
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="h-4 w-4 text-bodydark2" />
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {platform.total_transactions_count}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell data-label="Créé le">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-bodydark2" />
                            <span className="text-sm text-body dark:text-bodydark2">
                              {platform.created_at
                                ? new Date(platform.created_at).toLocaleDateString()
                                : 'Inconnu'
                              }
                            </span>
                          </div>
                        </TableCell>
                        <TableCell data-label="Actions">
                          <div className="flex items-center space-x-2">
                            <Link href={`/dashboard/platforms/edit/${platform.uid}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-gray text-orange-700 border-stroke hover:bg-meta-2 dark:bg-orange-900/20 dark:text-secondary dark:border-orange-700 dark:hover:bg-orange-900/30"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Modifier
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(platform)}
                              disabled={toggleLoading === platform.uid}
                              className={platform.is_active
                                ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700 dark:hover:bg-red-900/30"
                                : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-900/30"
                              }
                            >
                              {toggleLoading === platform.uid ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                              ) : platform.is_active ? (
                                <ToggleLeft className="h-4 w-4 mr-1" />
                              ) : (
                                <ToggleRight className="h-4 w-4 mr-1" />
                              )}
                              {platform.is_active ? 'Désactiver' : 'Activer'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteModal(platform)}
                              disabled={deleteLoading === platform.uid}
                              className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700 dark:hover:bg-red-900/30"
                            >
                              {deleteLoading === platform.uid ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                              ) : (
                                <Trash2 className="h-4 w-4 mr-1" />
                              )}
                              Supprimer
                            </Button>
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
        {!loading && !error && platforms.length === 0 && (
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mt-6">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-bodydark2 mx-auto mb-4" />
              <h3 className="text-sm font-medium sm:text-base text-gray-900 dark:text-gray-100 mb-2">
                Aucune plateforme trouvée
              </h3>
              <p className="text-body dark:text-bodydark2 mb-4">
                {searchTerm ? `Aucune plateforme ne correspond à "${searchTerm}"` : "Aucune plateforme n'a encore été créée."}
              </p>
              <Link href="/dashboard/platforms/create">
                <Button className="bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une plateforme
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span>Confirmer la suppression</span>
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-body dark:text-bodydark mb-4">
                Êtes-vous sûr de vouloir supprimer la plateforme <strong>"{platformToDelete?.name}"</strong> ?
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>Attention :</strong> Cette action est irréversible. Toutes les données associées à cette plateforme seront supprimées définitivement.
                </p>
              </div>
            </div>
            <DialogFooter className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteModalOpen(false)
                  setPlatformToDelete(null)
                }}
                disabled={deleteLoading !== null}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePlatform}
                disabled={deleteLoading !== null}
                className="flex-1"
              >
                {deleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </>
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

export default function PlatformsListPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <PlatformsListPageContent />
    </Suspense>
  )
}
