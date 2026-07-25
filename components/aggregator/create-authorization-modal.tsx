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
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useAggregatorApi, UserAuthorization, NetworkMapping, AggregatorUser } from "@/lib/aggregator-api"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/components/providers/language-provider"
import { Loader, Save, X, Shield, AlertTriangle } from "lucide-react"
import { AsyncCombobox } from "@/components/ui/async-combobox"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"

interface CreateAuthorizationModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    editingAuth?: UserAuthorization | null
}

export function CreateAuthorizationModal({
    open,
    onOpenChange,
    onSuccess,
    editingAuth,
}: CreateAuthorizationModalProps) {
    const { grantAuthorization, updateAuthorization, listNetworkMappings, getAggregatorUsers } = useAggregatorApi()
    const { toast } = useToast()
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState<Partial<UserAuthorization>>({
        user: "",
        network: "",
        user_payin_fee_percent: 0,
        user_payout_fee_percent: 0,
        is_active: true,
    })

    useEffect(() => {
        if (open) {
            if (editingAuth) {
                setFormData({
                    user: editingAuth.user,
                    network: editingAuth.network,
                    user_payin_fee_percent: editingAuth.user_payin_fee_percent,
                    user_payout_fee_percent: editingAuth.user_payout_fee_percent,
                    is_active: editingAuth.is_active,
                })
            } else {
                setFormData({
                    user: "",
                    network: "",
                    user_payin_fee_percent: 0,
                    user_payout_fee_percent: 0,
                    is_active: true,
                })
            }
            setError(null)
        }
    }, [open, editingAuth])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target
        setFormData(prev => ({ ...prev, [id]: value }))
    }

    const handleSelectChange = (id: string, value: string) => {
        setFormData(prev => ({ ...prev, [id]: value }))
    }

    const fetchUsersData = async (search: string) => {
        const params = new URLSearchParams()
        if (search) params.append("search", search)
        const data = await getAggregatorUsers(params)
        const usersList = data?.results || data?.users || (Array.isArray(data) ? data : [])
        return usersList.map((user: AggregatorUser) => ({
            value: user.uid,
            label: `${user.display_name} (${user.email})`
        }))
    }

    const fetchNetworksData = async (search: string) => {
        const params = new URLSearchParams()
        if (search) params.append("search", search)
        const data = await listNetworkMappings(params)
        const networksList = data?.results || data?.networks || (Array.isArray(data) ? data : [])
        return networksList.map((network: NetworkMapping) => ({
            value: network.uid,
            label: `${network.network_name || network.network} (${network.network})`
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            if (editingAuth) {
                await updateAuthorization(editingAuth.uid, formData)
            } else {
                await grantAuthorization(formData)
            }
            onSuccess?.()
            toast({
                title: t(editingAuth ? "aggregator.authorizationUpdated" : "aggregator.authorizationGranted"),
                description: `${formData.user} access to ${formData.network} configured.`,
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
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-0 shadow-2xl">
                <div className="bg-gradient-to-r from-primary to-primary p-3 sm:p-4 md:p-6 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold sm:text-xl flex items-center gap-2">
                            <Shield className="h-6 w-6" />
                            {editingAuth ? <span>{t("aggregator.editAuthorization")}</span> : <span>{t("aggregator.grantAuthorization")}</span>}
                        </DialogTitle>
                        <DialogDescription className="text-orange-100">
                            <span>{t("aggregator.configureAccess")}</span>
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-3 sm:p-4 md:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {error && (
                        <ErrorDisplay
                            error={error}
                            onDismiss={() => setError(null)}
                            variant="inline"
                        />
                    )}
                    <form id="authorization-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:p-4 md:p-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700 dark:text-bodydark">
                                    <span>{t("aggregator.aggregatorUser")}</span>
                                </Label>
                                {editingAuth ? (
                                    <div className="p-3 bg-gray-50 dark:bg-boxdark rounded-lg border border-gray-100 dark:border-strokedark font-medium text-gray-900 dark:text-gray-100 italic">
                                        {editingAuth.user_name || editingAuth.user}
                                    </div>
                                ) : (
                                    <AsyncCombobox
                                        onSearch={fetchUsersData}
                                        value={formData.user}
                                        onValueChange={(v) => handleSelectChange("user", v)}
                                        placeholder={t("aggregator.selectAggregator")}
                                        searchPlaceholder={t("common.searchPlaceholder") || "Search user..."}
                                        emptyMessage={t("common.noResults") || "No user found."}
                                        className="bg-gray-50 dark:bg-boxdark border-stroke"
                                    />
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700 dark:text-bodydark">
                                    <span>{t("aggregator.paymentNetwork")}</span>
                                </Label>
                                {editingAuth ? (
                                    <div className="p-3 bg-gray-50 dark:bg-boxdark rounded-lg border border-gray-100 dark:border-strokedark font-medium text-gray-900 dark:text-gray-100 italic">
                                        {editingAuth.network_name || editingAuth.network}
                                    </div>
                                ) : (
                                    <AsyncCombobox
                                        onSearch={fetchNetworksData}
                                        value={formData.network}
                                        onValueChange={(v) => handleSelectChange("network", v)}
                                        placeholder={t("aggregator.selectNetwork")}
                                        searchPlaceholder={t("common.searchPlaceholder") || "Search network..."}
                                        emptyMessage={t("common.noResults") || "No network found."}
                                        className="bg-gray-50 dark:bg-boxdark border-stroke"
                                    />
                                )}
                            </div>
                        </div>

                        <Separator className="bg-gray-100 dark:bg-meta-4" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:p-4 md:p-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700 dark:text-bodydark" htmlFor="user_payin_fee_percent">
                                    <span>{t("aggregator.payinFee")} (%)</span>
                                </Label>
                                <Input
                                    id="user_payin_fee_percent"
                                    type="number"
                                    step="0.01"
                                    value={formData.user_payin_fee_percent}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="bg-gray-50 dark:bg-boxdark border-stroke focus:ring-primary"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700 dark:text-bodydark" htmlFor="user_payout_fee_percent">
                                    <span>{t("aggregator.payoutFee")} (%)</span>
                                </Label>
                                <Input
                                    id="user_payout_fee_percent"
                                    type="number"
                                    step="0.01"
                                    value={formData.user_payout_fee_percent}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="bg-gray-50 dark:bg-boxdark border-stroke focus:ring-green-500"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center p-4 bg-gray-50 dark:bg-boxdark rounded-xl border border-gray-100 dark:border-strokedark">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100"><span>{t("aggregator.status")}</span></Label>
                                <div className="text-xs text-body">{formData.is_active ? <span>{t("common.active")}</span> : <span>{t("aggregator.locked")}</span>}</div>
                            </div>
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                                className="data-[state=checked]:bg-primary"
                            />
                        </div>
                    </form>
                </div>

                <DialogFooter className="bg-gray-50 dark:bg-boxdark-2/50 p-3 sm:p-4 md:p-6 border-t dark:border-gray-800 flex items-center justify-end gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading} className="hover:bg-gray-100 dark:hover:bg-boxdark">
                        <span>{t("common.cancel")}</span>
                    </Button>
                    <Button
                        form="authorization-form"
                        type="submit"
                        disabled={loading}
                        className="bg-primary hover:bg-primary shadow-md transition-all hover:shadow-lg px-3 sm:px-6"
                    >
                        {loading && <Loader className="animate-spin mr-2 h-4 w-4" />}
                        <Save className="mr-2 h-4 w-4" />
                        <span>{t("common.save")}</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
