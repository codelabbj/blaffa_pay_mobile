"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useLanguage } from "@/components/providers/language-provider"
import {
    ArrowLeft,
    ShieldCheck,
    Loader2,
    Save,
    RefreshCcw,
    Calendar,
    Clock,
    User,
    Smartphone,
    Pencil
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useApi } from "@/lib/useApi"
import { DeviceAuthorization } from "@/lib/types/device-authorization"
import { extractErrorMessages } from "@/components/ui/error-display"
import { format } from "date-fns"
import { fr, enUS } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { getApiBaseUrl } from "@/lib/env-config"


export default function DeviceAuthorizationDetailPage() {
    const { id } = useParams()
    const { t, language } = useLanguage()
    const { toast } = useToast()
    const apiFetch = useApi()
    const router = useRouter()
    const baseUrl = getApiBaseUrl()
    const dateLocale = language === 'fr' ? fr : enUS

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [data, setData] = useState<DeviceAuthorization | null>(null)

    // Editable fields
    const [notes, setNotes] = useState("")
    const [isActive, setIsActive] = useState(true)

    const fetchDetail = useCallback(async () => {
        setLoading(true)
        try {
            const response = await apiFetch(`payments/betting/admin/device-authorizations/${id}/`)
            setData(response)
            setNotes(response.notes || "")
            setIsActive(response.is_active)
        } catch (err) {
            toast({
                title: t("common.errorOccurred"),
                description: extractErrorMessages(err) || t("common.failedToLoad"),
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }, [apiFetch, baseUrl, id, t, toast])

    useEffect(() => {
        fetchDetail()
    }, [fetchDetail])

    const handleUpdate = async () => {
        setSaving(true)
        try {
            await apiFetch(`payments/betting/admin/device-authorizations/${id}/`, {
                method: "PATCH",
                body: JSON.stringify({
                    notes,
                    is_active: isActive,
                }),
                successMessage: t("deviceAuthorizations.updateSuccess"),
            })
            fetchDetail()
        } catch (err) {
            toast({
                title: t("common.errorOccurred"),
                description: extractErrorMessages(err) || t("common.failedToUpdate"),
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
                <Loader2 className="h-12 w-12 text-orange-600 animate-spin" />
                <p className="text-slate-500 animate-pulse">{t("common.loading")}</p>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full">
                    <ShieldCheck className="h-12 w-12 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold">{t("common.errorOccurred")}</h2>
                <Button onClick={() => router.back()}>{t("common.previous")}</Button>
            </div>
        )
    }

    const isChanged = notes !== data.notes || isActive !== data.is_active

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Breadcrumb/Back */}
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="hover:bg-slate-100 dark:hover:bg-slate-800 -ml-2"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("common.previous")}
                </Button>

                {/* Title Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-2">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            {t("deviceAuthorizations.detail")}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-mono text-sm">
                            ID: {data.uid}
                        </p>
                    </div>
                    <Badge
                        className={cn(
                            "px-4 py-1.5 text-sm font-semibold shadow-sm border-none ring-1 ring-inset",
                            data.is_active
                                ? "bg-green-100 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-slate-100 text-slate-600 ring-slate-600/20 dark:bg-slate-800 dark:text-slate-400"
                        )}
                    >
                        {data.is_active ? t("common.active") : t("common.inactive")}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                            <CardHeader className="border-b border-slate-50 dark:border-slate-800">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Pencil className="h-5 w-5 text-orange-600" />
                                    {t("deviceAuthorizations.edit")}
                                </CardTitle>
                                <CardDescription>
                                    Modify notes and status transition
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        {t("deviceAuthorizations.notes")}
                                    </Label>
                                    <Input
                                        id="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Enter notes..."
                                        className="h-12 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 focus-visible:ring-orange-500/20"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-semibold">{t("deviceAuthorizations.isActive")}</Label>
                                        <p className="text-sm text-slate-500 italic">
                                            Enable or disable this authorization
                                        </p>
                                    </div>
                                    <Switch
                                        checked={isActive}
                                        onCheckedChange={setIsActive}
                                        className="data-[state=checked]:bg-orange-600"
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 p-6 flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    disabled={saving || !isChanged}
                                    onClick={() => {
                                        setNotes(data.notes || "")
                                        setIsActive(data.is_active)
                                    }}
                                >
                                    <RefreshCcw className="mr-2 h-4 w-4" />
                                    {t("common.cancel")}
                                </Button>
                                <Button
                                    onClick={handleUpdate}
                                    disabled={saving || !isChanged}
                                    className="bg-orange-600 hover:bg-orange-700 text-white min-w-[140px] shadow-lg shadow-orange-600/20"
                                >
                                    {saving ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    {t("common.save")}
                                </Button>
                            </CardFooter>
                        </Card>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm space-y-1">
                                <div className="flex items-center text-slate-400 gap-2 mb-1">
                                    <Calendar className="h-4 w-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-tighter">{t("deviceAuthorizations.createdAt")}</span>
                                </div>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">
                                    {format(new Date(data.created_at), "PPP p", { locale: dateLocale })}
                                </p>
                            </div>
                            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm space-y-1">
                                <div className="flex items-center text-slate-400 gap-2 mb-1">
                                    <Clock className="h-4 w-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-tighter">{t("deviceAuthorizations.updatedAt")}</span>
                                </div>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">
                                    {format(new Date(data.updated_at), "PPP p", { locale: dateLocale })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                            <div className="h-2 bg-orange-600" />
                            <CardHeader>
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">
                                    Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                            <User className="h-4 w-4 text-slate-600" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{t("deviceAuthorizations.partner")}</p>
                                            <p className="font-bold text-slate-900 dark:text-slate-100 leading-tight">{data.partner_name}</p>
                                            <p className="text-[10px] font-mono text-slate-400 truncate w-32">{data.partner_uid}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 pt-2">
                                        <div className="mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                            <Smartphone className="h-4 w-4 text-slate-600" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{t("deviceAuthorizations.device")}</p>
                                            <p className="font-bold text-slate-900 dark:text-slate-100 leading-tight">{data.device_name}</p>
                                            <p className="text-[10px] font-mono text-slate-400 truncate w-32">{data.device_uid}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 p-6 text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                <ShieldCheck className="h-8 w-8 text-orange-600" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 dark:text-white">Secure Authorization</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    This device is authorized for payment processing for the specified partner.
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}