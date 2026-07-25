"use client"
import { useEffect, useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, ArrowUpDown, Share2, Plus, Filter, CheckCircle, XCircle, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { Badge } from "@/components/ui/badge"
import { Pencil } from "lucide-react"
import { DateRangeFilter } from "@/components/ui/date-range-filter"
import { CopyButton } from "@/components/ui/copy-button"
import { getApiBaseUrl } from "@/lib/env-config"


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

export default function NetworkListPage() {
  const [networks, setNetworks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [countryFilter, setCountryFilter] = useState("all")
  const [countries, setCountries] = useState<any[]>([])
  const [sortField, setSortField] = useState<"nom" | "code" | null>(null)
  const [sortDirection, setSortDirection] = useState<"+" | "-">("-")
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1)


  useEffect(() => {
    const fetchNetworks = async () => {
      setLoading(true)
      setError("")
      try {
        let endpoint = "";
        if (searchTerm.trim() !== "" || statusFilter !== "all" || countryFilter !== "all" || sortField || startDate || endDate) {
          const params = new URLSearchParams({
            page: "1",
            page_size: "100",
          });
          if (searchTerm.trim() !== "") {
            params.append("search", searchTerm);
          }
          if (statusFilter !== "all") {
            params.append("is_active", statusFilter === "active" ? "true" : "false");
          }
          if (countryFilter !== "all") {
            params.append("country", countryFilter);
          }
          if (sortField) {
            params.append("ordering", `${sortDirection === "+" ? "+" : "-"}${sortField}`);
          }
          if (startDate) {
            params.append("created_at__gte", startDate);
          }
          if (endDate) {
            params.append("created_at__lte", endDate);
          }
          const query = params.toString().replace(/ordering=%2B/g, "ordering=+");
          endpoint = `payments/networks/?${query}`;
        } else {
          const params = new URLSearchParams({
            page: "1",
            page_size: "100",
          });
          endpoint = `payments/networks/?${params.toString()}`;
        }
        const data = await apiFetch(endpoint)
        setNetworks(Array.isArray(data) ? data : data.results || [])
        toast({
          title: t("network.success"),
          description: t("network.loadedSuccessfully"),
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("network.failedToLoad")
        setError(errorMessage)
        setNetworks([])
        toast({
          title: t("network.failedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
        console.error('Networks fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchNetworks()
  }, [searchTerm, statusFilter, countryFilter, sortField, sortDirection, startDate, endDate])

  // Fetch countries for filter
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const data = await apiFetch(`payments/countries/`)
        setCountries(Array.isArray(data) ? data : data.results || [])
        toast({
          title: t("network.countriesLoaded"),
          description: t("network.countriesLoadedSuccessfully"),
        })
      } catch (err: any) {
        console.error('Countries fetch error:', err)
      }
    }
    fetchCountries()
  }, [])

  const filteredNetworks = networks

  const handleSort = (field: "nom" | "code") => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "+" ? "-" : "+"))
      setSortField(field)
    } else {
      setSortField(field)
      setSortDirection("-")
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
                {t("network.list")}
              </h1>
              <p className="text-body dark:text-bodydark mt-2 text-lg">
                Gérer les réseaux de paiement et les fournisseurs
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="bg-white dark:bg-boxdark rounded-lg px-4 py-2 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-gray-700 dark:text-bodydark">
                    {networks.length} réseaux
                  </span>
                </div>
              </div>
              <Link href="/dashboard/network/create">
                <Button className="bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("network.add")}
                </Button>
              </Link>
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
                  placeholder="Rechercher des réseaux..."
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
                  <SelectItem value="all">Tous les réseaux</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>

              {/* Country Filter */}
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
                  <SelectValue placeholder="Filtrer par pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les pays</SelectItem>
                  {countries.map((country) => (
                    <SelectItem
                      key={country.id || country.uid || Math.random()}
                      value={(country.id || country.uid || '').toString()}
                    >
                      {country.nom}
                    </SelectItem>
                  ))}
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
              />

              {/* Sort */}
              <Select
                value={sortField || ""}
                onValueChange={(value) => setSortField(value as "nom" | "code" | null)}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nom">Nom</SelectItem>
                  <SelectItem value="code">Code</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Networks Table */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <CardHeader className="border-b border-gray-100 dark:border-strokedark">
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-meta-2 dark:bg-orange-900 rounded-lg">
                <Share2 className="h-5 w-5 text-primary dark:text-secondary" />
              </div>
              <span>Liste des réseaux</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-6 sm:py-10">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-body dark:text-bodydark">Chargement des réseaux...</span>
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
                      <TableHead className="font-semibold">Nom du réseau</TableHead>
                      <TableHead className="font-semibold">Code</TableHead>
                      <TableHead className="font-semibold">Pays</TableHead>
                      <TableHead className="font-semibold">Statut</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNetworks.map((network) => (
                      <TableRow key={network.id || network.uid} className="hover:bg-gray-50 dark:hover:bg-boxdark-2/50">
                        <TableCell data-label="Nom du réseau">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <div className="w-12 h-12 overflow-hidden rounded-lg border border-gray-100 dark:border-strokedark bg-white dark:bg-boxdark flex items-center justify-center shadow-sm">
                              {network.image ? (
                                <img 
                                  src={network.image.startsWith('http') ? network.image : `${baseUrl.replace(/\/$/, "")}/${network.image.replace(/^\//, "")}`} 
                                  alt={network.nom}
                                  className="object-contain w-full h-full p-1 transition-opacity duration-300"
                                  onLoad={(e) => (e.target as any).style.opacity = '1'}
                                  onError={(e) => {
                                    console.warn(`Failed to load network image: ${network.image} for ${network.nom}`);
                                    (e.target as any).style.display = 'none';
                                    const parent = (e.target as any).parentElement;
                                    if (parent) {
                                      parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-orange-500 to-green-600 flex items-center justify-center text-white font-semibold">${network.nom?.charAt(0)?.toUpperCase() || 'N'}</div>`;
                                    }
                                  }}
                                  style={{ opacity: 0 }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary to-meta-3 flex items-center justify-center text-white font-semibold text-lg">
                                  {network.nom?.charAt(0)?.toUpperCase() || 'N'}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {network.nom}
                              </div>
                              {network.description && (
                                <div className="text-sm text-body dark:text-bodydark2">
                                  {network.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-label="Code">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="font-mono">
                              {network.code}
                            </Badge>
                            <CopyButton value={network.code} className="h-4 w-4" iconClassName="h-3 w-3" />
                          </div>
                        </TableCell>

                        <TableCell data-label="Pays">
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4 text-bodydark2" />
                            <span className="text-sm text-gray-700 dark:text-bodydark">
                              {network.country?.nom || network.country_name || 'Inconnu'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell data-label="Statut">
                          <Badge
                            className={
                              network.is_active
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                            }
                          >
                            <div className="flex items-center space-x-1">
                              {network.is_active ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              <span>{network.is_active ? 'Actif' : 'Inactif'}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell data-label="Actions">
                          <div className="flex items-center space-x-2">
                            <Link href={`/dashboard/network/edit/${network.id || network.uid}`}>
                              <Button variant="outline" size="sm">
                                <Pencil className="h-4 w-4 mr-1" />
                                Modifier
                              </Button>
                            </Link>
                            {/* <Button 
                              variant="outline" 
                              size="sm"
                              className={
                                network.is_active 
                                  ? "text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20" 
                                  : "text-meta-3 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"
                              }
                            >
                              {network.is_active ? 'Désactiver' : 'Activer'}
                            </Button> */}
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

        {/* Empty State */}
        {!loading && !error && filteredNetworks.length === 0 && (
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mt-6">
            <CardContent className="p-12 text-center">
              <Share2 className="h-12 w-12 text-bodydark2 mx-auto mb-4" />
              <h3 className="text-sm font-medium sm:text-base text-gray-900 dark:text-gray-100 mb-2">
                Aucun réseau trouvé
              </h3>
              <p className="text-body dark:text-bodydark2 mb-4">
                {searchTerm ? `Aucun réseau ne correspond à "${searchTerm}"` : "Aucun réseau n'a encore été ajouté."}
              </p>
              <Link href="/dashboard/network/create">
                <Button className="bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter le premier réseau
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
} 