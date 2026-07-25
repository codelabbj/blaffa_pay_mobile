"use client"

import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { DeviceCustomSettings } from "@/lib/types/flashpay-device"
import { flashpayTheme } from "@/lib/flashpay-device-utils"

interface AdvancedSettingsEditorProps {
  settings: DeviceCustomSettings
  onApply: (settings: DeviceCustomSettings) => void
}

/** Monté uniquement quand l'accordéon Avancé est ouvert — évite JSON.stringify à chaque frappe. */
export function AdvancedSettingsEditor({ settings, onApply }: AdvancedSettingsEditorProps) {
  const [text, setText] = useState(() => JSON.stringify(settings, null, 2))

  useEffect(() => {
    setText(JSON.stringify(settings, null, 2))
  }, [settings])

  return (
    <>
      <p className={flashpayTheme.mutedXs}>
        Édition brute de <code className="text-xs">custom_settings</code> (inclut flashpay). Préférez Import/Export dans Config FlashPay.
      </p>
      <Label>JSON custom_settings</Label>
      <Textarea
        className="mt-2 font-mono text-xs bg-white dark:bg-boxdark"
        rows={12}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          try {
            onApply(JSON.parse(e.target.value) as DeviceCustomSettings)
          } catch {
            /* ignore invalid json while typing */
          }
        }}
      />
    </>
  )
}
