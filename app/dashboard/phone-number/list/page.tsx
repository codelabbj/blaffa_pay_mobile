"use client"
import { useEffect, useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, ArrowUpDown, Phone, Filter, CheckCircle, XCircle, Globe, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
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

export default function PhoneNumberListPage() {
  const [numbers, setNumbers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [networkFilter, setNetworkFilter] = useState("all")
  const [networks, setNetworks] = useState<any[]>([])
  const [sortField, setSortField] = useState<"phone_number" | "network" | null>(null)
  const [sortDirection, setSortDirection] = useState<"+" | "-">("-")
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchPhoneNumbers = async () => {
      setLoading(true)
      setError("")
      try {
        let endpoint = "";
        if (searchTerm.trim() !== "" || networkFilter !== "all" || sortField || startDate || endDate) {
          const params = new URLSearchParams({
            page: "1",
            page_size: "100",
          });
          if (searchTerm.trim() !== "") {
            params.append("search", searchTerm);
          }
          if (networkFilter !== "all") {
            params.append("network", networkFilter);
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
          endpoint = `payments/numeros/?${query}`;
        } else {
          const params = new URLSearchParams({
            page: "1",
            page_size: "100",
          });
          endpoint = `payments/numeros/?${params.toString()}`;
        }
        const data = await apiFetch(endpoint)
        setNumbers(Array.isArray(data) ? data : data.results || [])
        toast({
          title: t("phoneNumbers.success"),
          description: t("phoneNumbers.loadedSuccessfully"),
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("phoneNumbers.failedToLoad")
        setError(errorMessage)
        setNumbers([])
        toast({
          title: t("phoneNumbers.failedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
        console.error('Phone numbers fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPhoneNumbers()
  }, [searchTerm, networkFilter, sortField, sortDirection, startDate, endDate])

  // Fetch networks for filter
  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const data = await apiFetch(`payments/networks/`)
        setNetworks(Array.isArray(data) ? data : data.results || [])
        toast({
          title: t("phoneNumbers.networksLoaded"),
          description: t("phoneNumbers.networksLoadedSuccessfully"),
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("phoneNumbers.failedToLoadNetworks")
        console.error('Networks fetch error:', err)
        setNetworks([])
        toast({
          title: t("phoneNumbers.networksFailedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
    fetchNetworks()
  }, [])

  const filteredNumbers = numbers

  const handleSort = (field: "phone_number" | "network") => {
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
                {t("phoneNumbers.list") || "Phone Numbers"}
              </h1>
              <p className="text-body dark:text-bodydark mt-2 text-lg">
                Gérer les numéros de téléphone et leurs associations de réseau
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="bg-white dark:bg-boxdark rounded-lg px-4 py-2 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Phone className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-gray-700 dark:text-bodydark">
                    {numbers.length} numéros
                  </span>
                </div>
              </div>
              {/* <Link href="/dashboard/phone-number/create">
                <Button className="bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un numéro
                </Button>
              </Link> */}
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-bodydark2" />
            <Input
                  placeholder="Rechercher des numéros de téléphone..."
              value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
            />
          </div>

              {/* Network Filter */}
          <Select value={networkFilter} onValueChange={setNetworkFilter}>
                <SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
                  <SelectValue placeholder="Filtrer par réseau" />
            </SelectTrigger>
            <SelectContent>
                  <SelectItem value="all">Tous les réseaux</SelectItem>
                  {networks.map((network) => (
                    <SelectItem key={network.id || network.uid} value={network.id || network.uid}>
                  {network.nom}
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
                onValueChange={(value) => setSortField(value as "phone_number" | "network" | null)}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone_number">Numéro de téléphone</SelectItem>
                  <SelectItem value="network">Réseau</SelectItem>
                </SelectContent>
              </Select>
        </div>
          </CardContent>
        </Card>

        {/* Phone Numbers Table */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <CardHeader className="border-b border-gray-100 dark:border-strokedark">
            <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-meta-2 dark:bg-orange-900 rounded-lg">
                  <Phone className="h-5 w-5 text-primary dark:text-secondary" />
              </div>
              <span>Liste des numéros de téléphone</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
        {loading ? (
              <div className="flex items-center justify-center py-6 sm:py-10">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-body dark:text-bodydark">Chargement des numéros de téléphone...</span>
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
                      <TableHead className="font-semibold">Numéro de téléphone</TableHead>
                      <TableHead className="font-semibold">Réseau</TableHead>
                      <TableHead className="font-semibold">Pays</TableHead>
                      {/* <TableHead className="font-semibold">Statut</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
                    {filteredNumbers.map((number) => (
                      <TableRow key={number.id || number.uid} className="hover:bg-gray-50 dark:hover:bg-boxdark-2/50">
                        <TableCell data-label="Numéro de téléphone">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-meta-3 rounded-full flex items-center justify-center text-white font-semibold">
                              <Phone className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100 font-mono">
                                {number.phone_number || number.number || 'Inconnu'}
                              </div>
                              <div className="text-sm text-body dark:text-bodydark2">
                                {number.description || 'Aucune description'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-label="Réseau">
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4 text-bodydark2" />
                            <span className="text-sm text-gray-700 dark:text-bodydark">
                              {number.network?.nom || number.network_name || 'Inconnu'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell data-label="Pays">
                          <Badge variant="outline" className="text-xs">
                            {number.country?.nom || number.country_name || 'Inconnu'}
                          </Badge>
                        </TableCell>
                        {/* <TableCell data-label="Statut">
                          <Badge 
                            className={
                              number.is_active 
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" 
                                : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                            }
                          >
                            <div className="flex items-center space-x-1">
                              {number.is_active ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              <span>{number.is_active ? 'Actif' : 'Inactif'}</span>
                            </div>
                          </Badge>
                        </TableCell> */}
                        {/* <TableCell data-label="Actions">
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              Modifier
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className={
                                number.is_active 
                                  ? "text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20" 
                                  : "text-meta-3 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"
                              }
                            >
                              {number.is_active ? 'Désactiver' : 'Activer'}
                            </Button>
                          </div>
                        </TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
              </div>
        )}
      </CardContent>
    </Card>

        {/* Empty State */}
        {!loading && !error && filteredNumbers.length === 0 && (
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mt-6">
            <CardContent className="p-12 text-center">
              <Phone className="h-12 w-12 text-bodydark2 mx-auto mb-4" />
              <h3 className="text-sm font-medium sm:text-base text-gray-900 dark:text-gray-100 mb-2">
                Aucun numéro de téléphone trouvé
              </h3>
              <p className="text-body dark:text-bodydark2 mb-4">
                {searchTerm ? `Aucun numéro de téléphone ne correspond à "${searchTerm}"` : "Aucun numéro de téléphone n'a encore été ajouté."}
              </p>
              <Link href="/dashboard/phone-number/create">
                <Button className="bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter le premier numéro
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
} 