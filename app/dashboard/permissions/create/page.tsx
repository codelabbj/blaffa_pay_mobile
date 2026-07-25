"use client"

import { useState, useEffect } from "react"
import { useApi } from "@/lib/useApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/providers/language-provider"
import { ArrowLeft, Save, Loader2, CheckCircle, XCircle, BarChart3, Search, User, Shield, DollarSign, TrendingUp, Check, ChevronsUpDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getApiBaseUrl } from "@/lib/env-config"

// Colors for consistent theming - using logo colors
const COLORS = {
  primary: '#194185', // Orange (primary from logo)
  secondary: '#10B981', // Bright green from logo
  accent: '#1E3A8A', // Dark blue from logo
  danger: '#EF4444',
  warning: '#F97316',
  success: '#10B981', // Using bright green for success
  info: '#1E3A8A', // Using dark blue for info
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1'
};

interface Partner {
  uid: string;
  display_name: string;
  email: string;
  phone_number: string;
  is_active: boolean;
  total_commission: string;
  created_at: string;
}

interface Platform {
  uid: string;
  name: string;
  external_id: string;
  logo: string | null;
  is_active: boolean;
  min_deposit_amount: string;
  max_deposit_amount: string;
  min_withdrawal_amount: string;
  max_withdrawal_amount: string;
  description: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  active_partners_count: number;
  total_transactions_count: number;
}

interface PermissionForm {
  partner: string;
  platform: string;
  can_deposit: boolean;
  can_withdraw: boolean;
}

export default function CreatePermissionPage() {
  const [form, setForm] = useState<PermissionForm>({
    partner: "",
    platform: "",
    can_deposit: true,
    can_withdraw: true,
  })

  const [partners, setPartners] = useState<Partner[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [loading, setLoading] = useState(false)
  const [partnersLoading, setPartnersLoading] = useState(false)
  const [platformsLoading, setPlatformsLoading] = useState(false)
  const [error, setError] = useState("")
  const [partnersError, setPartnersError] = useState("")
  const [platformsError, setPlatformsError] = useState("")
  const [openPartnerCombobox, setOpenPartnerCombobox] = useState(false)
  const [openPlatformCombobox, setOpenPlatformCombobox] = useState(false)
  const [partnerSearch, setPartnerSearch] = useState("")
  const [platformSearch, setPlatformSearch] = useState("")

  const { t } = useLanguage()
  const baseUrl = getApiBaseUrl()
  const { toast } = useToast()
  const apiFetch = useApi();
  const router = useRouter()

  // Fetch partners function
  const fetchPartners = async (search: string = "") => {
    setPartnersLoading(true)
    setPartnersError("")
    try {
      const queryParams = new URLSearchParams()
      if (search) queryParams.append("search", search)

      const endpoint = `auth/admin/users/partners/${search ? `?${queryParams.toString()}` : ""}`
      const data = await apiFetch(endpoint)
      setPartners(data.partners || [])
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      setPartnersError(errorMessage)
      toast({ title: "Erreur", description: errorMessage, variant: "destructive" })
    } finally {
      setPartnersLoading(false)
    }
  }

  // Fetch platforms function
  const fetchPlatforms = async (search: string = "") => {
    setPlatformsLoading(true)
    setPlatformsError("")
    try {
      const queryParams = new URLSearchParams()
      if (search) queryParams.append("search", search)

      const endpoint = `payments/betting/admin/platforms/${search ? `?${queryParams.toString()}` : ""}`
      const data = await apiFetch(endpoint)
      setPlatforms(data.results || [])
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      setPlatformsError(errorMessage)
      toast({ title: "Erreur", description: errorMessage, variant: "destructive" })
    } finally {
      setPlatformsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchPartners()
    fetchPlatforms()
  }, [baseUrl, apiFetch])

  // Debounced search for partners
  useEffect(() => {
    if (!openPartnerCombobox) return;

    const timer = setTimeout(() => {
      fetchPartners(partnerSearch)
    }, 500)

    return () => clearTimeout(timer)
  }, [partnerSearch, openPartnerCombobox])

  // Debounced search for platforms
  useEffect(() => {
    if (!openPlatformCombobox) return;

    const timer = setTimeout(() => {
      fetchPlatforms(platformSearch)
    }, 500)

    return () => clearTimeout(timer)
  }, [platformSearch, openPlatformCombobox])

  const handleInputChange = (field: keyof PermissionForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handlePartnerSelect = (partnerId: string) => {
    const partner = partners.find(p => p.uid === partnerId)
    setSelectedPartner(partner || null)
    setForm(prev => ({ ...prev, partner: partnerId }))
    setOpenPartnerCombobox(false)
    setPartnerSearch("") // Clear search after selection
  }

  const handlePlatformSelect = (platformId: string) => {
    const platform = platforms.find(p => p.uid === platformId)
    setSelectedPlatform(platform || null)
    setForm(prev => ({ ...prev, platform: platformId }))
    setOpenPlatformCombobox(false)
    setPlatformSearch("") // Clear search after selection
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const payload = {
        partner: form.partner,
        platform: form.platform,
        can_deposit: form.can_deposit,
        can_withdraw: form.can_withdraw,
      }

      const endpoint = `payments/betting/admin/permissions/`
      const data = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      toast({
        title: "Succès",
        description: "Permission créée avec succès"
      })

      router.push("/dashboard/permissions/list")
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      setError(errorMessage)
      toast({ title: "Erreur", description: errorMessage, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({
      partner: "",
      platform: "",
      can_deposit: true,
      can_withdraw: true,
    })
    setSelectedPartner(null)
    setSelectedPlatform(null)
    setError("")
    setPartnerSearch("")
    setPlatformSearch("")
  }

  return (
    <div className="min-h-screen bg-whiten dark:bg-boxdark-2">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-3 sm:px-6 py-4 sm:py-6">

        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-4 mb-4">
            <Link href="/dashboard/permissions/list">
              <Button variant="outline" size="sm" className="bg-white dark:bg-boxdark">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-base font-bold sm:text-lg sm:text-2xl bg-gradient-to-r from-primary to-meta-3 bg-clip-text text-transparent">
              Créer une Permission
            </h1>
            <p className="text-body dark:text-bodydark mt-2 text-lg">
              Accorder des permissions à un partenaire sur une plateforme de paris
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:p-5 md:p-8">
          {/* Partners Selection */}
          <div className="lg:col-span-1">
            <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <span>Partenaires</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {partnersLoading && partners.length === 0 ? (
                  <div className="flex items-center justify-center py-4 sm:py-6">
                    <div className="flex flex-col items-center space-y-4">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <span className="text-body dark:text-bodydark">Chargement...</span>
                    </div>
                  </div>
                ) : partnersError ? (
                  <ErrorDisplay error={partnersError} />
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {partners.map((partner) => (
                      <div
                        key={partner.uid}
                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${selectedPartner?.uid === partner.uid
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-stroke dark:border-strokedark hover:border-stroke dark:hover:border-gray-600"
                          }`}
                        onClick={() => handlePartnerSelect(partner.uid)}
                      >
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                            {partner.display_name?.charAt(0)?.toUpperCase() || 'P'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {partner.display_name}
                            </div>
                            <div className="text-sm text-body dark:text-bodydark2">
                              {partner.email}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge
                                className={
                                  partner.is_active
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                                }
                              >
                                {partner.is_active ? "Actif" : "Inactif"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {selectedPartner?.uid === partner.uid && (
                          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                            ✓ Sélectionné
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Platforms Selection */}
          <div className="lg:col-span-1">
            <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>Plateformes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {platformsLoading && platforms.length === 0 ? (
                  <div className="flex items-center justify-center py-4 sm:py-6">
                    <div className="flex flex-col items-center space-y-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-body dark:text-bodydark">Chargement...</span>
                    </div>
                  </div>
                ) : platformsError ? (
                  <ErrorDisplay error={platformsError} />
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {platforms.map((platform) => (
                      <div
                        key={platform.uid}
                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${selectedPlatform?.uid === platform.uid
                            ? "border-primary bg-gray dark:bg-orange-900/20"
                            : "border-stroke dark:border-strokedark hover:border-stroke dark:hover:border-gray-600"
                          }`}
                        onClick={() => handlePlatformSelect(platform.uid)}
                      >
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary to-meta-3 rounded-lg flex items-center justify-center text-white font-semibold">
                            {platform.name?.charAt(0)?.toUpperCase() || 'P'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {platform.name}
                            </div>
                            <div className="text-sm text-body dark:text-bodydark2">
                              {platform.description}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge
                                className={
                                  platform.is_active
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                                }
                              >
                                {platform.is_active ? "Actif" : "Inactif"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {selectedPlatform?.uid === platform.uid && (
                          <div className="mt-2 text-xs text-primary dark:text-primary">
                            ✓ Sélectionné
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Permission Form */}
          <div className="lg:col-span-1">
            <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-meta-3" />
                  <span>Permissions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                      <ErrorDisplay error={error} />
                    </div>
                  )}

                  {/* Partner Selection */}
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="partner">Partenaire *</Label>
                    <Popover open={openPartnerCombobox} onOpenChange={setOpenPartnerCombobox}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openPartnerCombobox}
                          className="w-full justify-between"
                        >
                          {form.partner
                            ? (partners.find((partner) => partner.uid === form.partner)?.display_name || selectedPartner?.display_name)
                            : "Sélectionner un partenaire..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Rechercher un partenaire..."
                            value={partnerSearch}
                            onValueChange={setPartnerSearch}
                          />
                          <CommandList>
                            {partnersLoading && (
                              <div className="flex items-center justify-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                              </div>
                            )}
                            <CommandEmpty>Aucun partenaire trouvé.</CommandEmpty>
                            <CommandGroup>
                              {partners.map((partner) => (
                                <CommandItem
                                  key={partner.uid}
                                  value={partner.uid}
                                  onSelect={() => handlePartnerSelect(partner.uid)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      form.partner === partner.uid ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span>{partner.display_name}</span>
                                    <span className="text-xs text-body">{partner.email}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Platform Selection */}
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="platform">Plateforme *</Label>
                    <Popover open={openPlatformCombobox} onOpenChange={setOpenPlatformCombobox}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openPlatformCombobox}
                          className="w-full justify-between"
                        >
                          {form.platform
                            ? (platforms.find((platform) => platform.uid === form.platform)?.name || selectedPlatform?.name)
                            : "Sélectionner une plateforme..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Rechercher une plateforme..."
                            value={platformSearch}
                            onValueChange={setPlatformSearch}
                          />
                          <CommandList>
                            {platformsLoading && (
                              <div className="flex items-center justify-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              </div>
                            )}
                            <CommandEmpty>Aucune plateforme trouvée.</CommandEmpty>
                            <CommandGroup>
                              {platforms.map((platform) => (
                                <CommandItem
                                  key={platform.uid}
                                  value={platform.uid}
                                  onSelect={() => handlePlatformSelect(platform.uid)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      form.platform === platform.uid ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {platform.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Permissions */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Permissions</h3>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Switch
                        id="can_deposit"
                        checked={form.can_deposit}
                        onCheckedChange={(checked) => handleInputChange("can_deposit", checked)}
                      />
                      <Label htmlFor="can_deposit" className="text-sm font-medium">
                        Peut effectuer des dépôts
                      </Label>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Switch
                        id="can_withdraw"
                        checked={form.can_withdraw}
                        onCheckedChange={(checked) => handleInputChange("can_withdraw", checked)}
                      />
                      <Label htmlFor="can_withdraw" className="text-sm font-medium">
                        Peut effectuer des retraits
                      </Label>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="space-y-3 pt-6 border-t border-stroke dark:border-strokedark">
                    <Button
                      type="submit"
                      disabled={loading || !form.partner || !form.platform}
                      className="w-full bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Création...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Créer la Permission
                        </>
                      )}
                    </Button>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                        disabled={loading}
                        className="flex-1"
                      >
                        Réinitialiser
                      </Button>
                      <Link href="/dashboard/permissions/list" className="flex-1">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={loading}
                          className="w-full"
                        >
                          Annuler
                        </Button>
                      </Link>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Selected Items Preview */}
        {(selectedPartner || selectedPlatform) && (
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-meta-3" />
                <span>Prévisualisation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:p-4 md:p-6">
                {selectedPartner && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-3 flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Partenaire Sélectionné
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-body dark:text-bodydark2">Nom:</span>
                        <p className="text-lg font-semibold text-blue-600">
                          {selectedPartner.display_name}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-body dark:text-bodydark2">Email:</span>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {selectedPartner.email}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-body dark:text-bodydark2">Téléphone:</span>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {selectedPartner.phone_number || 'Non renseigné'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPlatform && (
                  <div className="bg-gray dark:bg-orange-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-orange-800 dark:text-secondary mb-3 flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Plateforme Sélectionnée
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-body dark:text-bodydark2">Nom:</span>
                        <p className="text-lg font-semibold text-primary">
                          {selectedPlatform.name}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-body dark:text-bodydark2">Description:</span>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {selectedPlatform.description}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-body dark:text-bodydark2">Limites:</span>
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          <div>Dépôt: {parseFloat(selectedPlatform.min_deposit_amount).toFixed(0)} - {parseFloat(selectedPlatform.max_deposit_amount).toFixed(0)} FCFA</div>
                          <div>Retrait: {parseFloat(selectedPlatform.min_withdrawal_amount).toFixed(0)} - {parseFloat(selectedPlatform.max_withdrawal_amount).toFixed(0)} FCFA</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Permissions Preview */}
              <div className="mt-6 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 dark:text-green-300 mb-3 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Permissions Accordées
                </h4>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-bodydark2" />
                    <span className="text-sm text-body dark:text-bodydark2">Dépôt:</span>
                    <Badge className={form.can_deposit ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"}>
                      {form.can_deposit ? "Autorisé" : "Interdit"}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-bodydark2" />
                    <span className="text-sm text-body dark:text-bodydark2">Retrait:</span>
                    <Badge className={form.can_withdraw ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"}>
                      {form.can_withdraw ? "Autorisé" : "Interdit"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}
