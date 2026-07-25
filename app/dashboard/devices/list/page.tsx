"use client"
import { useEffect, useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, ArrowUpDown, Monitor, Plus, Filter, CheckCircle, XCircle, Wifi, WifiOff, Activity } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
// import { useWebSocket } from "@/components/providers/websocket-provider"
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

export default function DevicesListPage() {
  const [devices, setDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortField, setSortField] = useState<"name" | "is_online" | null>(null)
  const [sortDirection, setSortDirection] = useState<"+" | "-">("-")
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1)
  // const { lastMessage } = useWebSocket(); // Add this line

  useEffect(() => {
    const fetchDevices = async () => {
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
            params.append("is_online", statusFilter === "active" ? "true" : "false");
          }
          if (sortField) {
            params.append("ordering", `${sortDirection}${sortField}`);
          }
          if (startDate) {
            params.append("created_at__gte", startDate);
          }
          if (endDate) {
            params.append("created_at__lte", endDate);
          }
          const query = params.toString().replace(/ordering=%2B/g, "ordering=+");
          endpoint = `payments/stats/devices/?${query}`;
        } else {
          const params = new URLSearchParams({
            page: "1",
            page_size: "100",
          });
          endpoint = `payments/stats/devices/?${params.toString()}`;
        }
        // Test error handling - uncomment to test
        // throw new Error('{"detail":"Method \"GET\" not allowed."}')
        
        const data = await apiFetch(endpoint)
        console.log('Devices API response:', data)
        setDevices(Array.isArray(data) ? data : data.results || [])
        toast({
          title: t("devices.success"),
          description: t("devices.loadedSuccessfully"),
        })
      } catch (err: any) {
        console.log('Devices fetch error caught:', err)
        const errorMessage = extractErrorMessages(err) || t("devices.failedToLoad")
        console.log('Extracted error message:', errorMessage)
        setError(errorMessage)
        setDevices([])
        toast({
          title: t("devices.failedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
        console.error('Devices fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDevices()
  }, [searchTerm, statusFilter, sortField, sortDirection, startDate, endDate])

  // WEBSOCKET CODE COMMENTED OUT
  // Listen for device_status_update WebSocket messages
  // useEffect(() => {
  //   if (!lastMessage) return;
  //   try {
  //     const data = typeof lastMessage.data === "string" ? JSON.parse(lastMessage.data) : lastMessage.data;
  //     if (data.type === "device_status_update" && data.device_id) {
  //       setDevices((prev) =>
  //         prev.map((device) =>
  //           device.device_id === data.device_id
  //             ? { ...device, ...data.data }
  //             : device
  //         )
  //       );
  //     }
  //   } catch (error) {
  //     console.error('Error parsing WebSocket message:', error);
  //   }
  // }, [lastMessage]);

  const filteredDevices = devices

  const handleSort = (field: "name" | "is_online") => {
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
                {t("devices.list")}
              </h1>
              <p className="text-body dark:text-bodydark mt-2 text-lg">
                Surveiller et gérer les appareils connectés
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="bg-white dark:bg-boxdark rounded-lg px-4 py-2 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Monitor className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-gray-700 dark:text-bodydark">
                    {devices.length} appareils
                  </span>
                </div>
              </div>
              <div className="bg-white dark:bg-boxdark rounded-lg px-4 py-2 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-meta-3" />
                  <span className="text-sm font-medium text-gray-700 dark:text-bodydark">
                    {devices.filter(d => d.is_online).length} en ligne
                  </span>
                </div>
              </div>
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
                  placeholder="Rechercher des appareils..."
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
                  <SelectItem value="all">Tous les appareils</SelectItem>
                  <SelectItem value="active">En ligne</SelectItem>
                  <SelectItem value="inactive">Hors ligne</SelectItem>
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
                onValueChange={(value) => setSortField(value as "name" | "is_online" | null)}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
                  <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
                  <SelectItem value="name">Nom</SelectItem>
                  <SelectItem value="is_online">Statut</SelectItem>
            </SelectContent>
          </Select>
        </div>
          </CardContent>
        </Card>

        {/* Devices Table */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <CardHeader className="border-b border-gray-100 dark:border-strokedark">
            <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-meta-2 dark:bg-orange-900 rounded-lg">
                  <Monitor className="h-5 w-5 text-primary dark:text-secondary" />
              </div>
              <span>Liste des appareils</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
        {loading ? (
              <div className="flex items-center justify-center py-6 sm:py-10">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-body dark:text-bodydark">Chargement des appareils...</span>
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
                      <TableHead className="font-semibold">Nom de l'appareil</TableHead>
                      <TableHead className="font-semibold">ID de l'appareil</TableHead>
                      <TableHead className="font-semibold">Utilisateur</TableHead>
                      <TableHead className="font-semibold">Réseau</TableHead>
                      <TableHead className="font-semibold">Transactions</TableHead>
                      <TableHead className="font-semibold">Taux de succès</TableHead>
                      <TableHead className="font-semibold">Statut</TableHead>
                      <TableHead className="font-semibold">Dernière activité</TableHead>
                      {/* <TableHead className="font-semibold">Actions</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
                    {filteredDevices.map((device) => (
                      <TableRow key={device.device_id || device.id} className="hover:bg-gray-50 dark:hover:bg-boxdark-2/50">
                        <TableCell data-label="Nom de l'appareil">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-meta-3 rounded-full flex items-center justify-center text-white font-semibold">
                              {device.device_name?.charAt(0)?.toUpperCase() || 'D'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {device.device_name || 'Appareil inconnu'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-label="ID de l'appareil">
                          <Badge variant="outline" className="font-mono text-xs">
                            {device.device_id || device.id}
                          </Badge>
                        </TableCell>
                        <TableCell data-label="Utilisateur">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {device.user_name || 'Utilisateur inconnu'}
                          </div>
                        </TableCell>
                        <TableCell data-label="Réseau">
                          <Badge variant="secondary" className="text-xs">
                            {device.network_name || 'Réseau inconnu'}
                          </Badge>
                        </TableCell>
                        <TableCell data-label="Transactions">
                          <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                            {device.total_transactions || 0}
                          </div>
                        </TableCell>
                        <TableCell data-label="Taux de succès">
                          <Badge 
                            className={
                              parseFloat(device.success_rate || "0") >= 80
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                : parseFloat(device.success_rate || "0") >= 50
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                            }
                          >
                            {device.success_rate || "0.00"}%
                          </Badge>
                        </TableCell>
                        <TableCell data-label="Statut">
                          <Badge 
                            className={
                              device.is_online 
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" 
                                : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                            }
                          >
                            <div className="flex items-center space-x-1">
                              {device.is_online ? (
                                <Wifi className="h-3 w-3" />
                              ) : (
                                <WifiOff className="h-3 w-3" />
                              )}
                              <span>{device.is_online ? 'En ligne' : 'Hors ligne'}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell data-label="Dernière activité">
                          <div className="text-sm text-body dark:text-bodydark2">
                            {device.last_seen 
                              ? new Date(device.last_seen).toLocaleString()
                              : 'Jamais'
                            }
                          </div>
                        </TableCell>
                  <TableCell data-label="Actions">
                          {/* <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Pencil className="h-4 w-4 mr-1" />
                              Modifier
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className={
                                device.is_online 
                                  ? "text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20" 
                                  : "text-meta-3 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"
                              }
                            >
                              {device.is_online ? 'Déconnecter' : 'Connecter'}
                            </Button>
                          </div> */}
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
        {!loading && !error && filteredDevices.length === 0 && (
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mt-6">
            <CardContent className="p-12 text-center">
              <Monitor className="h-12 w-12 text-bodydark2 mx-auto mb-4" />
              <h3 className="text-sm font-medium sm:text-base text-gray-900 dark:text-gray-100 mb-2">
                Aucun appareil trouvé
              </h3>
              <p className="text-body dark:text-bodydark2 mb-4">
                {searchTerm ? `Aucun appareil ne correspond à "${searchTerm}"` : "Aucun appareil n'a encore été enregistré."}
              </p>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}