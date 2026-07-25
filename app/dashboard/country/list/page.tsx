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
import { Search, ArrowUpDown, Globe, Plus, Filter, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { Badge } from "@/components/ui/badge"
import { Pencil } from "lucide-react"
import { DateRangeFilter } from "@/components/ui/date-range-filter"
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

export default function CountryListPage() {
  const [countries, setCountries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortField, setSortField] = useState<"nom" | "code" | null>(null)
  const [sortDirection, setSortDirection] = useState<"+" | "-">("-")
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast();

  useEffect(() => {
    const fetchCountries = async () => {
      setLoading(true)
      setError("")
      try {
        let endpoint = "";
        if (searchTerm.trim() !== "" || statusFilter !== "all" || sortField || startDate || endDate) {
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
          if (sortField) {
            params.append("ordering", `${sortDirection === "+" ? "+" : "-"}${sortField}`);
          }
          if (startDate) {
            params.append("created_at__gte", startDate);
          }
          if (endDate) {
            params.append("created_at__lte", endDate);
          }
          // Keep '+' literal for ordering (avoid %2B)
          let query = params.toString().replace(/ordering=%2B/g, "ordering=+");
          endpoint = `payments/countries/?${query}`;
        } else {
          const params = new URLSearchParams({
            page: "1",
            page_size: "100",
          });
          endpoint = `payments/countries/?${params.toString()}`;
        }
        const data = await apiFetch(endpoint)
        setCountries(Array.isArray(data) ? data : data.results || [])
        toast({
          title: t("country.success"),
          description: t("country.loadedSuccessfully"),
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("country.failedToLoad")
        setError(errorMessage)
        setCountries([])
        toast({
          title: t("country.failedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
        console.error('Countries fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCountries()
  }, [searchTerm, statusFilter, sortField, sortDirection, startDate, endDate])

  // Remove client-side filtering since it's now handled by the API
  const filteredCountries = countries

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-base font-bold sm:text-lg sm:text-2xl bg-gradient-to-r from-primary to-meta-3 bg-clip-text text-transparent">
                {t("country.list")}
              </h1>
              <p className="text-body dark:text-bodydark mt-2 text-sm sm:text-base lg:text-lg">
                Gérer les pays et régions pris en charge
              </p>
            </div>
            <div className="flex items-center space-x-2 sm:gap-2 sm:gap-4">
              <div className="bg-white dark:bg-boxdark rounded-lg px-3 sm:px-4 py-2 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-bodydark">
                    {countries.length} pays
                  </span>
                </div>
              </div>
              <Link href="/dashboard/country/create">
                <Button className="bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white text-xs sm:text-sm">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{t("country.add")}</span>
                  <span className="sm:hidden">Ajouter</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
          <CardContent className="p-4 sm:p-3 sm:p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-bodydark2" />
            <Input
                  placeholder="Rechercher des pays..."
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
                  <SelectItem value="all">Tous les pays</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
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

        {/* Countries Table */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <CardHeader className="border-b border-gray-100 dark:border-strokedark">
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Globe className="h-5 w-5 text-meta-3 dark:text-green-300" />
              </div>
              <span>Liste des pays</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
        {loading ? (
              <div className="flex items-center justify-center py-6 sm:py-10">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-body dark:text-bodydark">Chargement des pays...</span>
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
                      <TableHead className="font-semibold text-xs sm:text-sm">Nom du pays</TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm">Code</TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm">Statut</TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                    {filteredCountries.map((country) => (
                      <TableRow key={country.id} className="hover:bg-gray-50 dark:hover:bg-boxdark-2/50">
                        <TableCell data-label="Nom du pays">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-meta-3 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                              {country.nom?.charAt(0)?.toUpperCase() || 'C'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                                {country.nom}
                              </div>
                              {country.description && (
                                <div className="text-xs sm:text-sm text-body dark:text-bodydark2">
                                  {country.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-label="Code">
                          <Badge variant="outline" className="font-mono text-xs sm:text-sm">
                            {country.code}
                          </Badge>
                        </TableCell>
                        <TableCell data-label="Statut">
                          <Badge 
                            className={
                              country.is_active 
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" 
                                : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                            }
                          >
                            <div className="flex items-center space-x-1">
                              {country.is_active ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              <span>{country.is_active ? 'Actif' : 'Inactif'}</span>
                            </div>
                          </Badge>
                        </TableCell>
                  <TableCell data-label="Actions">
                          <div className="flex items-center space-x-2">
                            <Link href={`/dashboard/country/edit/${country.uid}`}>
                              <Button variant="outline" size="sm">
                                <Pencil className="h-4 w-4 mr-1" />
                                Modifier
                              </Button>
                            </Link>
                            {/* <Button 
                              variant="outline" 
                              size="sm"
                              className={
                                country.is_active 
                                  ? "text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20" 
                                  : "text-meta-3 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"
                              }
                            >
                              {country.is_active ? 'Désactiver' : 'Activer'}
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
        {!loading && !error && filteredCountries.length === 0 && (
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mt-6">
            <CardContent className="p-12 text-center">
              <Globe className="h-12 w-12 text-bodydark2 mx-auto mb-4" />
              <h3 className="text-sm font-medium sm:text-base text-gray-900 dark:text-gray-100 mb-2">
                Aucun pays trouvé
              </h3>
              <p className="text-body dark:text-bodydark2 mb-4">
                {searchTerm ? `Aucun pays ne correspond à "${searchTerm}"` : "Aucun pays n'a encore été ajouté."}
              </p>
              <Link href="/dashboard/country/create">
                <Button className="bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter le premier pays
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
} 