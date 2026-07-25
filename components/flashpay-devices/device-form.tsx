"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Sparkles, Upload, Check, ChevronsUpDown, Loader2, Eye, EyeOff } from "lucide-react"
import type { DeviceFormValues, ExecutionMode, FlashPayDeviceConfig, OperationTab, SmsSenderConfig } from "@/lib/types/flashpay-device"
import {
  applyFlashpayConfigImport,
  computeCompletion,
  EXECUTION_MODE_OPTIONS,
  formatDeviceMode,
  formatExecutionMode,
  getRequiredUssdOperations,
  compactCustomSettings,
  createEmptyFlashpayConfig,
  defaultSmsSenderConfig,
  flashpayTheme,
  isAppExecutionMode,
  isSampleForm,
  networkChipClass,
} from "@/lib/flashpay-device-utils"
import { UssdFlowBuilder } from "@/components/flashpay-devices/ussd-flow-builder"
import { DevicePreviewPanel } from "@/components/flashpay-devices/device-preview-panel"
import { AdvancedSettingsEditor } from "@/components/flashpay-devices/advanced-settings-editor"
import { fetchAdminUsers, fetchCountries, fetchNetworks } from "@/lib/flashpay-device-api"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

interface DeviceFormProps {
  form: DeviceFormValues
  onChange: (form: DeviceFormValues) => void
  mode: "create" | "edit"
  apiFetch: ReturnType<typeof import("@/lib/useApi").useApi>
  clonedFrom?: string
  ownerLabel?: string
  onPushConfig?: () => void
  pushing?: boolean
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className={cn(flashpayTheme.card, "p-4 sm:p-5 space-y-4")}>
      <div>
        <h2 className="text-lg font-semibold text-[#0B2545] dark:text-gray-100">{title}</h2>
        {description && <p className={cn(flashpayTheme.mutedXs, "mt-1")}>{description}</p>}
      </div>
      {children}
    </section>
  )
}

const OPERATION_LABELS: Record<OperationTab, string> = {
  deposit: "Dépôt",
  withdraw: "Retrait",
  balance: "Solde",
}

export function DeviceForm({
  form,
  onChange,
  mode,
  apiFetch,
  clonedFrom,
  ownerLabel,
  onPushConfig,
  pushing,
}: DeviceFormProps) {
  const { toast } = useToast()
  const [users, setUsers] = useState<any[]>([])
  const [countries, setCountries] = useState<any[]>([])
  const [networks, setNetworks] = useState<any[]>([])
  const [selectedCountryUid, setSelectedCountryUid] = useState<string | null>(null)
  const [loadingNetworks, setLoadingNetworks] = useState(false)
  const [showMomoPin, setShowMomoPin] = useState(false)
  const [userSearch, setUserSearch] = useState("")
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userSearchError, setUserSearchError] = useState("")

  const fp = form.custom_settings.flashpay
  const completion = computeCompletion(form)
  const sample = isSampleForm(form)
  const appExecutionMode = isAppExecutionMode(fp?.execution_mode)
  const locationInitialized = useRef(false)

  useEffect(() => {
    if (locationInitialized.current) return
    let cancelled = false
    async function initLocation() {
      try {
        const countryList = await fetchCountries(apiFetch)
        if (cancelled) return
        setCountries(countryList)

        if (form.network) {
          const allNetworks = await fetchNetworks(apiFetch)
          if (cancelled) return
          const net = allNetworks.find((n: { uid: string }) => n.uid === form.network)
          if (net?.country) {
            setSelectedCountryUid(net.country)
            locationInitialized.current = true
            return
          }
        }

        const code = fp?.country_code?.toUpperCase()
        if (code) {
          const match = countryList.find(
            (c: { code?: string }) => c.code?.toUpperCase() === code,
          )
          if (match?.uid) setSelectedCountryUid(match.uid)
        }
        locationInitialized.current = true
      } catch {
        if (!cancelled) setCountries([])
        locationInitialized.current = true
      }
    }
    initLocation()
    return () => {
      cancelled = true
    }
  }, [apiFetch, form.network, fp?.country_code])

  useEffect(() => {
    if (!selectedCountryUid) {
      setNetworks([])
      return
    }
    let cancelled = false
    setLoadingNetworks(true)
    fetchNetworks(apiFetch, { country: selectedCountryUid })
      .then((list) => {
        if (!cancelled) setNetworks(list)
      })
      .catch(() => {
        if (!cancelled) setNetworks([])
      })
      .finally(() => {
        if (!cancelled) setLoadingNetworks(false)
      })
    return () => {
      cancelled = true
    }
  }, [apiFetch, selectedCountryUid])

  useEffect(() => {
    setLoadingUsers(true)
    setUserSearchError("")
    const t = setTimeout(() => {
      fetchAdminUsers(apiFetch, userSearch)
        .then(setUsers)
        .catch(() => {
          setUsers([])
          setUserSearchError("Impossible de charger les utilisateurs.")
        })
        .finally(() => setLoadingUsers(false))
    }, 300)
    return () => clearTimeout(t)
  }, [apiFetch, userSearch])

  const selectedUser = useMemo(
    () => users.find((u) => u.uid === form.user),
    [users, form.user],
  )

  const selectedUserLabel = useMemo(() => {
    if (!form.user) return null
    if (selectedUser) {
      return selectedUser.display_name || selectedUser.email || selectedUser.phone || form.user
    }
    return ownerLabel || form.user
  }, [form.user, selectedUser, ownerLabel])

  const selectedNetwork = useMemo(
    () => networks.find((n) => n.uid === form.network),
    [networks, form.network],
  )

  const selectedCountry = useMemo(
    () => countries.find((c) => c.uid === selectedCountryUid),
    [countries, selectedCountryUid],
  )

  const patch = (partial: Partial<DeviceFormValues>) => onChange({ ...form, ...partial })

  const patchFlashpay = (partial: Partial<FlashPayDeviceConfig>) => {
    const base = fp ?? createEmptyFlashpayConfig()
    onChange({
      ...form,
      custom_settings: compactCustomSettings({
        ...form.custom_settings,
        flashpay: { ...base, ...partial },
      }),
    })
  }

  const smsSender = form.custom_settings.sms_sender ?? defaultSmsSenderConfig()

  const patchSmsSender = (partial: Partial<SmsSenderConfig>) => {
    onChange({
      ...form,
      custom_settings: compactCustomSettings({
        ...form.custom_settings,
        sms_sender: { ...smsSender, ...partial },
      }),
    })
  }

  const selectCountry = (country: { uid: string; code?: string; nom?: string }) => {
    const base = fp ?? createEmptyFlashpayConfig()
    const changed = selectedCountryUid !== country.uid
    setSelectedCountryUid(country.uid)
    onChange({
      ...form,
      network: changed ? null : form.network,
      custom_settings: compactCustomSettings({
        ...form.custom_settings,
        flashpay: {
          ...base,
          country_code: (country.code ?? base.country_code).toUpperCase(),
          ...(changed ? { network_code: "", network_label: "" } : {}),
        },
      }),
    })
  }

  const selectNetwork = (network: {
    uid: string
    code?: string
    nom?: string
    country?: string
  }) => {
    const base = fp ?? createEmptyFlashpayConfig()
    const country = countries.find((c) => c.uid === network.country)
    onChange({
      ...form,
      network: network.uid,
      custom_settings: compactCustomSettings({
        ...form.custom_settings,
        flashpay: {
          ...base,
          network_code: network.code ?? base.network_code,
          network_label: network.nom ?? base.network_label,
          country_code: (country?.code ?? base.country_code).toUpperCase(),
        },
      }),
    })
  }

  const patchOperation = useCallback(
    (tab: OperationTab, steps: string[]) => {
      if (!fp) return
      onChange({
        ...form,
        custom_settings: {
          ...form.custom_settings,
          flashpay: {
            ...fp,
            [tab]: { ...fp[tab], ussd_steps: steps },
          },
        },
      })
    },
    [form, fp, onChange],
  )

  const configFileInputRef = useRef<HTMLInputElement>(null)

  const handleConfigFileUpload = (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? "")
      const { form: next, error } = applyFlashpayConfigImport(text, form)
      if (error) {
        toast({ title: "Import échoué", description: error, variant: "destructive" })
        return
      }
      onChange(next)
      const importedPin = next.custom_settings.flashpay?.momo_pin?.trim()
      toast({
        title: "Config importée",
        description: importedPin
          ? `${file.name} — formulaire rempli.`
          : `${file.name} — PIN non importé, saisissez-le avant d'enregistrer.`,
      })
    }
    reader.readAsText(file)
    if (configFileInputRef.current) configFileInputRef.current.value = ""
  }

  const renderOperationBlock = (tab: OperationTab) => {
    if (!fp) return null
    const steps = fp[tab]?.ussd_steps ?? []
    const stepCount = steps.filter((s) => s.trim()).length

    return (
      <div
        key={tab}
        className="rounded-xl border border-slate-200 dark:border-strokedark bg-slate-50/50 dark:bg-boxdark-2/30 p-4 space-y-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {OPERATION_LABELS[tab]}
          </h3>
          <Badge variant="secondary" className="dark:bg-meta-4 dark:text-gray-200">
            {stepCount} étape{stepCount > 1 ? "s" : ""}
          </Badge>
        </div>

        <UssdFlowBuilder steps={steps} onChange={(next) => patchOperation(tab, next)} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center rounded-lg border border-slate-200 dark:border-strokedark bg-white dark:bg-boxdark/80 p-3">
            <span className="text-sm text-gray-900 dark:text-gray-200">Session multi-écrans</span>
            <Switch
              checked={fp[tab]?.session_type === "multi"}
              onCheckedChange={(v) =>
                patchFlashpay({
                  [tab]: {
                    ...fp[tab],
                    session_type: v ? "multi" : "single",
                  },
                } as Partial<FlashPayDeviceConfig>)
              }
            />
          </div>
          {tab === "deposit" && (
            <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center rounded-lg border border-slate-200 dark:border-strokedark bg-white dark:bg-boxdark/80 p-3">
              <span className="text-sm text-gray-900 dark:text-gray-200">Auto-transfer</span>
              <Switch
                checked={fp.deposit.auto_transfer_enabled}
                onCheckedChange={(v) =>
                  patchFlashpay({
                    deposit: { ...fp.deposit, auto_transfer_enabled: v },
                  })
                }
              />
            </div>
          )}
        </div>

        {tab === "deposit" && fp.deposit.auto_transfer_enabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Destination auto-transfer</Label>
              <Input
                className="mt-1 bg-white dark:bg-boxdark-2"
                value={fp.deposit.auto_transfer_to}
                onChange={(e) =>
                  patchFlashpay({ deposit: { ...fp.deposit, auto_transfer_to: e.target.value } })
                }
              />
            </div>
            <div>
              <Label>Seuil min (FCFA)</Label>
              <Input
                type="number"
                className="mt-1 bg-white dark:bg-boxdark-2"
                value={fp.deposit.auto_transfer_min_balance}
                onChange={(e) =>
                  patchFlashpay({
                    deposit: { ...fp.deposit, auto_transfer_min_balance: Number(e.target.value) || 0 },
                  })
                }
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-3 sm:p-4 md:p-6">
      <div className="xl:col-span-2 space-y-4 min-w-0">
        {sample && mode === "create" && (
          <div className={`${flashpayTheme.sampleBanner} flex items-start gap-3`}>
            <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900 dark:text-amber-100">
              Modèle d&apos;exemple chargé — personnalisez <strong>device_id</strong>, l&apos;agent et le PIN avant enregistrement.
            </p>
          </div>
        )}
        {clonedFrom && (
          <Badge variant="outline" className="border-blue-300 text-blue-800 dark:border-blue-700 dark:text-blue-300">
            Cloné depuis {clonedFrom}
          </Badge>
        )}

        <FormSection
          title="Identité & rattachement"
          description="Identifiant du téléphone, agent propriétaire, pays et réseau MoMo."
        >
          <div>
            <Label>device_id</Label>
            <Input
              className={cn(
                "font-mono mt-1 bg-white dark:bg-boxdark-2",
                sample && form.device_id.includes("sample") && "border-amber-400 ring-amber-200",
              )}
              value={form.device_id}
              readOnly={mode === "edit"}
              onChange={(e) => patch({ device_id: e.target.value })}
              placeholder="Identifiant saisi dans FlashPay"
            />
          </div>
          <div>
            <Label>Nom affiché</Label>
            <Input
              className="mt-1 bg-white dark:bg-boxdark-2"
              value={form.device_name}
              onChange={(e) => patch({ device_name: e.target.value })}
              placeholder="Ex. Téléphone Moov SIM1"
            />
          </div>
          <div>
            <Label>Propriétaire (agent)</Label>
            <p className={`${flashpayTheme.mutedXs} mt-1 mb-2`}>
              Compte utilisateur (UUID) qui se connectera sur le téléphone FlashPay — recherche par nom, email ou téléphone.
            </p>
            <Popover open={userDropdownOpen} onOpenChange={setUserDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={userDropdownOpen}
                  className={cn(
                    "w-full justify-between font-normal mt-1",
                    !form.user && "text-muted-foreground",
                  )}
                >
                  <span className="truncate text-left">
                    {selectedUserLabel || "Sélectionner un agent…"}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Rechercher par email, nom ou téléphone…"
                    value={userSearch}
                    onValueChange={setUserSearch}
                  />
                  <CommandList className="max-h-56 overflow-y-auto">
                    <CommandEmpty>
                      {loadingUsers ? (
                        <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Recherche…
                        </div>
                      ) : userSearchError ? (
                        userSearchError
                      ) : (
                        "Aucun utilisateur trouvé."
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {!loadingUsers &&
                        users.map((u) => (
                          <CommandItem
                            key={u.uid}
                            value={u.uid}
                            onSelect={() => {
                              patch({ user: u.uid })
                              setUserDropdownOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                form.user === u.uid ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium truncate">
                                {u.display_name || u.email || u.phone || u.uid}
                              </span>
                              {(u.email || u.phone) && (
                                <span className={`${flashpayTheme.mutedXs} truncate`}>
                                  {[u.email, u.phone].filter(Boolean).join(" · ")}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {form.user && (
              <p className={`${flashpayTheme.mutedXs} mt-2 font-mono break-all`}>UUID : {form.user}</p>
            )}
          </div>
          <div>
            <Label>Pays</Label>
            <p className={`${flashpayTheme.mutedXs} mt-1 mb-2`}>
              Choisissez le pays avant de sélectionner le réseau MoMo.
            </p>
            {countries.length === 0 ? (
              <p className={flashpayTheme.muted}>Chargement des pays…</p>
            ) : (
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-2">
                {countries.map((country) => (
                  <button
                    key={country.uid}
                    type="button"
                    onClick={() => selectCountry(country)}
                    className={cn(
                      flashpayTheme.networkTile,
                      "min-h-[3.5rem] touch-manipulation",
                      selectedCountryUid === country.uid
                        ? flashpayTheme.networkSelected
                        : flashpayTheme.unselectedTile,
                    )}
                  >
                    <span className="inline-block px-2 py-0.5 rounded text-xs border mb-1 font-mono font-semibold border-slate-300 dark:border-gray-500">
                      {country.code}
                    </span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{country.nom}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label>Réseau MoMo</Label>
            {!selectedCountryUid ? (
              <p className={`${flashpayTheme.mutedXs} mt-2`}>
                Sélectionnez un pays pour afficher les réseaux disponibles.
              </p>
            ) : loadingNetworks ? (
              <div className="flex items-center gap-2 mt-2 text-sm text-slate-500 dark:text-bodydark2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement des réseaux…
              </div>
            ) : networks.length === 0 ? (
              <p className={`${flashpayTheme.mutedXs} mt-2`}>
                Aucun réseau actif pour {selectedCountry?.nom ?? "ce pays"}.
              </p>
            ) : (
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                {networks.map((n) => (
                  <button
                    key={n.uid}
                    type="button"
                    onClick={() => selectNetwork(n)}
                    className={cn(
                      flashpayTheme.networkTile,
                      "min-h-[3.75rem] touch-manipulation",
                      form.network === n.uid ? flashpayTheme.networkSelected : flashpayTheme.unselectedTile,
                    )}
                  >
                    <span className={cn("inline-block px-2 py-0.5 rounded text-xs border mb-1 font-semibold", networkChipClass(n.code))}>
                      {n.code}
                    </span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{n.nom}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label>Slot SIM</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {([0, 1] as const).map((slot) => {
                const selected = (fp?.sim_slot ?? 0) === slot
                return (
                  <Button
                    key={slot}
                    type="button"
                    variant="outline"
                    className={cn(
                      "min-w-[5.5rem] flex-1 sm:flex-none font-semibold touch-manipulation",
                      selected ? flashpayTheme.simActive : flashpayTheme.simInactive,
                    )}
                    onClick={() => patchFlashpay({ sim_slot: slot })}
                  >
                    SIM {slot + 1}
                  </Button>
                )
              })}
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Émetteur SMS"
          description="Active ce device pour envoyer des SMS sortants via FlashPay."
        >
          <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center gap-4 rounded-lg border border-slate-200 dark:border-strokedark px-4 py-3">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Device émetteur SMS</p>
              <p className={flashpayTheme.mutedXs}>
                Le téléphone récupère les demandes, envoie le SMS et confirme le statut au serveur.
              </p>
            </div>
            <Switch
              checked={smsSender.enabled}
              onCheckedChange={(enabled) => patchSmsSender({ enabled })}
              aria-label="Activer émetteur SMS"
            />
          </div>
          {smsSender.enabled && (
            <div className="max-w-xs">
              <Label>Limite journalière</Label>
              <Input
                type="number"
                min={1}
                max={5000}
                className="mt-1"
                value={smsSender.daily_limit ?? 500}
                onChange={(e) =>
                  patchSmsSender({ daily_limit: Math.max(1, parseInt(e.target.value, 10) || 500) })
                }
              />
            </div>
          )}
        </FormSection>

        <FormSection
          title="Config FlashPay"
          description="Mode d'exécution (USSD ou application), PIN et séquences si applicable."
        >
          <div>
            <Label>Mode d&apos;exécution</Label>
            <p className={`${flashpayTheme.mutedXs} mt-1 mb-2`}>
              Définit comment le téléphone traite les transactions : codes USSD ou ouverture de l&apos;app Wave / Orange.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EXECUTION_MODE_OPTIONS.map((opt) => {
                const selected = (fp?.execution_mode ?? "ussd") === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => patchFlashpay({ execution_mode: opt.id as ExecutionMode })}
                    className={cn(
                      flashpayTheme.networkTile,
                      "min-h-[4rem] touch-manipulation text-left",
                      selected ? flashpayTheme.networkSelected : flashpayTheme.unselectedTile,
                    )}
                  >
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{opt.label}</p>
                    <p className={`${flashpayTheme.mutedXs} mt-0.5`}>{opt.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto border-slate-300 dark:border-strokedark touch-manipulation"
              onClick={() => configFileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importer une config
            </Button>
            <input
              ref={configFileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => handleConfigFileUpload(e.target.files?.[0] ?? null)}
            />
            <span className={flashpayTheme.mutedXs}>
              Formats acceptés : FlashPay (<code className="text-xs">{"{ flashpay: … }"}</code>) ou yapson legacy.
            </span>
          </div>

          <div>
            <Label>PIN MoMo</Label>
            <div className="relative mt-1">
              <Input
                className="pr-11 font-mono bg-white dark:bg-boxdark-2"
                type={showMomoPin ? "text" : "password"}
                value={fp?.momo_pin || ""}
                onChange={(e) => patchFlashpay({ momo_pin: e.target.value })}
                autoComplete="off"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-bodydark dark:hover:bg-gray-700 dark:hover:text-gray-100 touch-manipulation"
                onClick={() => setShowMomoPin((v) => !v)}
                aria-label={showMomoPin ? "Masquer le PIN MoMo" : "Afficher le PIN MoMo"}
              >
                {showMomoPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {selectedCountry && (
              <p className={`${flashpayTheme.mutedXs} mt-1`}>
                Pays configuré : {selectedCountry.nom} ({selectedCountry.code})
              </p>
            )}
            {appExecutionMode && (
              <p className={`${flashpayTheme.mutedXs} mt-2 text-amber-800 dark:text-amber-200`}>
                Mode application : seul le PIN est requis sur le téléphone. Les séquences USSD ci-dessous sont ignorées.
              </p>
            )}
          </div>

          {!fp ? (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onChange({
                  ...form,
                  custom_settings: {
                    ...form.custom_settings,
                    flashpay: createEmptyFlashpayConfig(),
                  },
                })
              }
            >
              Initialiser config FlashPay
            </Button>
          ) : appExecutionMode ? (
            <p className={`${flashpayTheme.muted} text-sm`}>
              Les blocs dépôt / retrait / solde USSD sont masqués en mode application ({formatExecutionMode(fp.execution_mode)}).
            </p>
          ) : (
            <div className="space-y-4">
              {(["deposit", "withdraw", "balance"] as OperationTab[]).map(renderOperationBlock)}
            </div>
          )}
        </FormSection>

        <FormSection title="Avancé" description="Édition JSON brute de custom_settings (réservé aux cas particuliers).">
          <AdvancedSettingsEditor
            settings={form.custom_settings}
            onApply={(settings) => patch({ custom_settings: settings })}
          />
        </FormSection>

        <div className={`flex flex-col gap-1 text-sm ${flashpayTheme.muted}`}>
          <div className="flex items-center gap-2">
            <span>
              Complétion {completion.percent}% · Mode {formatDeviceMode(completion.mode)}
            </span>
            <span className="text-xs">
              ({completion.done}/{completion.total})
            </span>
          </div>
          <p className="text-xs">
            USSD requis :{" "}
            {appExecutionMode
              ? "non (mode application)"
              : getRequiredUssdOperations(completion.mode, fp?.execution_mode)
                  .map((op) => (op === "deposit" ? "dépôt" : "retrait"))
                  .join(" + ") || "aucun"}
          </p>
          <div className={flashpayTheme.progressTrack}>
            <div
              className="h-full bg-[#D4A24C] transition-[width] duration-200"
              style={{ width: `${completion.percent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 xl:col-span-1 min-w-0">
        <DevicePreviewPanel
          form={form}
          networkName={selectedNetwork?.nom}
          onPushConfig={mode === "edit" ? onPushConfig : undefined}
          pushing={pushing}
        />
      </div>
    </div>
  )
}
