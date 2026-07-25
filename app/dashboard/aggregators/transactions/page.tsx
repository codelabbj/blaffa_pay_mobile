"use client"

import { useState, useEffect, useCallback } from "react"
import { useAggregatorApi, AggregatorTransaction } from "@/lib/aggregator-api"
import { useLanguage } from "@/components/providers/language-provider"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    Loader,
    RefreshCw,
    FileText,
    ArrowUpRight,
    ArrowDownLeft,
    Filter,
    Search,
    Download,
    Activity,
    User,
    ArrowRightLeft,
    Eye,
    ExternalLink,
    CheckCircle2,
    XCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { DateRangeFilter } from "@/components/ui/date-range-filter"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { formatApiDateTime } from "@/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

export default function AggregatorTransactionsPage() {
    const { t } = useLanguage()
    const { listTransactions } = useAggregatorApi()
    const { toast } = useToast()
    const router = useRouter()

    const [transactions, setTransactions] = useState<AggregatorTransaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [status, setStatus] = useState<string>("all")
    const [type, setType] = useState<string>("all")
    const [userUid, setUserUid] = useState<string>("")
    const [startDate, setStartDate] = useState<string | null>(null)
    const [endDate, setEndDate] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({
        total_pages: 1,
        total_count: 0,
        has_next: false,
        has_previous: false
    })
    const [selectedTx, setSelectedTx] = useState<AggregatorTransaction | null>(null)
    const [showDetail, setShowDetail] = useState(false)

    const fetchTransactions = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const params = new URLSearchParams()
            if (searchTerm) params.append("search", searchTerm)
            if (status !== "all") params.append("status", status)
            if (type !== "all") params.append("type", type)
            if (userUid) params.append("user", userUid)
            if (startDate) params.append("date_from", startDate)
            if (endDate) params.append("date_to", endDate)
            params.append("page", page.toString())

            const data = await listTransactions(params)
            setTransactions(data.results || data.transactions || data || [])
            if (data.pagination) {
                setPagination(data.pagination)
            }
        } catch (err: any) {
            setError(err.message || "Failed to load transactions")
        } finally {
            setLoading(false)
        }
    }, [listTransactions, searchTerm, status, type, userUid, startDate, endDate, page])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTransactions()
        }, 500)
        return () => clearTimeout(timer)
    }, [fetchTransactions])

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
            pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
            failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        }
        return (
            <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
                {status.toUpperCase()}
            </Badge>
        )
    }

    const getStatusVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'success': return 'success'
            case 'failed': return 'destructive'
            case 'pending': return 'warning'
            case 'processing': return 'info'
            case 'cancelled': return 'secondary'
            default: return 'outline'
        }
    }

    const getActiveRef = (tx: AggregatorTransaction) => {
        if (tx.payment_transaction_ref && tx.payment_transaction_ref.uid) {
            return { type: "payment", ref: tx.payment_transaction_ref }
        }
        if (tx.momo_transaction_ref && (tx.momo_transaction_ref as any).uid) {
            return { type: "momo", ref: tx.momo_transaction_ref as any }
        }
        if (tx.wave_transaction_ref && (tx.wave_transaction_ref as any).uid) {
            return { type: "wave", ref: tx.wave_transaction_ref as any }
        }
        return null
    }

    const handleMoreInfo = (tx: AggregatorTransaction) => {
        const activeRef = getActiveRef(tx)
        if (!activeRef) return
        setShowDetail(false)

        // Wait for Radix UI dialog close animation to clear the DOM to prevent 'removeChild' conflicts during Next.js routing
        setTimeout(() => {
            if (activeRef.type === "payment") {
                router.push(`/dashboard/transactions?uid=${activeRef.ref.uid}`)
            } else if (activeRef.type === "momo") {
                router.push(`/dashboard/momo-pay?uid=${activeRef.ref.uid}`)
            } else if (activeRef.type === "wave") {
                router.push(`/dashboard/wave-business-transaction?uid=${activeRef.ref.uid}`)
            }
        }, 150)
    }

    const renderRefTypeBadge = (type: string) => {
        const labels: Record<string, string> = {
            payment: "Transaction",
            momo: "MoMo Pay",
            wave: "Wave Business",
        }
        const colors: Record<string, string> = {
            payment: "bg-blue-100 text-blue-800 border-blue-200",
            momo: "bg-yellow-100 text-yellow-800 border-yellow-200",
            wave: "bg-teal-100 text-teal-800 border-teal-200",
        }
        return (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colors[type] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                {labels[type] || type}
            </span>
        )
    }

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-lg font-bold sm:text-xl bg-gradient-to-r from-primary to-meta-3 bg-clip-text text-transparent">
                        {t("aggregator.auditLog")}
                    </h1>
                    <p className="text-body dark:text-bodydark mt-1">
                        {t("aggregator.auditTrailDesc")}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={fetchTransactions} variant="outline" className="border-stroke">
                        <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                        <span>{t("common.refresh")}</span>
                    </Button>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" /> <span>{t("aggregator.export")}</span>
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap gap-4">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bodydark2" />
                                <Input
                                    placeholder={t("transactions.searchReference")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-gray-50 dark:bg-boxdark"
                                />
                            </div>
                            <div className="w-[150px]">
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger className="bg-gray-50 dark:bg-boxdark">
                                        <SelectValue placeholder={t("aggregator.status")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t("common.allStatus")}</SelectItem>
                                        <SelectItem value="SUCCESS">SUCCESS</SelectItem>
                                        <SelectItem value="PENDING">PENDING</SelectItem>
                                        <SelectItem value="FAILED">FAILED</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-[150px]">
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger className="bg-gray-50 dark:bg-boxdark">
                                        <SelectValue placeholder={t("aggregator.type")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t("common.allTypes")}</SelectItem>
                                        <SelectItem value="payin">PAYIN</SelectItem>
                                        <SelectItem value="payout">PAYOUT</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex-1 min-w-[200px]">
                                <Input
                                    placeholder={t("aggregator.userUid")}
                                    value={userUid}
                                    onChange={(e) => setUserUid(e.target.value)}
                                    className="bg-gray-50 dark:bg-boxdark"
                                />
                            </div>
                            <div className="w-[300px]">
                                <DateRangeFilter
                                    startDate={startDate}
                                    endDate={endDate}
                                    onStartDateChange={setStartDate}
                                    onEndDateChange={setEndDate}
                                    onClear={() => {
                                        setStartDate(null)
                                        setEndDate(null)
                                    }}
                                    placeholder={t("common.filterByDate")}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="border-b bg-gray-50/50 dark:bg-boxdark-2/50">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        {t("aggregator.financialFlows")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading && transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader className="animate-spin h-8 w-8 text-primary mb-2" />
                            <span className="text-body">{t("aggregator.loadingAudit")}</span>
                        </div>
                    ) : error ? (
                        <div className="py-20 text-center text-red-500">{error}</div>
                    ) : transactions.length === 0 ? (
                        <div className="py-20 text-center text-body">{t("aggregator.noTransactions")}</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50/50 dark:bg-boxdark-2/50">
                                    <TableRow>
                                        <TableHead className="text-xs">UID</TableHead>
                                        <TableHead>{t("common.reference")}</TableHead>
                                        <TableHead>{t("common.user") + " / " + t("common.network")}</TableHead>
                                        <TableHead>{t("common.recipient")}</TableHead>
                                        <TableHead>Processor</TableHead>
                                        <TableHead>{t("common.type")}</TableHead>
                                        <TableHead>{t("common.amount")}</TableHead>
                                        <TableHead>{t("common.status")}</TableHead>
                                        <TableHead>Webhook</TableHead>
                                        <TableHead>W. Code</TableHead>
                                        <TableHead>{t("common.createdAt")}</TableHead>
                                        <TableHead className="w-[80px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={12} className="text-center py-6 sm:py-10 text-slate-400" data-label="UID">
                                                {t("aggregators.noTransactionsMatch")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        transactions.map((tx) => (
                                            <TableRow key={tx.uid}>
                                                <TableCell className="font-mono text-[10px] text-slate-400 max-w-[90px] truncate" data-label="UID">
                                                    <span title={tx.uid}>{tx.uid.slice(0, 8)}…</span>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {tx.reference}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-sm"><span>{tx.user_display_name || tx.user_name}</span></div>
                                                    <div className="text-xs text-slate-400"><span>{tx.user_email}</span></div>
                                                    <div className="text-[10px] text-slate-300"><span>{tx.network_name || tx.network}</span></div>
                                                </TableCell>
                                                <TableCell className="text-xs font-mono text-slate-600">
                                                    <span>{tx.recipient_phone || "—"}</span>
                                                </TableCell>
                                                <TableCell className="text-xs text-slate-600" data-label="Processor">
                                                    <span>{tx.processor_type || "—"}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        {tx.transaction_type === 'payout' ? (
                                                            <ArrowDownLeft size={14} className="text-primary" />
                                                        ) : (
                                                            <ArrowUpRight size={14} className="text-meta-3" />
                                                        )}
                                                        <span className="capitalize text-sm">{tx.transaction_type}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-semibold"><span>{parseFloat(tx.amount).toLocaleString()}</span></div>
                                                    <div className="text-[10px] text-slate-400">
                                                        <span>{t("common.netAmount")}</span>: <span>{parseFloat(tx.net_amount).toLocaleString()}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusVariant(tx.status)}>
                                                        <span>{tx.status}</span>
                                                    </Badge>
                                                </TableCell>
                                                <TableCell data-label="Webhook">
                                                    {tx.webhook_sent ? (
                                                        <CheckCircle2 size={16} className="text-meta-3" />
                                                    ) : (
                                                        <XCircle size={16} className="text-slate-300" />
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs text-slate-600" data-label="W. Code">
                                                    <span>{tx.webhook_response_code ?? "—"}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs text-slate-600">
                                                        {formatApiDateTime(tx.created_at)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" onClick={() => { setSelectedTx(tx); setShowDetail(true); }}>
                                                        <Eye size={16} />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
                {pagination.total_pages > 1 && (
                    <div className="p-4 border-t bg-gray-50/30 dark:bg-boxdark-2/30 flex flex-wrap items-start justify-between gap-3 sm:items-center">
                        <p className="text-sm text-body">
                            <span>{t("common.showing")}</span> <span className="font-medium">{transactions.length}</span> <span>{t("common.of")}</span> <span className="font-medium">{pagination.total_count}</span>
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!pagination.has_previous || loading}
                                onClick={() => setPage(prev => prev - 1)}
                            >
                                {t("common.previous")}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!pagination.has_next || loading}
                                onClick={() => setPage(prev => prev + 1)}
                            >
                                {t("common.next")}
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Detail Modal */}
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t("common.transactionDetails")}</DialogTitle>
                        <DialogDescription>{t("aggregators.fullRecordFor", { reference: selectedTx?.reference || "" })}</DialogDescription>
                    </DialogHeader>
                    {selectedTx && (
                        <div className="space-y-5 mt-2">

                            {/* Identifiers */}
                            <section>
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Identifiants</h4>
                                <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">UID :</span>
                                        <span className="font-mono text-xs text-slate-700">{selectedTx.uid}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">{t("common.reference")} :</span>
                                        <span className="font-mono text-xs text-slate-700">{selectedTx.reference}</span>
                                    </div>
                                    {selectedTx.external_id && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">External ID :</span>
                                            <span className="font-mono text-xs text-slate-700">{selectedTx.external_id}</span>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                {/* Participant */}
                                <section>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t("common.participant")}</h4>
                                    <div className="bg-slate-50 p-3 rounded-lg space-y-1 text-sm">
                                        <div><span className="text-slate-500">Nom : </span><span className="font-medium">{selectedTx.user_display_name || selectedTx.user_name}</span></div>
                                        <div><span className="text-slate-500">Email : </span><span>{selectedTx.user_email}</span></div>
                                        {selectedTx.user_phone && (
                                            <div><span className="text-slate-500">Tél (user) : </span><span>{selectedTx.user_phone}</span></div>
                                        )}
                                        <div><span className="text-slate-500">{t("common.recipient")} : </span><span>{selectedTx.recipient_phone}</span></div>
                                    </div>
                                </section>

                                {/* Network & Processor */}
                                <section>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t("common.networkLayer")}</h4>
                                    <div className="bg-slate-50 p-3 rounded-lg space-y-1 text-sm">
                                        <div><span className="text-slate-500">Réseau : </span><span className="font-medium">{selectedTx.network_name || selectedTx.network}</span></div>
                                        <div><span className="text-slate-500">Processor : </span><span>{selectedTx.processor_type || "—"}</span></div>
                                    </div>
                                </section>

                                {/* Transaction Details */}
                                <section>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Détails transaction</h4>
                                    <div className="bg-slate-50 p-3 rounded-lg space-y-1 text-sm">
                                        <div className="flex justify-between"><span className="text-slate-500">Type :</span><span>{selectedTx.transaction_type}</span></div>
                                        {selectedTx.objet && <div className="flex justify-between"><span className="text-slate-500">Objet :</span><span>{selectedTx.objet}</span></div>}
                                        {selectedTx.commentaire && <div className="flex justify-between"><span className="text-slate-500">Commentaire :</span><span>{selectedTx.commentaire}</span></div>}
                                        {selectedTx.payment_url && <div className="flex justify-between"><span className="text-slate-500">Payment URL :</span><span className="text-xs break-all">{selectedTx.payment_url}</span></div>}
                                        {selectedTx.payment_ussd && <div className="flex justify-between"><span className="text-slate-500">USSD :</span><span>{selectedTx.payment_ussd}</span></div>}
                                        {selectedTx.payment_comment && <div className="flex justify-between"><span className="text-slate-500">Payment comment :</span><span>{selectedTx.payment_comment}</span></div>}
                                    </div>
                                </section>

                                {/* Financials */}
                                <section>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t("common.financials")}</h4>
                                    <div className="bg-slate-50 p-3 rounded-lg space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>{t("common.baseAmount")} :</span>
                                            <span className="font-semibold">{selectedTx.amount}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-500 text-xs">
                                            <span>Montant brut :</span>
                                            <span>{selectedTx.underlying_amount}</span>
                                        </div>
                                        <div className="flex justify-between text-primary">
                                            <span>{t("common.networkFee")} :</span>
                                            <span>-{selectedTx.network_fee_amount || selectedTx.network_fee} ({selectedTx.network_fee_percent}%)</span>
                                        </div>
                                        <div className="flex justify-between text-blue-600">
                                            <span>{t("common.userFee")} :</span>
                                            <span>{selectedTx.user_fee_amount || selectedTx.user_fee} ({selectedTx.user_fee_percent}%)</span>
                                        </div>
                                        <div className="border-t pt-2 flex justify-between font-bold text-slate-900">
                                            <span>{t("common.netAmount")} :</span>
                                            <span>{selectedTx.net_amount}</span>
                                        </div>
                                        <div className="flex justify-between text-pink-600 font-medium italic">
                                            <span>{t("aggregators.platformProfit")} :</span>
                                            <span>{selectedTx.platform_profit}</span>
                                        </div>
                                    </div>
                                </section>

                            </div>

                            {/* Webhook */}
                            <section>
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Webhook</h4>
                                <div className="bg-slate-50 p-3 rounded-lg grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <div className="text-slate-500 text-xs mb-1">Envoyé</div>
                                        {selectedTx.webhook_sent ? (
                                            <Badge variant="outline" className="text-meta-3 border-green-300 bg-green-50">Oui</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-slate-400">Non</Badge>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-xs mb-1">Envoyé le</div>
                                        <div className="text-xs">{selectedTx.webhook_sent_at ? formatApiDateTime(selectedTx.webhook_sent_at) : "—"}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-xs mb-1">Code réponse</div>
                                        <div className="font-mono font-semibold">{selectedTx.webhook_response_code ?? "—"}</div>
                                    </div>
                                </div>
                            </section>

                            {/* Status & Dates */}
                            <section>
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t("common.statusAndMeta")}</h4>
                                <div className="bg-slate-50 p-3 rounded-lg space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500">{t("common.currentStatus")} :</span>
                                        <Badge variant={getStatusVariant(selectedTx.status)}>{selectedTx.status}</Badge>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>{t("common.createdAt")} :</span>
                                        <span>{formatApiDateTime(selectedTx.created_at)}</span>
                                    </div>
                                    {selectedTx.completed_at && (
                                        <div className="flex justify-between text-xs text-slate-400">
                                            <span>{t("common.completed")} :</span>
                                            <span>{formatApiDateTime(selectedTx.completed_at)}</span>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Error Message */}
                            {selectedTx.error_message && (
                                <section className="bg-red-50 border border-red-100 p-3 rounded-lg">
                                    <h4 className="text-xs font-semibold text-red-600 uppercase mb-1">{t("common.errorMessage")}</h4>
                                    <p className="text-sm text-red-700">{selectedTx.error_message}</p>
                                </section>
                            )}

                            {/* Linked Transaction Ref */}
                            {(() => {
                                const activeRef = getActiveRef(selectedTx)
                                if (!activeRef) return null
                                return (
                                    <section>
                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                            Transaction liée {renderRefTypeBadge(activeRef.type)}
                                        </h4>
                                        <div className="bg-slate-50 p-3 rounded-lg space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">{t("common.uid")} :</span>
                                                <span className="font-mono text-xs">{activeRef.ref.uid}</span>
                                            </div>
                                            {activeRef.ref.reference && (
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">{t("transactions.reference")} :</span>
                                                    <span className="font-mono text-xs">{activeRef.ref.reference}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">{t("transactions.status")} :</span>
                                                <Badge variant={getStatusVariant(activeRef.ref.status || "")}>{activeRef.ref.status}</Badge>
                                            </div>
                                        </div>
                                    </section>
                                )
                            })()}

                            {/* Footer: More Info Button */}
                            {(() => {
                                const activeRef = getActiveRef(selectedTx)
                                if (!activeRef) return null
                                return (
                                    <div className="flex justify-end pt-2 border-t">
                                        <Button
                                            variant="default"
                                            className="flex items-center gap-2"
                                            onClick={() => handleMoreInfo(selectedTx)}
                                        >
                                            <ExternalLink size={16} />
                                            <span>{t("aggregators.moreInfo")}</span>
                                        </Button>
                                    </div>
                                )
                            })()}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}


