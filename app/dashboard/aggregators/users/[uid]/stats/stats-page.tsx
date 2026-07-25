"use client"

import { useState, useEffect } from "react"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, CreditCard, DollarSign, TrendingUp, Clock, Shield, Loader, ArrowLeft } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { AggregatorIndividualStats } from "@/lib/aggregator-api"

import { formatApiDateTime } from "@/lib/utils";
import { getApiBaseUrl } from "@/lib/env-config"
export default function AggregatorUserStatsPage() {
    const params = useParams()
    const router = useRouter()
    const { uid } = params
    const [stats, setStats] = useState<AggregatorIndividualStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const apiFetch = useApi()
    const { t } = useLanguage()
    const baseUrl = getApiBaseUrl()

    const fetchStats = async () => {
        if (!uid) return
        setLoading(true)
        setError("")
        try {
            const data = await apiFetch(`auth/admin/users/aggregators/${uid}/stats/`)
            setStats(data)
        } catch (err: any) {
            setError(extractErrorMessages(err) || t("common.failedToLoad"))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
    }, [uid, apiFetch])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader className="animate-spin mr-2 h-8 w-8 text-blue-600" />
                <span className="text-lg font-semibold">{t("common.loading")}</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-3 sm:p-5 md:p-8">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> {t("common.back")}
                </Button>
                <ErrorDisplay error={error} onRetry={fetchStats} variant="full" />
            </div>
        )
    }

    if (!stats) return null

    return (
        <div className="space-y-4 sm:space-y-6 px-4 py-4 sm:py-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Button variant="ghost" onClick={() => router.back()} className="mb-2 p-0 hover:bg-transparent">
                        <ArrowLeft className="mr-2 h-4 w-4" /> {t("aggregators.backToUsers")}
                    </Button>
                    <h1 className="text-lg font-bold sm:text-xl tracking-tight mb-1">{stats.display_name}</h1>
                    <p className="text-muted-foreground text-slate-500">{stats.email}</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant={stats.is_active ? "success" : "secondary"} className="h-fit">
                        {stats.is_active ? t("aggregators.accountActive") : t("aggregators.accountInactive")}
                    </Badge>
                </div>
            </div>

            {/* Account Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:p-4 md:p-6">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">{t("aggregators.accountBalance")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold sm:text-xl text-blue-600">
                            {stats.account_info.balance.toLocaleString()} {stats.account_info.currency}
                        </div>
                        <div className="mt-2">
                            <Badge variant={stats.account_info.is_frozen ? "destructive" : "outline"}>
                                {stats.account_info.is_frozen ? t("aggregators.frozen") : t("aggregators.liquid")}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <TrendingUp size={16} /> {t("aggregators.totalPayins")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold sm:text-xl">{stats.payin_stats.total_count}</div>
                        <div className="text-sm text-slate-500 mt-1">
                            {t("common.amount")}: {stats.payin_stats.total_amount.toLocaleString()} {stats.account_info.currency}
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <TrendingUp size={16} /> {t("aggregators.totalPayouts")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold sm:text-xl">{stats.payout_stats.total_count}</div>
                        <div className="text-sm text-slate-500 mt-1">
                            {t("common.amount")}: {stats.payout_stats.total_amount.toLocaleString()} {stats.account_info.currency}
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <Shield size={16} /> {t("aggregators.securityStats")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold sm:text-xl">{stats.security_stats.total_reset_attempts}</div>
                        <div className="text-sm text-slate-500 mt-1">
                            {stats.security_stats.pending_reset_codes} {t("aggregators.pendingResetCodes")}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:p-5 md:p-8">
                {/* Payin Stats */}
                <Card>
                    <CardHeader className="bg-slate-50 border-b">
                        <CardTitle className="text-lg flex items-center gap-2"><TrendingUp size={18} className="text-meta-3" /> {t("aggregators.payinPerformance")}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                            <span className="text-slate-600">{t("aggregators.successfulTransactions")}</span>
                            <span className="font-bold text-meta-3">{stats.payin_stats.success_count}</span>
                        </div>
                        <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                            <span className="text-slate-600">{t("aggregators.failedTransactions")}</span>
                            <span className="font-bold text-red-600">{stats.payin_stats.failed_count}</span>
                        </div>
                        <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                            <span className="text-slate-600">{t("aggregators.totalFees")}</span>
                            <span className="font-bold">{stats.payin_stats.total_fees.toLocaleString()} {stats.account_info.currency}</span>
                        </div>
                        <div className="flex justify-between p-3 rounded-lg bg-blue-50">
                            <span className="text-blue-700">{t("aggregators.lastTransactionAt")}</span>
                            <span className="text-blue-700 font-medium">
                                {stats.payin_stats.last_transaction_at ? formatApiDateTime(stats.payin_stats.last_transaction_at) : t("aggregators.never")}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Payout Stats */}
                <Card>
                    <CardHeader className="bg-slate-50 border-b">
                        <CardTitle className="text-lg flex items-center gap-2"><TrendingUp size={18} className="text-blue-600" /> {t("aggregators.payoutPerformance")}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                            <span className="text-slate-600">{t("aggregators.successfulTransactions")}</span>
                            <span className="font-bold text-meta-3">{stats.payout_stats.success_count}</span>
                        </div>
                        <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                            <span className="text-slate-600">{t("aggregators.failedTransactions")}</span>
                            <span className="font-bold text-red-600">{stats.payout_stats.failed_count}</span>
                        </div>
                        <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                            <span className="text-slate-600">{t("aggregators.totalFees")}</span>
                            <span className="font-bold">{stats.payout_stats.total_fees.toLocaleString()} {stats.account_info.currency}</span>
                        </div>
                        <div className="flex justify-between p-3 rounded-lg bg-blue-50">
                            <span className="text-blue-700">{t("aggregators.lastTransactionAt")}</span>
                            <span className="text-blue-700 font-medium">
                                {stats.payout_stats.last_transaction_at ? formatApiDateTime(stats.payout_stats.last_transaction_at) : t("aggregators.never")}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Network Authorizations Placeholder */}
            {stats.network_authorizations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">{t("aggregators.networkAuthorizations")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-slate-400 italic">Authorization details coming soon...</div>
                    </CardContent>
                </Card>
            )}

            <div className="text-xs text-slate-400 text-right">
                {t("aggregators.statsGeneratedAt")}: {formatApiDateTime(stats.meta.generated_at)}
            </div>
        </div>
    )
}