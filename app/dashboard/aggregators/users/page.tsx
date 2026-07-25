"use client"

import { useState, useEffect } from "react"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Search, Filter, Loader, MoreHorizontal, Eye, BarChart2, Shield } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { AggregatorListResponse, AggregatorUser } from "@/lib/aggregator-api"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

import { formatApiDateTime } from "@/lib/utils";
import { getApiBaseUrl } from "@/lib/env-config"
export default function AggregatorUsersPage() {
    const [data, setData] = useState<AggregatorListResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")

    const apiFetch = useApi()
    const { t } = useLanguage()
    const { toast } = useToast()
    const baseUrl = getApiBaseUrl()

    const fetchAggregators = async () => {
        setLoading(true)
        setError("")
        try {
            const data = await apiFetch(`auth/admin/users/aggregators/?page=${page}&ordering=-created_at`)
            setData(data)
        } catch (err: any) {
            setError(extractErrorMessages(err) || t("common.failedToLoad"))
        } finally {
            setLoading(false)
        }
    }

    const handleToggleStatus = async (uid: string, currentStatus: boolean) => {
        const action = currentStatus ? "deactivate" : "activate"
        const confirmMsg = currentStatus
            ? t("aggregators.confirmDeactivate")
            : t("aggregators.confirmActivate")

        if (!confirm(confirmMsg)) return

        try {
            await apiFetch(`auth/admin/users/aggregators/${uid}/`, {
                method: 'PATCH',
                body: JSON.stringify({ is_active: !currentStatus })
            })
            toast({
                title: t("common.success"),
                description: t("aggregators.successToggle")
            })
            fetchAggregators()
        } catch (err: any) {
            toast({
                title: t("common.error"),
                description: extractErrorMessages(err) || t("aggregators.failedToggle"),
                variant: "destructive"
            })
        }
    }

    useEffect(() => {

        fetchAggregators()
    }, [apiFetch, page])

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader className="animate-spin mr-2 h-8 w-8 text-blue-600" />
                <span className="text-lg font-semibold">{t("common.loading")}</span>
            </div>
        )
    }

    return (
        <div className="space-y-6 px-4 py-4 sm:py-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-lg font-bold sm:text-xl tracking-tight mb-1">{t("aggregators.usersTitle")}</h1>
                    <p className="text-muted-foreground text-slate-500">{t("aggregators.usersSub")}</p>
                </div>
            </div>

            {/* Stats Overview */}
            {data?.stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:p-4 md:p-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
                                <span className="text-sm font-medium text-slate-500">{t("aggregators.totalAggregators")}</span>
                                <Users size={16} className="text-blue-600" />
                            </div>
                            <div className="text-lg font-bold sm:text-xl mt-2">{data.stats.total_aggregators}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
                                <span className="text-sm font-medium text-slate-500">{t("aggregators.activeAggregators")}</span>
                                <div className="h-2 w-2 rounded-full bg-meta-3" />
                            </div>
                            <div className="text-lg font-bold sm:text-xl mt-2 text-meta-3">{data.stats.active_aggregators}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
                                <span className="text-sm font-medium text-slate-500">{t("aggregators.inactiveAggregators")}</span>
                                <div className="h-2 w-2 rounded-full bg-slate-300" />
                            </div>
                            <div className="text-lg font-bold sm:text-xl mt-2 text-slate-400">{data.stats.inactive_aggregators}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters and Table */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                            <Input
                                placeholder={t("aggregators.searchPlaceholder")}
                                className="pl-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="flex items-center gap-2">
                            <Filter size={18} /> {t("dashboard.filters")}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <ErrorDisplay error={error} onRetry={fetchAggregators} />
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead>{t("common.user")}</TableHead>
                                        <TableHead>{t("common.contact")}</TableHead>
                                        <TableHead>{t("common.balance")}</TableHead>
                                        <TableHead>{t("common.status")}</TableHead>
                                        <TableHead>{t("common.createdAt")}</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.aggregators.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-6 sm:py-10 text-slate-400">
                                                {t("aggregators.noAggregatorsFound")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data?.aggregators
                                            .filter(agg =>
                                                agg.display_name.toLowerCase().includes(search.toLowerCase()) ||
                                                agg.email.toLowerCase().includes(search.toLowerCase())
                                            )
                                            .map((agg) => (
                                                <TableRow key={agg.uid}>
                                                    <TableCell>
                                                        <div className="font-medium">{agg.display_name}</div>
                                                        <div className="text-xs text-slate-500 font-mono">{agg.uid.substring(0, 8)}...</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">{agg.email}</div>
                                                        <div className="text-xs text-slate-400">{agg.phone || t("aggregators.hasNoPhone")}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-semibold text-blue-600">
                                                            {agg.account_balance.toLocaleString("en-GB")} {agg.account_currency}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={agg.is_active ? "success" : "secondary"}>
                                                            {agg.is_active ? t("common.active") : t("common.inactive")}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-slate-500">
                                                        {formatApiDateTime(agg.created_at)}
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
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/dashboard/aggregators/users/${agg.uid}/stats`} className="flex items-center gap-2">
                                                                        <Eye size={14} className="mr-2" /> {t("common.viewDetails")}
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className={agg.is_active ? "text-red-600" : "text-meta-3"}
                                                                    onClick={() => handleToggleStatus(agg.uid, agg.is_active)}
                                                                >
                                                                    <Shield size={14} className="mr-2" /> {agg.is_active ? t("aggregators.deactivateAggregator") : t("aggregators.activateAggregator")}
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

                    {/* Pagination */}
                    {data?.pagination && data.pagination.total_pages > 1 && (
                        <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center mt-6">
                            <div className="text-sm text-slate-500">
                                {t("aggregators.showingXofY")
                                    .replace("{start}", data.pagination.start_index.toString())
                                    .replace("{end}", data.pagination.end_index.toString())
                                    .replace("{total}", data.pagination.total_count.toString())}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!data.pagination.has_previous}
                                    onClick={() => setPage(page - 1)}
                                >
                                    {t("common.previous")}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!data.pagination.has_next}
                                    onClick={() => setPage(page + 1)}
                                >
                                    {t("common.next")}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
