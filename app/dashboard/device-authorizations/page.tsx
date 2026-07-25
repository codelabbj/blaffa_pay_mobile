"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { useLanguage } from "@/components/providers/language-provider"
import {
    Search,
    Plus,
    Filter,
    CheckCircle,
    XCircle,
    MoreHorizontal,
    ShieldCheck,
    Loader2,
    Calendar as CalendarIcon,
    Trash2,
    Eye,
    Settings2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useApi } from "@/lib/useApi"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
    DeviceAuthorization,
    Partner,
    Device
} from "@/lib/types/device-authorization"
import { PartnerSelectionModal } from "@/components/ui/partner-selection-modal"
import { DeviceSelectionModal } from "@/components/ui/device-selection-modal"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { fr, enUS } from "date-fns/locale"
import { getApiBaseUrl } from "@/lib/env-config"

export default function DeviceAuthorizationsPage() {
    const { t, language } = useLanguage()
    const { toast } = useToast()
    const apiFetch = useApi()
    const router = useRouter()
    const baseUrl = getApiBaseUrl()
    const dateLocale = language === 'fr' ? fr : enUS

    // State for the list
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<DeviceAuthorization[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Filters
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    // Create State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [createLoading, setCreateLoading] = useState(false)
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
    const [notes, setNotes] = useState("")
    const [isActive, setIsActive] = useState(true)

    // Selection Modals State
    const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false)
    const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false)

    const fetchAuthorizations = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                page_size: itemsPerPage.toString(),
            })
            if (searchTerm) params.append("search", searchTerm)
            if (statusFilter !== "all") params.append("is_active", statusFilter)

            const response = await apiFetch(`payments/betting/admin/device-authorizations/?${params.toString()}`)
            setData(response.results || [])
            setTotalCount(response.count || 0)
        } catch (err) {
            toast({
                title: t("common.errorOccurred"),
                description: extractErrorMessages(err) || t("common.failedToLoad"),
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }, [apiFetch, baseUrl, currentPage, searchTerm, statusFilter, t, toast])

    useEffect(() => {
        fetchAuthorizations()
    }, [fetchAuthorizations])

    const handleCreate = async () => {
        if (!selectedPartner || !selectedDevice) {
            toast({
                title: t("common.errorOccurred"),
                description: t("deviceAuthorizations.selectPartnerAndDevice"),
                variant: "destructive"
            })
            return
        }

        setCreateLoading(true)
        try {
            await apiFetch(`payments/betting/admin/device-authorizations/`, {
                method: "POST",
                body: JSON.stringify({
                    partner: selectedPartner.uid,
                    origin_device: selectedDevice.uid,
                    notes,
                    is_active: isActive,
                }),
                successMessage: t("deviceAuthorizations.createSuccess"),
            })
            setIsCreateModalOpen(false)
            resetForm()
            fetchAuthorizations()
        } catch (err) {
            toast({
                title: t("common.errorOccurred"),
                description: extractErrorMessages(err) || t("common.failedToCreate"),
                variant: "destructive",
            })
        } finally {
            setCreateLoading(false)
        }
    }

    const handleToggleStatus = async (uid: string, currentStatus: boolean) => {
        try {
            await apiFetch(`payments/betting/admin/device-authorizations/${uid}/`, {
                method: "PATCH",
                body: JSON.stringify({ is_active: !currentStatus }),
                successMessage: t("deviceAuthorizations.toggleSuccess"),
            })
            fetchAuthorizations()
        } catch (err) {
            toast({
                title: t("common.errorOccurred"),
                description: extractErrorMessages(err) || t("common.failedToUpdate"),
                variant: "destructive",
            })
        }
    }

    const resetForm = () => {
        setSelectedPartner(null)
        setSelectedDevice(null)
        setNotes("")
        setIsActive(true)
    }

    const totalPages = Math.ceil(totalCount / itemsPerPage)

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-4 md:p-3 sm:p-5 md:p-8">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-lg font-bold sm:text-xl tracking-tight text-slate-900 dark:text-slate-50">
                            {t("deviceAuthorizations.title")}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            {t("deviceAuthorizations.list")}
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-primary hover:bg-opacity-90 text-white shadow-lg shadow-orange-600/20 transition-all font-medium"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        {t("deviceAuthorizations.create")}
                    </Button>
                </div>

                {/* Filters */}
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                    <CardContent className="p-4 md:p-3 sm:p-4 md:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder={t("deviceAuthorizations.searchPlaceholder")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 dark:bg-slate-800 border-slate-200 dark:border-slate-800 focus-visible:ring-primary/20"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="dark:bg-slate-800 border-slate-200 dark:border-slate-800 focus:ring-primary/20">
                                    <SelectValue placeholder={t("users.filterByStatus")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("common.all")}</SelectItem>
                                    <SelectItem value="true">{t("common.active")}</SelectItem>
                                    <SelectItem value="false">{t("common.inactive")}</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                className="w-full md:w-auto border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                                onClick={() => {
                                    setSearchTerm("")
                                    setStatusFilter("all")
                                    setCurrentPage(1)
                                }}
                            >
                                {t("common.refresh")}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-6 py-4">
                        <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                {t("deviceAuthorizations.title")}
                            </CardTitle>
                            <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider">
                                {totalCount} {t("common.total")}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                <p className="text-sm text-slate-500 animate-pulse">{t("common.loading")}</p>
                            </div>
                        ) : data.length === 0 ? (
                            <div className="py-24 text-center space-y-3">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mb-2">
                                    <Search className="h-6 w-6 text-slate-400" />
                                </div>
                                <p className="text-slate-500 font-medium">{t("common.noData")}</p>
                            </div>
                        ) : (
                            <div className="relative overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                            <TableHead className="font-semibold">{t("deviceAuthorizations.partner")}</TableHead>
                                            <TableHead className="font-semibold">{t("deviceAuthorizations.device")}</TableHead>
                                            <TableHead className="font-semibold">{t("deviceAuthorizations.status")}</TableHead>
                                            <TableHead className="font-semibold">{t("deviceAuthorizations.createdAt")}</TableHead>
                                            <TableHead className="text-right font-semibold">{t("common.actions")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((item) => (
                                            <TableRow key={item.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800">
                                                <TableCell>
                                                    <div className="flex flex-col py-1">
                                                        <span className="font-semibold text-slate-900 dark:text-slate-200">
                                                            {item.partner_name}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-slate-400">
                                                            {item.partner_uid}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col py-1">
                                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                                            {item.device_name}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-slate-400">
                                                            {item.device_uid}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={cn(
                                                            "font-medium shadow-sm border-none",
                                                            item.is_active
                                                                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                                        )}
                                                    >
                                                        <span className={cn(
                                                            "w-1.5 h-1.5 rounded-full mr-1.5",
                                                            item.is_active ? "bg-meta-3" : "bg-slate-400"
                                                        )} />
                                                        {item.is_active ? t("common.active") : t("common.inactive")}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-slate-500 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon className="h-3 w-3" />
                                                        {format(new Date(item.created_at), "PP", { locale: dateLocale })}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuItem
                                                                onClick={() => router.push(`/dashboard/device-authorizations/${item.uid}`)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" /> {t("users.details")}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleToggleStatus(item.uid, item.is_active)}
                                                                className={cn(
                                                                    "cursor-pointer",
                                                                    item.is_active ? "text-slate-600" : "text-meta-3"
                                                                )}
                                                            >
                                                                {item.is_active ? (
                                                                    <><XCircle className="mr-2 h-4 w-4" /> {t("users.deactivate")}</>
                                                                ) : (
                                                                    <><CheckCircle className="mr-2 h-4 w-4" /> {t("users.activate")}</>
                                                                )}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
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
                    <div className="flex items-center justify-center gap-2 pb-8">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            {t("common.previous")}
                        </Button>
                        <div className="flex items-center px-4 py-2 rounded-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                            <span className="text-xs font-medium text-slate-500 mr-1">{t("common.page")}</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{currentPage}</span>
                            <span className="text-xs font-medium text-slate-400 mx-1">/</span>
                            <span className="text-sm font-bold text-slate-500">{totalPages}</span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            {t("common.next")}
                        </Button>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[500px] border-none shadow-2xl overflow-hidden p-0 bg-white dark:bg-slate-900">
                    <div className="bg-primary p-3 sm:p-4 md:p-6">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold sm:text-xl text-white flex items-center gap-2">
                                <Plus className="h-6 w-6" />
                                {t("deviceAuthorizations.create")}
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="p-3 sm:p-4 md:p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    {t("deviceAuthorizations.partner")}
                                </Label>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsPartnerModalOpen(true)}
                                    className="w-full justify-between font-normal h-11 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
                                >
                                    {selectedPartner ? (
                                        <div className="flex flex-col items-start">
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                                                {selectedPartner.display_name || selectedPartner.phone_number}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400">{t("deviceAuthorizations.selectPartner")}</span>
                                    )}
                                    <Settings2 className="h-4 w-4 opacity-50" />
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    {t("deviceAuthorizations.device")}
                                </Label>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDeviceModalOpen(true)}
                                    className="w-full justify-between font-normal h-11 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
                                >
                                    {selectedDevice ? (
                                        <div className="flex flex-col items-start">
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                                                {selectedDevice.device_name || selectedDevice.device_id}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400">{t("deviceAuthorizations.selectDevice")}</span>
                                    )}
                                    <Settings2 className="h-4 w-4 opacity-50" />
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    {t("deviceAuthorizations.notes")}
                                </Label>
                                <Input
                                    id="notes"
                                    placeholder={t("deviceAuthorizations.notesPlaceholder")}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="h-11 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 focus-visible:ring-primary/20"
                                />
                            </div>

                            <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-semibold">{t("deviceAuthorizations.status")}</Label>
                                    <p className="text-xs text-slate-500">
                                        {isActive ? t("common.active") : t("common.inactive")}
                                    </p>
                                </div>
                                <Switch
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                    className="data-[state=checked]:bg-primary"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-3 sm:p-4 md:p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                        <DialogClose asChild>
                            <Button variant="ghost" disabled={createLoading}>
                                {t("common.cancel")}
                            </Button>
                        </DialogClose>
                        <Button
                            onClick={handleCreate}
                            disabled={createLoading || !selectedPartner || !selectedDevice}
                            className="bg-primary hover:bg-opacity-90 text-white min-w-[120px]"
                        >
                            {createLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                t("deviceAuthorizations.create")
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Selection Modals */}
            <PartnerSelectionModal
                open={isPartnerModalOpen}
                onOpenChange={setIsPartnerModalOpen}
                onSelect={setSelectedPartner}
                selectedPartnerUid={selectedPartner?.uid}
            />
            <DeviceSelectionModal
                open={isDeviceModalOpen}
                onOpenChange={setIsDeviceModalOpen}
                onSelect={setSelectedDevice}
                selectedDeviceUid={selectedDevice?.uid}
            />
        </div>
    )
}
