"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, Plus, Filter, CheckCircle, XCircle, MoreHorizontal, User, Network, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useApi } from "@/lib/useApi"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { getApiBaseUrl } from "@/lib/env-config"

interface BulkDepositNetwork {
    uid: string
    user: string
    user_email: string | null
    user_phone: string
    network: string
    network_name: string
    is_active: boolean
    created_at: string
    updated_at: string
}

interface UserSummary {
    uid: string
    display_name: string
    email: string
    phone: string
}

interface NetworkSummary {
    uid: string
    name: string
}

export default function BulkDepositNetworksPage() {
    const { t } = useLanguage()
    const { toast } = useToast()
    const apiFetch = useApi()
    const baseUrl = getApiBaseUrl()

    // State for the list
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<BulkDepositNetwork[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Filters
    const [userFilter, setUserFilter] = useState("")
    const [networkFilter, setNetworkFilter] = useState("")
    const [isActiveFilter, setIsActiveFilter] = useState("all")

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [createLoading, setCreateLoading] = useState(false)
    const [selectedUser, setSelectedUser] = useState("")
    const [selectedNetwork, setSelectedNetwork] = useState("")
    const [userDropdownOpen, setUserDropdownOpen] = useState(false)
    const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false)
    const [userSearchTerm, setUserSearchTerm] = useState("")

    // Data for Selects
    const [users, setUsers] = useState<UserSummary[]>([])
    const [networks, setNetworks] = useState<NetworkSummary[]>([])
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [loadingNetworks, setLoadingNetworks] = useState(false)

    const fetchBulkNetworks = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                page_size: itemsPerPage.toString(),
            })
            if (userFilter) params.append("user", userFilter)
            if (networkFilter) params.append("network", networkFilter)
            if (isActiveFilter !== "all") params.append("is_active", isActiveFilter)

            const response = await apiFetch(`payments/admin/bulk-deposit-networks/?${params.toString()}`)
            setData(response.results || [])
            setTotalCount(response.count || 0)
        } catch (err) {
            toast({
                title: "Erreur",
                description: extractErrorMessages(err) || "Échec du chargement des réseaux de dépôt en masse",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }, [apiFetch, baseUrl, currentPage, userFilter, networkFilter, isActiveFilter, toast])

    useEffect(() => {
        fetchBulkNetworks()
    }, [fetchBulkNetworks])

    const fetchUsers = useCallback(async (search: string = "") => {
        setLoadingUsers(true)
        try {
            const params = new URLSearchParams({ page_size: "50" })
            if (search) params.append("search", search)
            const response = await apiFetch(`auth/admin/users/?${params.toString()}`)
            const usersData = response.results || response.users || []
            setUsers(usersData)
        } catch (err) {
            console.error("Failed to fetch users", err)
        } finally {
            setLoadingUsers(false)
        }
    }, [apiFetch, baseUrl])

    const [debounceSearchTerm, setDebounceSearchTerm] = useState("")

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebounceSearchTerm(userSearchTerm)
        }, 500)
        return () => clearTimeout(timer)
    }, [userSearchTerm])

    useEffect(() => {
        if (isCreateModalOpen) {
            fetchUsers(debounceSearchTerm)
        }
    }, [isCreateModalOpen, debounceSearchTerm, fetchUsers])

    const fetchNetworks = async () => {
        setLoadingNetworks(true)
        try {
            const response = await apiFetch(`payments/networks/`)
            // The API endpoint for networks might vary, let's assume it returns a list or results
            const networkData = response.results || response || []
            setNetworks(networkData.map((n: any) => ({
                uid: n.uid,
                name: n.nom || n.name
            })))
        } catch (err) {
            console.error("Failed to fetch networks", err)
        } finally {
            setLoadingNetworks(false)
        }
    }

    useEffect(() => {
        if (isCreateModalOpen) {
            fetchNetworks()
        }
    }, [isCreateModalOpen])

    const handleCreate = async () => {
        if (!selectedUser || !selectedNetwork) {
            toast({ title: "Erreur", description: "Veuillez sélectionner un utilisateur et un réseau", variant: "destructive" })
            return
        }

        setCreateLoading(true)
        try {
            await apiFetch(`payments/admin/bulk-deposit-networks/`, {
                method: "POST",
                body: JSON.stringify({
                    user: selectedUser,
                    network: selectedNetwork,
                }),
                successMessage: "Configuration de dépôt en masse créée avec succès",
            })
            setIsCreateModalOpen(false)
            setSelectedUser("")
            setSelectedNetwork("")
            fetchBulkNetworks()
        } catch (err) {
            toast({
                title: "Erreur",
                description: extractErrorMessages(err) || "Échec de la création",
                variant: "destructive",
            })
        } finally {
            setCreateLoading(false)
        }
    }

    const handleToggleStatus = async (uid: string, currentStatus: boolean) => {
        try {
            await apiFetch(`payments/admin/bulk-deposit-networks/${uid}/`, {
                method: "PATCH",
                body: JSON.stringify({ is_active: !currentStatus }),
                successMessage: `Statut mis à jour avec succès`,
            })
            fetchBulkNetworks()
        } catch (err) {
            toast({
                title: "Erreur",
                description: extractErrorMessages(err) || "Échec de la mise à jour du statut",
                variant: "destructive",
            })
        }
    }

    const totalPages = Math.ceil(totalCount / itemsPerPage)

    return (
        <div className="min-h-screen bg-whiten dark:bg-boxdark-2">
            <div className="w-full">
                {/* Header */}
                <div className="mb-4 sm:mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-base font-bold sm:text-lg sm:text-2xl bg-gradient-to-r from-primary to-meta-3 bg-clip-text text-transparent">
                            Autorisation Dépôts en Masse
                        </h1>
                        <p className="text-body dark:text-bodydark mt-2 text-lg">
                            Gérer les autorisations des utilisateurs pour les dépôts en masse par réseau
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white shadow-lg transition-all duration-200"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Nouvelle Autorisation
                    </Button>
                </div>

                {/* Filters */}
                <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
                    <CardContent className="p-3 sm:p-4 md:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bodydark2" />
                                <Input
                                    placeholder="ID Utilisateur..."
                                    value={userFilter}
                                    onChange={(e) => setUserFilter(e.target.value)}
                                    className="pl-10 dark:bg-meta-4 border-stroke dark:border-strokedark"
                                />
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bodydark2" />
                                <Input
                                    placeholder="ID Réseau..."
                                    value={networkFilter}
                                    onChange={(e) => setNetworkFilter(e.target.value)}
                                    className="pl-10 dark:bg-meta-4 border-stroke dark:border-strokedark"
                                />
                            </div>
                            <Select value={isActiveFilter} onValueChange={setIsActiveFilter}>
                                <SelectTrigger className="dark:bg-meta-4 border-stroke dark:border-strokedark">
                                    <SelectValue placeholder="Filtrer par statut" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les statuts</SelectItem>
                                    <SelectItem value="true">Actif</SelectItem>
                                    <SelectItem value="false">Inactif</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    setUserFilter("")
                                    setNetworkFilter("")
                                    setIsActiveFilter("all")
                                    setCurrentPage(1)
                                }}
                            >
                                Réinitialiser
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
                    <CardHeader className="border-b border-gray-100 dark:border-strokedark flex flex-row items-center justify-between">
                        <CardTitle className="text-xl font-semibold flex items-center gap-2">
                            <div className="p-2 bg-meta-2 dark:bg-orange-900/30 rounded-lg">
                                <User className="h-5 w-5 text-primary dark:text-primary" />
                            </div>
                            Liste des autorisations
                        </CardTitle>
                        <Badge variant="outline" className="text-body">
                            {totalCount} total
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                                <p className="text-body">Chargement des données...</p>
                            </div>
                        ) : data.length === 0 ? (
                            <div className="py-20 text-center">
                                <p className="text-body text-lg">Aucune autorisation trouvée</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50/50 dark:bg-boxdark-2/50">
                                            <TableHead>Utilisateur</TableHead>
                                            <TableHead>Réseau</TableHead>
                                            <TableHead>Statut</TableHead>
                                            <TableHead>Date création</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((item) => (
                                            <TableRow key={item.uid} className="hover:bg-gray-50/50 dark:hover:bg-boxdark-2/40 transition-colors">
                                                <TableCell data-label="Utilisateur">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                            {item.user_phone}
                                                        </span>
                                                        <span className="text-xs text-body font-mono">
                                                            {item.user}
                                                        </span>
                                                        {item.user_email && (
                                                            <span className="text-xs text-blue-500">
                                                                {item.user_email}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell data-label="Réseau">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{item.network_name}</span>
                                                        <span className="text-xs text-body font-mono">{item.network}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell data-label="Statut">
                                                    <Badge
                                                        className={
                                                            item.is_active
                                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200"
                                                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200"
                                                        }
                                                    >
                                                        {item.is_active ? "Actif" : "Inactif"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-body text-sm" data-label="Date création">
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right" data-label="Actions">
                                                    <div className="flex flex-wrap gap-1.5 justify-end">
                                                        <button
                                                            onClick={() => handleToggleStatus(item.uid, item.is_active)}
                                                            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-opacity-90 ${item.is_active ? "bg-danger" : "bg-meta-3"}`}
                                                        >
                                                            {item.is_active ? (
                                                                <><XCircle className="h-3.5 w-3.5 flex-shrink-0" />Désactiver</>
                                                            ) : (
                                                                <><CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />Activer</>
                                                            )}
                                                        </button>
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
                    <div className="mt-6 flex items-center justify-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            Précédent
                        </Button>
                        <span className="text-sm border rounded px-3 py-1 bg-white">
                            Page {currentPage} sur {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            Suivant
                        </Button>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold sm:text-xl text-primary">
                            Nouvelle Autorisation
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 sm:p-4 md:p-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="author-user">Utilisateur</Label>
                            <Popover open={userDropdownOpen} onOpenChange={setUserDropdownOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={userDropdownOpen}
                                        className="w-full justify-between font-normal dark:bg-meta-4 border-stroke dark:border-strokedark"
                                    >
                                        {selectedUser
                                            ? users.find((u) => u.uid === selectedUser)?.display_name || users.find((u) => u.uid === selectedUser)?.phone || selectedUser
                                            : "Rechercher un utilisateur..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Chercher par nom, email ou téléphone..."
                                            onValueChange={setUserSearchTerm}
                                        />
                                        <CommandList>
                                            <CommandEmpty>{loadingUsers ? "Chargement..." : "Aucun utilisateur trouvé."}</CommandEmpty>
                                            <CommandGroup>
                                                {users.map((u) => (
                                                    <CommandItem
                                                        key={u.uid}
                                                        value={u.uid}
                                                        onSelect={(currentValue) => {
                                                            setSelectedUser(currentValue === selectedUser ? "" : currentValue)
                                                            setUserDropdownOpen(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedUser === u.uid ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span>{u.display_name || u.phone}</span>
                                                            <span className="text-xs text-muted-foreground">{u.email}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="author-network">Réseau</Label>
                            <Popover open={networkDropdownOpen} onOpenChange={setNetworkDropdownOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={networkDropdownOpen}
                                        className="w-full justify-between font-normal dark:bg-meta-4 border-stroke dark:border-strokedark"
                                    >
                                        {selectedNetwork
                                            ? networks.find((n) => n.uid === selectedNetwork)?.name || selectedNetwork
                                            : "Sélectionner un réseau"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                    <Command>
                                        <CommandInput placeholder="Rechercher un réseau..." />
                                        <CommandList>
                                            <CommandEmpty>Aucun réseau trouvé.</CommandEmpty>
                                            <CommandGroup>
                                                {networks.map((n) => (
                                                    <CommandItem
                                                        key={n.uid}
                                                        value={n.uid}
                                                        onSelect={(currentValue) => {
                                                            setSelectedNetwork(currentValue === selectedNetwork ? "" : currentValue)
                                                            setNetworkDropdownOpen(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedNetwork === n.uid ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {n.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <DialogClose asChild>
                            <Button variant="outline">Annuler</Button>
                        </DialogClose>
                        <Button
                            onClick={handleCreate}
                            disabled={createLoading || !selectedUser || !selectedNetwork}
                            className="bg-primary hover:bg-primary text-white"
                        >
                            {createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Créer l'autorisation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
