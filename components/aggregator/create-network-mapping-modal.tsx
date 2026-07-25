"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useAggregatorApi, NetworkMapping } from "@/lib/aggregator-api"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/components/providers/language-provider"
import { Loader, Save, Globe, Zap, AlertTriangle } from "lucide-react"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { AsyncCombobox } from "@/components/ui/async-combobox"

interface CreateNetworkMappingModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    editingMapping?: NetworkMapping | null
}

export function CreateNetworkMappingModal({
    open,
    onOpenChange,
    onSuccess,
    editingMapping,
}: CreateNetworkMappingModalProps) {
    const { createNetworkMapping, updateNetworkMapping, getNetworks } = useAggregatorApi()
    const { toast } = useToast()
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [networks, setNetworks] = useState<any[]>([])
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState<Partial<NetworkMapping>>({
        network: "",
        network_name: "",
        network_payin_fee_percent: "0.00",
        enable_payin: true,
        payin_processor: "orange_money",
        payin_url: "",
        min_amount: "100",
        max_amount: "1000000",
    })

    const fetchNetworksData = async (search: string) => {
        const params = new URLSearchParams()
        if (search) params.append("search", search)
        const data = await getNetworks(params)
        const networksList = data?.results || data || []

        // Cache networks for finding the name later
        setNetworks(networksList)

        return networksList.map((network: any) => ({
            value: network.uid || network.id,
            label: `${network.nom} (${network.code})`
        }))
    }

    useEffect(() => {
        if (open) {
            if (editingMapping) {
                setFormData({
                    network: editingMapping.network,
                    network_name: editingMapping.network_name,
                    network_payin_fee_percent: editingMapping.network_payin_fee_percent,
                    enable_payin: editingMapping.enable_payin,
                    payin_processor: editingMapping.payin_processor,
                    payin_url: editingMapping.payin_url,
                    min_amount: editingMapping.min_amount,
                    max_amount: editingMapping.max_amount,
                })
            } else {
                setFormData({
                    network: "",
                    network_name: "",
                    network_payin_fee_percent: "0.00",
                    enable_payin: true,
                    payin_processor: "orange_money",
                    payin_url: "",
                    min_amount: "100",
                    max_amount: "1000000",
                })
            }
            setError(null)
        }
    }, [open, editingMapping])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target
        setFormData(prev => ({ ...prev, [id]: value }))
    }

    const handleSelectChange = (id: string, value: string) => {
        setFormData(prev => ({ ...prev, [id]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            if (editingMapping) {
                await updateNetworkMapping(editingMapping.uid, formData)
            } else {
                await createNetworkMapping(formData)
            }
            onSuccess?.()
            toast({
                title: t("aggregator.mappingSaved"),
                description: `${formData.network_name || formData.network} configuration updated.`,
            })
            onOpenChange(false)
        } catch (err: any) {
            const errorMessage = extractErrorMessages(err)
            setError(errorMessage)
            toast({
                title: t("common.error"),
                description: errorMessage,
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden border-0 shadow-2xl">
                <div className="bg-gradient-to-r from-primary to-meta-3 p-3 sm:p-4 md:p-6 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold sm:text-xl flex items-center gap-2">
                            <Zap className="h-6 w-6" />
                            {editingMapping ? <span>{t("aggregator.editMapping")}</span> : <span>{t("aggregator.createMapping")}</span>}
                        </DialogTitle>
                        <DialogDescription className="text-orange-100">
                            <span>{t("aggregator.configureInfrastructure")}</span>
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-3 sm:p-4 md:p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {error && (
                        <ErrorDisplay
                            error={error}
                            onDismiss={() => setError(null)}
                            variant="inline"
                        />
                    )}
                    <form id="network-mapping-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:p-4 md:p-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700 dark:text-bodydark" htmlFor="network">
                                    <span>{t("aggregator.network")}</span>
                                </Label>
                                <AsyncCombobox
                                    value={formData.network || ""}
                                    onValueChange={(v) => {
                                        const selected = networks.find(n => (n.uid || n.id) === v)
                                        setFormData(prev => ({
                                            ...prev,
                                            network: v,
                                            network_name: selected ? selected.nom : prev.network_name
                                        }))
                                    }}
                                    fetchOptions={fetchNetworksData}
                                    placeholder={t("aggregator.selectNetwork")}
                                    searchPlaceholder={t("common.searchPlaceholder")}
                                    noResultsMessage={t("common.noResults")}
                                    disabled={!!editingMapping}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700 dark:text-bodydark" htmlFor="network_name">
                                    <span>{t("aggregator.displayName")}</span>
                                </Label>
                                <Input
                                    id="network_name"
                                    value={formData.network_name}
                                    onChange={handleChange}
                                    placeholder="ex: MTN Côte d'Ivoire"
                                    className="bg-gray-50 dark:bg-boxdark border-stroke"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:p-4 md:p-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700 dark:text-bodydark">
                                    <span>{t("aggregator.processor")}</span>
                                </Label>
                                <Select value={formData.payin_processor} onValueChange={(v) => handleSelectChange("payin_processor", v)}>
                                    <SelectTrigger className="bg-gray-50 dark:bg-boxdark border-stroke">
                                        <SelectValue placeholder={t("aggregator.selectNetwork")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ORANGE_MONEY">Orange Money</SelectItem>
                                        <SelectItem value="MOOV">Moov</SelectItem>
                                        <SelectItem value="MTN">MTN</SelectItem>
                                        <SelectItem value="WAVE">Wave</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700 dark:text-bodydark" htmlFor="network_payin_fee_percent">
                                    <span>{t("aggregator.baseFee")} (%)</span>
                                </Label>
                                <Input
                                    id="network_payin_fee_percent"
                                    type="number"
                                    step="0.01"
                                    value={formData.network_payin_fee_percent}
                                    onChange={handleChange}
                                    className="bg-gray-50 dark:bg-boxdark border-stroke"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-bodydark" htmlFor="payin_url">
                                <span>{t("aggregator.gatewayUrl")}</span>
                            </Label>
                            <Input
                                id="payin_url"
                                value={formData.payin_url}
                                onChange={handleChange}
                                placeholder="https://api.processor.com/v1"
                                className="bg-gray-50 dark:bg-boxdark border-stroke"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:p-4 md:p-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700 dark:text-bodydark" htmlFor="min_amount">
                                    <span>{t("aggregator.minAmount")}</span>
                                </Label>
                                <Input
                                    id="min_amount"
                                    type="number"
                                    value={formData.min_amount}
                                    onChange={handleChange}
                                    className="bg-gray-50 dark:bg-boxdark border-stroke"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700 dark:text-bodydark" htmlFor="max_amount">
                                    <span>{t("aggregator.maxAmount")}</span>
                                </Label>
                                <Input
                                    id="max_amount"
                                    type="number"
                                    value={formData.max_amount}
                                    onChange={handleChange}
                                    className="bg-gray-50 dark:bg-boxdark border-stroke"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center p-4 bg-gray-50 dark:bg-boxdark rounded-xl border border-gray-100 dark:border-strokedark shadow-sm">
                                <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100 cursor-pointer" htmlFor="enable_payin">
                                    <span>{t("aggregator.enablePayin")}</span>
                                </Label>
                                <Switch
                                    id="enable_payin"
                                    checked={formData.enable_payin}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_payin: checked }))}
                                    className="data-[state=checked]:bg-primary"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <DialogFooter className="bg-gray-50 dark:bg-boxdark-2/50 p-3 sm:p-4 md:p-6 border-t dark:border-gray-800 flex items-center justify-end gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading} className="hover:bg-gray-100 dark:hover:bg-boxdark">
                        <span>{t("common.cancel")}</span>
                    </Button>
                    <Button
                        form="network-mapping-form"
                        type="submit"
                        disabled={loading}
                        className="bg-primary hover:bg-opacity-90 text-white shadow-md hover:shadow-lg transition-all px-3 sm:px-6"
                    >
                        {loading && <Loader className="animate-spin mr-2 h-4 w-4" />}
                        <span>{t("common.save")}</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
