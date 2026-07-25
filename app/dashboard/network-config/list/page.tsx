"use client"
import { useEffect, useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import Link from "next/link"
import { Search, ArrowUpDown, Settings, Filter, CheckCircle, XCircle, Globe, Plus, Pencil } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { DateRangeFilter } from "@/components/ui/date-range-filter"
import { getApiBaseUrl } from "@/lib/env-config"

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

export default function NetworkConfigListPage() {
  const [configs, setConfigs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [networkFilter, setNetworkFilter] = useState("all")
  const [networks, setNetworks] = useState<any[]>([])
  const [sortField, setSortField] = useState<"network_name" | "created_at" | null>(null)
  const [sortDirection, setSortDirection] = useState<"+" | "-">("-")
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchNetworkConfigs = async () => {
      setLoading(true)
      setError("")
      try {
        let endpoint = "";
        if (searchTerm.trim() !== "" || statusFilter !== "all" || networkFilter !== "all" || sortField || startDate || endDate) {
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
          // Keep '+' literal for ordering (avoid %2B)
          const query = params.toString().replace(/ordering=%2B/g, "ordering=+");
          endpoint = `payments/network-configs/?${query}`;
        } else {
          const params = new URLSearchParams({
            page: "1",
            page_size: "100",
          });
          endpoint = `payments/network-configs/?${params.toString()}`;
        }
        const data = await apiFetch(endpoint)
        setConfigs(Array.isArray(data) ? data : data.results || [])
        toast({
          title: t("networkConfig.success"),
          description: t("networkConfig.loadedSuccessfully"),
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("networkConfig.failedToLoad")
        setError(errorMessage)
        setConfigs([])
        toast({
          title: t("networkConfig.failedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
        console.error('Network config fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchNetworkConfigs()
  }, [searchTerm, statusFilter, networkFilter, sortField, sortDirection, startDate, endDate])

  // Fetch networks for filter
  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const data = await apiFetch(`payments/networks/`)
        setNetworks(Array.isArray(data) ? data : data.results || [])
        toast({
          title: t("networkConfig.networksLoaded"),
          description: t("networkConfig.networksLoadedSuccessfully"),
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("networkConfig.failedToLoadNetworks")
        console.error('Networks fetch error:', err)
        setNetworks([])
        toast({
          title: t("networkConfig.networksFailedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
    fetchNetworks()
  }, [])

  const filteredConfigs = configs

  const handleSort = (field: "network_name" | "created_at") => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "+" ? "-" : "+"))
      setSortField(field)
    } else {
      setSortField(field)
      setSortDirection("-")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:bg-boxdark-2">
      <div className="w-full">
        
        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
            <div>
              <h1 className="text-base font-bold sm:text-lg sm:text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t("networkConfig.list") || "Network Configurations"}
              </h1>
              <p className="text-body dark:text-bodydark mt-2 text-lg">
                Gérer les configurations de réseau et les paramètres
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="bg-white dark:bg-boxdark rounded-lg px-4 py-2 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-bodydark">
                    {configs.length} configurations
                  </span>
                </div>
              </div>
        <Link href="/dashboard/network-config/create">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une configuration
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
                  placeholder="Rechercher des configurations..."
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
                  <SelectItem value="all">Toutes les configurations</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
            </SelectContent>
          </Select>

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
                onValueChange={(value) => setSortField(value as "network_name" | "created_at" | null)}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="network_name">Nom du réseau</SelectItem>
                  <SelectItem value="created_at">Date</SelectItem>
                </SelectContent>
              </Select>
        </div>
          </CardContent>
        </Card>

        {/* Network Configs Table */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <CardHeader className="border-b border-gray-100 dark:border-strokedark">
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <Settings className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
              </div>
              <span>Configurations de réseau</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
        {loading ? (
              <div className="flex items-center justify-center py-6 sm:py-10">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-body dark:text-bodydark">Chargement des configurations...</span>
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
                      <TableHead className="font-semibold">Nom de la configuration</TableHead>
                      <TableHead className="font-semibold">Réseau</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Statut</TableHead>
                      <TableHead className="font-semibold">Dernière mise à jour</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                    {filteredConfigs.map((config) => (
                      <TableRow key={config.id || config.uid} className="hover:bg-gray-50 dark:hover:bg-boxdark-2/50">
                  <TableCell data-label="Nom de la configurat">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                              <Settings className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {config.name || config.config_name || 'Configuration sans nom'}
                              </div>
                              <div className="text-sm text-body dark:text-bodydark2">
                                {config.description || 'Aucune description'}
                              </div>
                            </div>
                    </div>
                  </TableCell>
                        <TableCell data-label="Réseau">
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4 text-bodydark2" />
                            <span className="text-sm text-gray-700 dark:text-bodydark">
                              {config.network?.nom || config.network_name || 'Inconnu'}
                            </span>
                    </div>
                  </TableCell>
                        <TableCell data-label="Type">
                          <Badge variant="outline" className="text-xs">
                            {config.config_type || config.type || 'Standard'}
                          </Badge>
                        </TableCell>
                        <TableCell data-label="Statut">
                          <Badge 
                            className={
                              config.is_active 
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" 
                                : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                            }
                          >
                            <div className="flex items-center space-x-1">
                              {config.is_active ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              <span>{config.is_active ? 'Actif' : 'Inactif'}</span>
                    </div>
                          </Badge>
                  </TableCell>
                        <TableCell data-label="Dernière mise à jour">
                          <div className="text-sm text-body dark:text-bodydark2">
                            {config.updated_at 
                              ? new Date(config.updated_at).toLocaleString()
                              : config.created_at 
                              ? new Date(config.created_at).toLocaleString()
                              : 'Inconnu'
                            }
                    </div>
                  </TableCell>
                  <TableCell data-label="Actions">
                          <div className="flex items-center space-x-2">
                            <Link href={`/dashboard/network-config/edit/${config.id || config.uid}`}>
                              <Button variant="outline" size="sm">
                                <Pencil className="h-4 w-4 mr-1" />
                                Modifier
                              </Button>
                    </Link>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className={
                                config.is_active 
                                  ? "text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20" 
                                  : "text-meta-3 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"
                              }
                            >
                              {config.is_active ? 'Désactiver' : 'Activer'}
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

        {/* Empty State */}
        {!loading && !error && filteredConfigs.length === 0 && (
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mt-6">
            <CardContent className="p-12 text-center">
              <Settings className="h-12 w-12 text-bodydark2 mx-auto mb-4" />
              <h3 className="text-sm font-medium sm:text-base text-gray-900 dark:text-gray-100 mb-2">
                Aucune configuration trouvée
              </h3>
              <p className="text-body dark:text-bodydark2 mb-4">
                {searchTerm ? `Aucune configuration ne correspond à "${searchTerm}"` : "Aucune configuration de réseau n'a encore été ajoutée."}
              </p>
              <Link href="/dashboard/network-config/create">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter la première configuration
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
} 