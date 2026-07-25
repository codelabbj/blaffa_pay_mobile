"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, Loader2 } from "lucide-react"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { Device } from "@/lib/types/device-authorization"
import { Badge } from "@/components/ui/badge"
import { getApiBaseUrl } from "@/lib/env-config"

interface DeviceSelectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (device: Device) => void;
    selectedDeviceUid?: string;
}

export function DeviceSelectionModal({
    open,
    onOpenChange,
    onSelect,
    selectedDeviceUid,
}: DeviceSelectionModalProps) {
    const { t } = useLanguage()
    const apiFetch = useApi()
    const baseUrl = getApiBaseUrl()

    const [loading, setLoading] = useState(false)
    const [devices, setDevices] = useState<Device[]>([])
    const [searchTerm, setSearchTerm] = useState("")

    const fetchDevices = useCallback(async () => {
        setLoading(true)
        try {
            const response = await apiFetch(`payments/stats/devices/`)
            const data = Array.isArray(response) ? response : (response.results || [])
            setDevices(data)
        } catch (err) {
            console.error("Failed to fetch devices", err)
        } finally {
            setLoading(false)
        }
    }, [apiFetch, baseUrl])

    useEffect(() => {
        if (open) {
            fetchDevices()
        }
    }, [open, fetchDevices])

    // Simple local filtering for devices since we fetch them all
    const filteredDevices = devices.filter(device =>
        device.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.device_id?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle><span>{t("deviceAuthorizations.selectDevice")}</span></DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder={t("common.search")}
                            onValueChange={setSearchTerm}
                        />
                        <CommandList className="max-h-[300px]">
                            <CommandEmpty>
                                {loading ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                ) : (
                                    <span>{t("common.noData")}</span>
                                )}
                            </CommandEmpty>
                            <CommandGroup>
                                {filteredDevices.map((device) => (
                                    <CommandItem
                                        key={device.uid}
                                        onSelect={() => {
                                            onSelect(device)
                                            onOpenChange(false)
                                        }}
                                        className="flex flex-wrap items-start justify-between gap-3 sm:items-center py-3 cursor-pointer"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">{device.device_name || device.device_id}</span>
                                            <span className="text-xs text-muted-foreground">{device.device_id}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={device.is_online ? 'success' : 'secondary'} className="text-[10px]">
                                                {device.is_online ? <span>{t('common.online')}</span> : <span>{t('common.offline')}</span>}
                                            </Badge>
                                            {selectedDeviceUid === device.uid && (
                                                <Check className="h-4 w-4 text-primary" />
                                            )}
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline"><span>{t("common.cancel")}</span></Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
