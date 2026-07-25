"use client"

import { useState, useEffect } from "react"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Loader, Plus, Edit2, Eye, Share2, ToggleLeft, ToggleRight, Check, X, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { AggregatorNetworkMapping } from "@/lib/aggregator-api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"

import { formatApiDateTime } from "@/lib/utils";
import { getApiBaseUrl } from "@/lib/env-config"
export default function NetworkMappingsPage() {
    const [mappings, setMappings] = useState<AggregatorNetworkMapping[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [networks, setNetworks] = useState<any[]>([])

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [selectedMapping, setSelectedMapping] = useState<AggregatorNetworkMapping | null>(null)
    const [formLoading, setFormLoading] = useState(false)

    const [formData, setFormData] = useState({
        network: "",
        network_payin_fee_percent: "0",
        network_payout_fee_percent: "0",
        enable_payin: true,
        enable_payout: true,
        payin_processor: "payment_transaction",
        payout_processor: "payment_transaction",
        payin_url: "",
        payout_url: "",
        payin_ussd: "",
        payout_ussd: "",
        payin_comment: "",
        payout_comment: "",
        min_amount: "100",
        max_amount: "100000",
        is_active: true
    })

    const [isMounted, setIsMounted] = useState(false)
    const apiFetch = useApi()
    const { t } = useLanguage()
    const baseUrl = getApiBaseUrl()

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const fetchData = async () => {
        setLoading(true)
        setError("")
        try {
            const [mappingData, networkData] = await Promise.all([
                apiFetch(`aggregator/admin/network-mappings/`),
                apiFetch(`payments/networks/`)

            ])
            setMappings(mappingData.results || [])
            setNetworks(networkData.results || [])
        } catch (err: any) {
            setError(extractErrorMessages(err) || t("common.failedToLoad"))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [apiFetch])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormLoading(true)
        try {
            await apiFetch(`aggregator/admin/network-mappings/`, {
                method: 'POST',
                body: JSON.stringify(formData)
            })
            setIsCreateModalOpen(false)
            fetchData()
            toast({ title: t("common.success"), description: t("aggregators.mappingCreated") })
        } catch (err: any) {
            toast({ title: t("common.error"), description: extractErrorMessages(err), variant: "destructive" })
        } finally {
            setFormLoading(false)
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedMapping) return
        setFormLoading(true)
        try {
            await apiFetch(`aggregator/admin/network-mappings/${selectedMapping.uid}/`, {
                method: 'PATCH',
                body: JSON.stringify(formData)
            })
            setIsEditModalOpen(false)
            fetchData()
            toast({ title: t("common.success"), description: t("aggregators.mappingUpdated") })
        } catch (err: any) {
            toast({ title: "Error", description: extractErrorMessages(err), variant: "destructive" })
        } finally {
            setFormLoading(false)
        }
    }

    const openEdit = (mapping: AggregatorNetworkMapping) => {
        setSelectedMapping(mapping)
        setFormData({
            network: mapping.network,
            network_payin_fee_percent: mapping.network_payin_fee_percent,
            network_payout_fee_percent: mapping.network_payout_fee_percent,
            enable_payin: mapping.enable_payin,
            enable_payout: mapping.enable_payout,
            payin_processor: mapping.payin_processor,
            payout_processor: mapping.payout_processor,
            payin_url: mapping.payin_url,
            payout_url: mapping.payout_url,
            payin_ussd: mapping.payin_ussd,
            payout_ussd: mapping.payout_ussd,
            payin_comment: mapping.payin_comment,
            payout_comment: mapping.payout_comment,
            min_amount: mapping.min_amount,
            max_amount: mapping.max_amount,
            is_active: mapping.is_active
        })
        setIsEditModalOpen(true)
    }

    return (
        <div className="space-y-6 px-4 py-4 sm:py-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-lg font-bold sm:text-xl tracking-tight mb-1">{t("aggregators.networkMappingsTitle")}</h1>
                    <p className="text-muted-foreground text-slate-500">{t("aggregators.networkMappingsSub")}</p>
                </div>
                <Button onClick={() => {
                    setFormData({
                        network: "",
                        network_payin_fee_percent: "0",
                        network_payout_fee_percent: "0",
                        enable_payin: true,
                        enable_payout: true,
                        payin_processor: "payment_transaction",
                        payout_processor: "payment_transaction",
                        payin_url: "",
                        payout_url: "",
                        payin_ussd: "",
                        payout_ussd: "",
                        payin_comment: "",
                        payout_comment: "",
                        min_amount: "100",
                        max_amount: "100000",
                        is_active: true
                    })
                    setIsCreateModalOpen(true)
                }} className="flex gap-2">
                    <Plus size={18} /> {t("aggregators.createMapping")}
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader className="animate-spin mr-2 h-8 w-8 text-blue-600" />
                    <span>{t("common.loading")}...</span>
                </div>
            ) : error ? (
                <ErrorDisplay error={error} onRetry={fetchData} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:p-4 md:p-6">
                    {mappings.map((mapping) => (
                        <Card key={mapping.uid} className={`overflow-hidden border-t-4 ${mapping.is_active ? 'border-t-green-500' : 'border-t-slate-300'}`}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl">{mapping.network_name}</CardTitle>
                                        <Badge variant="outline" className="mt-1 font-mono text-[10px]">{mapping.network_code}</Badge>
                                    </div>
                                    <Badge variant={mapping.is_active ? "success" : "secondary"}>
                                        {mapping.is_active ? t("common.active") : t("common.inactive")}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-2 rounded flex flex-col items-center border border-slate-100">
                                        <span className="text-[10px] uppercase text-slate-400 font-bold">{t("aggregators.payinFeePercent")}</span>
                                        <span className="font-bold text-lg text-blue-600">{mapping.network_payin_fee_percent}%</span>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded flex flex-col items-center border border-slate-100">
                                        <span className="text-[10px] uppercase text-slate-400 font-bold">{t("aggregators.payoutFeePercent")}</span>
                                        <span className="font-bold text-lg text-primary">{mapping.network_payout_fee_percent}%</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">{t("aggregators.payinEnabled")}:</span>
                                        {mapping.enable_payin ? <Check className="text-meta-3" size={16} /> : <X className="text-red-500" size={16} />}
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">{t("aggregators.payoutEnabled")}:</span>
                                        {mapping.enable_payout ? <Check className="text-meta-3" size={16} /> : <X className="text-red-500" size={16} />}
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Min/Max:</span>
                                        <span className="font-medium text-xs">{parseFloat(mapping.min_amount).toLocaleString("en-GB")} - {parseFloat(mapping.max_amount).toLocaleString("en-GB")}</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(mapping)}>
                                        <Edit2 size={14} className="mr-2" /> {t("common.edit")}
                                    </Button>
                                    <Button variant="secondary" size="sm" onClick={() => {
                                        setSelectedMapping(mapping)
                                        setIsDetailModalOpen(true)
                                    }}>
                                        <Eye size={14} />
                                    </Button>

                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isMounted && (
                <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(v) => { if (!v) { setIsCreateModalOpen(false); setIsEditModalOpen(false); } }}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{isCreateModalOpen ? t("aggregators.newMapping") : t("aggregators.editMapping")}</DialogTitle>
                            <DialogDescription>{t("aggregators.networkMappingsSub")}</DialogDescription>
                        </DialogHeader>

                        <form onSubmit={isCreateModalOpen ? handleCreate : handleUpdate} className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("aggregators.chooseNetwork")}</label>
                                    <Select disabled={isEditModalOpen} value={formData.network} onValueChange={(v) => setFormData({ ...formData, network: v })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t("aggregators.chooseNetwork")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {networks.map(n => (
                                                <SelectItem key={n.uid} value={n.uid}>{n.nom}</SelectItem>
                                            ))}
                                        </SelectContent>

                                    </Select>
                                </div>
                                <div className="flex items-end pb-2">
                                    <div className="flex items-center gap-2">
                                        <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData({ ...formData, is_active: v })} />
                                        <span className="text-sm font-medium">{t("aggregators.mappingActive")}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("aggregators.payinFeePercent")}</label>
                                    <Input type="number" step="0.01" value={formData.network_payin_fee_percent} onChange={(e) => setFormData({ ...formData, network_payin_fee_percent: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("aggregators.payoutFeePercent")}</label>
                                    <Input type="number" step="0.01" value={formData.network_payout_fee_percent} onChange={(e) => setFormData({ ...formData, network_payout_fee_percent: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:p-5 md:p-8 border-t pt-4">
                                <div className="space-y-4">
                                    <h3 className="font-bold text-sm text-green-700">{t("aggregators.payinSettings")}</h3>
                                    <div className="flex items-center gap-2">
                                        <Switch checked={formData.enable_payin} onCheckedChange={(v) => setFormData({ ...formData, enable_payin: v })} />
                                        <label className="text-xs">{t("aggregators.payinEnabled")}</label>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs">{t("aggregators.processor")}</label>
                                        <Select value={formData.payin_processor} onValueChange={(v) => setFormData({ ...formData, payin_processor: v })}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="payment_transaction">Payment Transaction</SelectItem>
                                                <SelectItem value="wave_business">Wave Business</SelectItem>
                                                <SelectItem value="momo_pay">MoMo Pay</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Input placeholder={t("aggregators.payinUssdPlaceholder") || "Payin USSD code"} className="h-8 text-xs" value={formData.payin_ussd} onChange={(e) => setFormData({ ...formData, payin_ussd: e.target.value })} />
                                    <Input placeholder={t("aggregators.payinUrlPlaceholder") || "Payin URL"} className="h-8 text-xs" value={formData.payin_url} onChange={(e) => setFormData({ ...formData, payin_url: e.target.value })} />
                                    <textarea
                                        placeholder={t("aggregators.payinCommentPlaceholder") || "Payin Comment"}
                                        className="w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm"
                                        rows={2}
                                        value={formData.payin_comment}
                                        onChange={(e) => setFormData({ ...formData, payin_comment: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-4 text-orange-700">
                                    <h3 className="font-bold text-sm">{t("aggregators.payoutSettings")}</h3>
                                    <div className="flex items-center gap-2">
                                        <Switch checked={formData.enable_payout} onCheckedChange={(v) => setFormData({ ...formData, enable_payout: v })} />
                                        <label className="text-xs">{t("aggregators.payoutEnabled")}</label>
                                    </div>
                                    <div className="space-y-2 text-slate-900">
                                        <label className="text-xs">{t("aggregators.processor")}</label>
                                        <Select value={formData.payout_processor} onValueChange={(v) => setFormData({ ...formData, payout_processor: v })}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="payment_transaction">Payment Transaction</SelectItem>
                                                <SelectItem value="wave_business">Wave Business</SelectItem>
                                                <SelectItem value="momo_pay">MoMo Pay</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Input placeholder={t("aggregators.payoutUssdPlaceholder") || "Payout USSD code"} className="h-8 text-xs" value={formData.payout_ussd} onChange={(e) => setFormData({ ...formData, payout_ussd: e.target.value })} />
                                    <Input placeholder={t("aggregators.payoutUrlPlaceholder") || "Payout URL"} className="h-8 text-xs" value={formData.payout_url} onChange={(e) => setFormData({ ...formData, payout_url: e.target.value })} />
                                    <textarea
                                        placeholder={t("aggregators.payoutCommentPlaceholder") || "Payout Comment"}
                                        className="w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm"
                                        rows={2}
                                        value={formData.payout_comment}
                                        onChange={(e) => setFormData({ ...formData, payout_comment: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("aggregators.minAmount")}</label>
                                    <Input type="number" value={formData.min_amount} onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("aggregators.maxAmount")}</label>
                                    <Input type="number" value={formData.max_amount} onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })} />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}>{t("common.cancel")}</Button>
                                <Button type="submit" disabled={formLoading}>
                                    {formLoading && <Loader className="animate-spin mr-2 h-4 w-4" />}
                                    {isCreateModalOpen ? t("aggregators.createMapping") : t("common.saveChanges")}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            {/* Detail View Modal */}
            {isMounted && (
                <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{t("aggregators.mappingDetails")}</DialogTitle>
                        </DialogHeader>
                        {selectedMapping && (
                            <div className="space-y-6 py-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold sm:text-xl">{selectedMapping.network_name}</h3>
                                        <Badge variant="outline" className="mt-1 font-mono">{selectedMapping.network_code}</Badge>
                                    </div>
                                    <Badge variant={selectedMapping.is_active ? "success" : "secondary"}>
                                        {selectedMapping.is_active ? t("common.active") : t("common.inactive")}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <p className="text-[10px] uppercase text-blue-600 font-bold mb-1">{t("aggregators.payinFeePercent")}</p>
                                        <p className="text-base font-bold sm:text-lg text-blue-700">{selectedMapping.network_payin_fee_percent}%</p>
                                    </div>
                                    <div className="bg-gray p-3 rounded-lg border border-orange-100">
                                        <p className="text-[10px] uppercase text-primary font-bold mb-1">{t("aggregators.payoutFeePercent")}</p>
                                        <p className="text-base font-bold sm:text-lg text-orange-700">{selectedMapping.network_payout_fee_percent}%</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">{t("aggregators.minAmount")}</p>
                                        <p className="text-lg font-bold">{parseFloat(selectedMapping.min_amount).toLocaleString("en-GB")}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">{t("aggregators.maxAmount")}</p>
                                        <p className="text-lg font-bold">{parseFloat(selectedMapping.max_amount).toLocaleString("en-GB")}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:p-4 md:p-6 pt-4 border-t">
                                    <div className="space-y-4">
                                        <h4 className="font-semibold flex items-center gap-2"><ArrowUpRight size={16} className="text-blue-600" /> {t("aggregators.payinSettings")}</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">{t("aggregators.processor")}:</span>
                                                <Badge variant="outline">{selectedMapping.payin_processor}</Badge>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">{t("aggregators.callbackUrl")}:</p>
                                                <code className="text-[10px] bg-slate-100 p-1 rounded block overflow-x-auto whitespace-nowrap">{selectedMapping.payin_url}</code>
                                            </div>
                                            {selectedMapping.payin_ussd && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">{t("aggregators.ussdCode")}:</span>
                                                    <span className="font-mono">{selectedMapping.payin_ussd}</span>
                                                </div>
                                            )}
                                            {selectedMapping.payin_comment && (
                                                <p className="text-xs italic text-slate-500 pt-1">"{selectedMapping.payin_comment}"</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="font-semibold flex items-center gap-2"><ArrowDownLeft size={16} className="text-primary" /> {t("aggregators.payoutSettings")}</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">{t("aggregators.processor")}:</span>
                                                <Badge variant="outline">{selectedMapping.payout_processor}</Badge>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">{t("aggregators.callbackUrl")}:</p>
                                                <code className="text-[10px] bg-slate-100 p-1 rounded block overflow-x-auto whitespace-nowrap">{selectedMapping.payout_url}</code>
                                            </div>
                                            {selectedMapping.payout_ussd && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">{t("aggregators.ussdCode")}:</span>
                                                    <span className="font-mono">{selectedMapping.payout_ussd}</span>
                                                </div>
                                            )}
                                            {selectedMapping.payout_comment && (
                                                <p className="text-xs italic text-slate-500 pt-1">"{selectedMapping.payout_comment}"</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t text-[10px] text-slate-400 grid grid-cols-2 gap-2">
                                    <div>UID: {selectedMapping.uid}</div>
                                    <div className="text-right">Created: {formatApiDateTime(selectedMapping.created_at)}</div>
                                    <div className="text-right col-span-2">{t("aggregators.lastUpdated")}: {formatApiDateTime(selectedMapping.updated_at)}</div>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>{t("common.ok")}</Button>
                            <Button onClick={() => { setIsDetailModalOpen(false); openEdit(selectedMapping!); }}>{t("aggregators.editMapping")}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}        </div>
    )
}

