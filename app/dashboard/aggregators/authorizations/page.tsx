"use client"

import { useState, useEffect } from "react"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Loader, Plus, Edit2, Eye, ShieldCheck, User, Share2, ToggleLeft, ToggleRight, Check, X, Filter, MoreHorizontal, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { AggregatorAuthorization } from "@/lib/aggregator-api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { formatApiDateTime } from "@/lib/utils";
import { getApiBaseUrl } from "@/lib/env-config"
export default function AggregatorAuthorizationsPage() {
    const [authorizations, setAuthorizations] = useState<AggregatorAuthorization[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [users, setUsers] = useState<any[]>([])
    const [networks, setNetworks] = useState<any[]>([])
    const [page, setPage] = useState(1)


    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [selectedAuth, setSelectedAuth] = useState<AggregatorAuthorization | null>(null)

    const [formLoading, setFormLoading] = useState(false)

    const [formData, setFormData] = useState({
        user: "",
        network: "",
        user_payin_fee_percent: 1.5,
        user_payout_fee_percent: 1.9,
        is_active: true
    })

    const apiFetch = useApi()
    const { t } = useLanguage()
    const [filterUser, setFilterUser] = useState("all")
    const baseUrl = getApiBaseUrl()

    const fetchData = async () => {
        setLoading(true)
        setError("")
        const queryParams = new URLSearchParams()
        if (filterUser && filterUser !== "all") queryParams.append("user", filterUser)

        try {
            const [authData, userData, networkData] = await Promise.all([
                apiFetch(`aggregator/admin/user-authorizations/?${queryParams.toString()}`),
                apiFetch(`auth/admin/users/aggregators/`),
                apiFetch(`payments/networks/`)
            ])
            setAuthorizations(authData.results || [])
            setUsers(userData.aggregators || [])
            setNetworks(networkData.results || [])
        } catch (err: any) {
            setError(extractErrorMessages(err) || t("aggregators.noAuthorizationsFound"))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [apiFetch, filterUser])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormLoading(true)
        try {
            await apiFetch(`aggregator/admin/user-authorizations/`, {
                method: 'POST',
                body: JSON.stringify(formData)
            })
            setIsCreateModalOpen(false)
            fetchData()
            toast({ title: t("common.success"), description: t("aggregators.authorizationCreated") })
        } catch (err: any) {
            toast({ title: t("common.error"), description: extractErrorMessages(err), variant: "destructive" })
        } finally {
            setFormLoading(false)
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedAuth) return
        setFormLoading(true)
        try {
            await apiFetch(`aggregator/admin/user-authorizations/${selectedAuth.uid}/`, {
                method: 'PATCH',
                body: JSON.stringify(formData)
            })
            setIsEditModalOpen(false)
            fetchData()
            toast({ title: t("common.success"), description: t("aggregators.authorizationUpdated") })
        } catch (err: any) {
            toast({ title: t("common.error"), description: extractErrorMessages(err), variant: "destructive" })
        } finally {
            setFormLoading(false)
        }
    }

    const openEdit = (auth: AggregatorAuthorization) => {
        setSelectedAuth(auth)
        setFormData({
            user: auth.user,
            network: auth.network,
            user_payin_fee_percent: parseFloat(auth.user_payin_fee_percent),
            user_payout_fee_percent: parseFloat(auth.user_payout_fee_percent),
            is_active: auth.is_active
        })
        setIsEditModalOpen(true)
    }

    const handleDelete = async (uid: string) => {
        if (!confirm(t("aggregators.confirmRevoke"))) return

        try {
            await apiFetch(`aggregator/admin/user-authorizations/${uid}/`, {
                method: 'DELETE'
            })
            toast({
                title: t("common.success"),
                description: t("aggregators.revokeSuccess")
            })
            fetchData()
        } catch (err: any) {
            toast({
                title: t("common.error"),
                description: extractErrorMessages(err) || t("aggregators.revokeFailed"),
                variant: "destructive"
            })
        }
    }

    const openDetails = (auth: AggregatorAuthorization) => {
        setSelectedAuth(auth)
        setIsDetailModalOpen(true)
    }


    return (

        <div className="space-y-6 px-4 py-4 sm:py-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-lg font-bold sm:text-xl tracking-tight mb-1">{t("aggregators.authorizationsTitle")}</h1>
                    <p className="text-muted-foreground text-slate-500">{t("aggregators.authorizationsSub")}</p>
                </div>
                <Button onClick={() => {
                    setFormData({
                        user: filterUser || "",
                        network: "",
                        user_payin_fee_percent: 1.5,
                        user_payout_fee_percent: 1.9,
                        is_active: true
                    })
                    setIsCreateModalOpen(true)
                }} className="flex gap-2">
                    <Plus size={18} /> {t("aggregators.newAuthorization")}
                </Button>
            </div>

            {/* Filter Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-medium text-slate-500">{t("aggregators.filterByAggregator")}</label>
                            <Select value={filterUser} onValueChange={setFilterUser}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("aggregators.allAggregators")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("aggregators.allAggregators")}</SelectItem>
                                    {users.map(u => (
                                        <SelectItem key={u.uid} value={u.uid}>{u.display_name} ({u.email})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button variant="outline" onClick={() => setFilterUser("all")} className="flex gap-2">

                            <X size={16} /> {t("common.clear")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* List Table */}
            <Card>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-6 sm:py-10">
                            <Loader className="animate-spin mr-2 h-8 w-8 text-blue-600" />
                            <span className="text-lg font-semibold">{t("common.loading")}</span>
                        </div>
                    ) : error ? (
                        <ErrorDisplay error={error} onRetry={fetchData} />
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead>{t("aggregators.aggregatorUser")}</TableHead>
                                        <TableHead>{t("common.network")}</TableHead>
                                        <TableHead className="text-center">{t("common.payinFee")}</TableHead>
                                        <TableHead className="text-center">{t("common.payoutFee")}</TableHead>
                                        <TableHead>{t("common.status")}</TableHead>
                                        <TableHead>{t("common.updatedAt")}</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {authorizations.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-6 sm:py-10 text-slate-400">
                                                {t("aggregators.noAuthorizationsFound")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        authorizations.map((auth) => (
                                            <TableRow key={auth.uid}>
                                                <TableCell>
                                                    <div className="font-medium">{auth.user_display_name}</div>
                                                    <div className="text-xs text-slate-500">{auth.user_email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Share2 size={14} className="text-slate-400" />
                                                        <span className="font-semibold">{auth.network_name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="text-meta-3 border-green-200">{auth.user_payin_fee_percent}%</Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="text-blue-600 border-blue-200">{auth.user_payout_fee_percent}%</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={auth.is_active ? "success" : "secondary"}>
                                                        {auth.is_active ? t("common.active") : t("common.inactive")}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs text-slate-400">
                                                    {formatApiDateTime(auth.updated_at)}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => openDetails(auth)}>
                                                                <Eye size={14} className="mr-2" /> {t("common.viewDetails")}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => openEdit(auth)}>
                                                                <Edit2 size={14} className="mr-2" /> {t("common.edit")}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => handleDelete(auth.uid)}
                                                            >
                                                                <Trash2 size={14} className="mr-2" /> {t("aggregators.revokeAccess")}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>

                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Modal */}
            <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(v) => v ? null : (setIsCreateModalOpen(false) || setIsEditModalOpen(false))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isCreateModalOpen ? t("aggregators.newAuthorization") : t("aggregators.editAuthorization")}</DialogTitle>
                        <DialogDescription>{t("aggregators.assignLabel")}</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={isCreateModalOpen ? handleCreate : handleUpdate} className="space-y-6 py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t("aggregators.aggregatorUser")}</label>
                                <Select disabled={isEditModalOpen} value={formData.user} onValueChange={(v) => setFormData({ ...formData, user: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("aggregators.selectAggregator")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map(u => (
                                            <SelectItem key={u.uid} value={u.uid}>{u.display_name} ({u.email})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t("common.network")}</label>
                                <Select disabled={isEditModalOpen} value={formData.network} onValueChange={(v) => setFormData({ ...formData, network: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("aggregators.selectNetwork")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {networks.map(n => (
                                            <SelectItem key={n.uid} value={n.uid}>{n.nom}</SelectItem>
                                        ))}
                                    </SelectContent>

                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-green-700">{t("aggregators.payinFeePercent")}</label>
                                    <Input type="number" step="0.01" value={formData.user_payin_fee_percent} onChange={(e) => setFormData({ ...formData, user_payin_fee_percent: parseFloat(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-blue-700">{t("aggregators.payoutFeePercent")}</label>
                                    <Input type="number" step="0.01" value={formData.user_payout_fee_percent} onChange={(e) => setFormData({ ...formData, user_payout_fee_percent: parseFloat(e.target.value) })} />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData({ ...formData, is_active: v })} />
                                <span className="text-sm font-medium">{t("aggregators.accessEnabled")}</span>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => (setIsCreateModalOpen(false) || setIsEditModalOpen(false))}>{t("common.cancel")}</Button>
                            <Button type="submit" disabled={formLoading} className="bg-blue-600 hover:bg-blue-700">
                                {formLoading && <Loader className="animate-spin mr-2 h-4 w-4" />}
                                {isCreateModalOpen ? t("aggregators.grantAccess") : t("aggregators.updateAuthorization")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Detail View Modal */}
            <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t("aggregators.authorizationDetails")}</DialogTitle>
                    </DialogHeader>
                    {selectedAuth && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{t("common.user")}</p>
                                    <p className="font-semibold">{selectedAuth.user_display_name}</p>
                                    <p className="text-sm text-slate-400">{selectedAuth.user_email}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{t("common.network")}</p>
                                    <p className="font-semibold">{selectedAuth.network_name}</p>
                                </div>
                            </div>

                            <div className="border-t pt-4 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Payin Fee %:</span>
                                    <span className="font-medium">{selectedAuth.user_payin_fee_percent}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Payout Fee %:</span>
                                    <span className="font-medium">{selectedAuth.user_payout_fee_percent}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">{t("common.status")}:</span>
                                    <Badge variant={selectedAuth.is_active ? "success" : "secondary"}>
                                        {selectedAuth.is_active ? t("common.active") : t("common.inactive")}
                                    </Badge>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <p className="text-[10px] text-slate-400">UID: {selectedAuth.uid}</p>
                                <p className="text-[10px] text-slate-400">Created: {formatApiDateTime(selectedAuth.created_at)}</p>
                                <p className="text-[10px] text-slate-400">Updated: {formatApiDateTime(selectedAuth.updated_at)}</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>{t("common.ok")}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

