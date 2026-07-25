"use client"

import { useMemo, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { PaymentDevice } from "@/lib/types/flashpay-device"
import {
  depositStepCount,
  flashpayTheme,
  formatRelativeTime,
  isDeviceConfigured,
  networkChipClass,
} from "@/lib/flashpay-device-utils"

interface DevicePickerDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  devices: PaymentDevice[]
  onSelect: (device: PaymentDevice) => void
}

export function DevicePickerDrawer({ open, onOpenChange, devices, onSelect }: DevicePickerDrawerProps) {
  const [search, setSearch] = useState("")
  const [networkFilter, setNetworkFilter] = useState("all")

  const networks = useMemo(() => {
    const set = new Set(devices.map((d) => d.network_name).filter(Boolean) as string[])
    return Array.from(set)
  }, [devices])

  const filtered = useMemo(() => {
    return devices.filter((d) => {
      if (!isDeviceConfigured(d)) return false
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        d.device_id.toLowerCase().includes(q) ||
        (d.device_name || "").toLowerCase().includes(q) ||
        (d.user_name || "").toLowerCase().includes(q)
      const matchNet = networkFilter === "all" || d.network_name === networkFilter
      return matchSearch && matchNet
    })
  }, [devices, search, networkFilter])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto bg-white dark:bg-boxdark-2 border-slate-200 dark:border-strokedark">
        <SheetHeader>
          <SheetTitle className="text-[#0B2545] dark:text-gray-100">Choisir un modèle</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <Input
            className="bg-gray-50 dark:bg-boxdark border-stroke dark:border-strokedark"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={networkFilter === "all" ? "default" : "outline"}
              className={networkFilter === "all" ? flashpayTheme.accentBtn : ""}
              onClick={() => setNetworkFilter("all")}
            >
              Tous
            </Button>
            {networks.map((n) => (
              <Button
                key={n}
                size="sm"
                variant={networkFilter === n ? "default" : "outline"}
                onClick={() => setNetworkFilter(n)}
              >
                {n}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            {filtered.map((device) => (
              <button
                key={device.uid}
                type="button"
                className="w-full text-left rounded-xl border border-slate-200 dark:border-strokedark bg-white dark:bg-boxdark p-4 transition hover:border-[#D4A24C] hover:shadow-sm hover:bg-gray/40 dark:hover:!bg-gray-700/90"
                onClick={() => {
                  onSelect(device)
                  onOpenChange(false)
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#0B2545] dark:text-gray-100">{device.device_name || device.device_id}</p>
                    <p className={`font-mono ${flashpayTheme.mutedXs} mt-1`}>{device.device_id}</p>
                  </div>
                  <Badge className={networkChipClass(device.custom_settings?.flashpay?.network_code)}>
                    {device.network_name || "—"}
                  </Badge>
                </div>
                <p className={`${flashpayTheme.mutedXs} mt-2`}>
                  {depositStepCount(device)} étapes dépôt · {formatRelativeTime(device.last_seen)}
                  {device.is_online ? " · en ligne" : ""}
                </p>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className={`text-sm ${flashpayTheme.muted} py-8 text-center`}>Aucun device configuré trouvé</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
