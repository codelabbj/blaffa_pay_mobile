"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { Partner } from "@/lib/types/device-authorization"
import { getApiBaseUrl } from "@/lib/env-config"

interface PartnerSelectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (partner: Partner) => void;
    selectedPartnerUid?: string;
}

export function PartnerSelectionModal({
    open,
    onOpenChange,
    onSelect,
    selectedPartnerUid,
}: PartnerSelectionModalProps) {
    const { t } = useLanguage()
    const apiFetch = useApi()
    const baseUrl = getApiBaseUrl()

    const [loading, setLoading] = useState(false)
    const [partners, setPartners] = useState<Partner[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm)
        }, 500)
        return () => clearTimeout(timer)
    }, [searchTerm])

    const fetchPartners = useCallback(async (search: string = "") => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page_size: "50",
                is_partner: "true",
            })
            if (search) params.append("search", search)

            const response = await apiFetch(`auth/admin/users/partners/?${params.toString()}`)
            const data = response.partners || response.results || response.users || (Array.isArray(response) ? response : [])
            setPartners(data)
        } catch (err) {
            console.error("Failed to fetch partners", err)
        } finally {
            setLoading(false)
        }
    }, [apiFetch, baseUrl])

    useEffect(() => {
        if (open) {
            fetchPartners(debouncedSearch)
        }
    }, [open, debouncedSearch, fetchPartners])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle><span>{t("deviceAuthorizations.selectPartner")}</span></DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder={t("users.search")}
                            onValueChange={setSearchTerm}
                        />
                        <CommandList className="max-h-[300px]">
                            <CommandEmpty>
                                {loading ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                ) : (
                                    <span>{t("partners.noPartnersFound")}</span>
                                )}
                            </CommandEmpty>
                            <CommandGroup>
                                {partners.map((partner) => (
                                    <CommandItem
                                        key={partner.uid}
                                        onSelect={() => {
                                            onSelect(partner)
                                            onOpenChange(false)
                                        }}
                                        className="flex flex-wrap items-start justify-between gap-3 sm:items-center py-3 cursor-pointer"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">{partner.display_name || partner.phone_number}</span>
                                            <span className="text-xs text-muted-foreground">{partner.email}</span>
                                        </div>
                                        {selectedPartnerUid === partner.uid && (
                                            <Check className="h-4 w-4 text-primary" />
                                        )}
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
