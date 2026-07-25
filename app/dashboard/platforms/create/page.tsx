"use client"

import { useState, useEffect } from "react"
import { useApi } from "@/lib/useApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/components/providers/language-provider"
import { ArrowLeft, Save, Loader2, CheckCircle, XCircle, BarChart3, Search, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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

interface ExternalPlatform {
  id: string;
  name: string;
  image: string;
  is_active: boolean;
  hash: string;
  cashdeskid: string;
  cashierpass: string;
  order: number | null;
  city: string;
  street: string;
  deposit_tuto_content: string;
  deposit_link: string;
  withdrawal_tuto_content: string;
  withdrawal_link: string;
  public_name: string;
  minimun_deposit: number;
  max_deposit: number;
  minimun_with: number;
  max_win: number;
}

interface PlatformForm {
  name: string;
  external_id: string;
  min_deposit_amount: string;
  max_deposit_amount: string;
  min_withdrawal_amount: string;
  max_withdrawal_amount: string;
  deposit_commission_rate: string;
  withdrawal_commission_rate: string;
  description: string;
  is_active: boolean;
  logo: File | null;
}

function parseOptionalCommission(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  return parseFloat(trimmed).toFixed(2)
}

export default function CreatePlatformPage() {
  const [form, setForm] = useState<PlatformForm>({
    name: "",
    external_id: "",
    min_deposit_amount: "",
    max_deposit_amount: "",
    min_withdrawal_amount: "",
    max_withdrawal_amount: "",
    deposit_commission_rate: "",
    withdrawal_commission_rate: "",
    description: "",
    is_active: true,
    logo: null,
  })
  
  const [externalPlatforms, setExternalPlatforms] = useState<ExternalPlatform[]>([])
  const [selectedExternalPlatform, setSelectedExternalPlatform] = useState<ExternalPlatform | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [externalPlatformsLoading, setExternalPlatformsLoading] = useState(false)
  const [externalPlatformsError, setExternalPlatformsError] = useState("")
  const { t } = useLanguage()
  const baseUrl = getApiBaseUrl()
  const { toast } = useToast()
  const apiFetch = useApi();
  const router = useRouter()

  // Fetch external platforms on component mount
  useEffect(() => {
    const fetchExternalPlatforms = async () => {
      setExternalPlatformsLoading(true)
      setExternalPlatformsError("")
      try {
        const response = await fetch("https://api.blaffa.net/blaffa/app_name?type=blaffapay")
        if (!response.ok) {
          throw new Error("Failed to fetch external platforms")
        }
        const data = await response.json()
        setExternalPlatforms(data)
      } catch (err: any) {
        const errorMessage = err.message || "Erreur lors du chargement des plateformes externes"
        setExternalPlatformsError(errorMessage)
        toast({ title: "Erreur", description: errorMessage, variant: "destructive" })
      } finally {
        setExternalPlatformsLoading(false)
      }
    }
    fetchExternalPlatforms()
  }, [toast])

  const handleInputChange = (field: keyof PlatformForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleExternalPlatformSelect = (platform: ExternalPlatform) => {
    setSelectedExternalPlatform(platform)
    setForm(prev => ({
      ...prev,
      name: platform.name,
      external_id: platform.id,
      min_deposit_amount: platform.minimun_deposit.toString(),
      max_deposit_amount: platform.max_deposit.toString(),
      min_withdrawal_amount: platform.minimun_with.toString(),
      max_withdrawal_amount: platform.max_win.toString(),
      description: `${platform.name} - Plateforme de paris sportifs`
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      let body: any;
      let headers: Record<string, string> = {};

      if (form.logo) {
        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("external_id", form.external_id);
        formData.append("min_deposit_amount", parseFloat(form.min_deposit_amount).toFixed(2));
        formData.append("max_deposit_amount", parseFloat(form.max_deposit_amount).toFixed(2));
        formData.append("min_withdrawal_amount", parseFloat(form.min_withdrawal_amount).toFixed(2));
        formData.append("max_withdrawal_amount", parseFloat(form.max_withdrawal_amount).toFixed(2));
        const depositRate = parseOptionalCommission(form.deposit_commission_rate);
        const withdrawalRate = parseOptionalCommission(form.withdrawal_commission_rate);
        if (depositRate !== null) formData.append("deposit_commission_rate", depositRate);
        if (withdrawalRate !== null) formData.append("withdrawal_commission_rate", withdrawalRate);
        formData.append("description", form.description);
        formData.append("is_active", String(form.is_active));
        formData.append("logo", form.logo);
        body = formData;
      } else {
        const payload: Record<string, unknown> = {
          name: form.name,
          external_id: form.external_id,
          min_deposit_amount: parseFloat(form.min_deposit_amount).toFixed(2),
          max_deposit_amount: parseFloat(form.max_deposit_amount).toFixed(2),
          min_withdrawal_amount: parseFloat(form.min_withdrawal_amount).toFixed(2),
          max_withdrawal_amount: parseFloat(form.max_withdrawal_amount).toFixed(2),
          description: form.description,
          is_active: form.is_active,
        }
        const depositRate = parseOptionalCommission(form.deposit_commission_rate);
        const withdrawalRate = parseOptionalCommission(form.withdrawal_commission_rate);
        if (depositRate !== null) payload.deposit_commission_rate = depositRate;
        if (withdrawalRate !== null) payload.withdrawal_commission_rate = withdrawalRate;
        body = JSON.stringify(payload);
        headers["Content-Type"] = "application/json";
      }

      const endpoint = `payments/betting/admin/platforms/`
      const data = await apiFetch(endpoint, {
        method: "POST",
        headers: headers,
        body: body,
      })

      toast({ 
        title: "Succès", 
        description: "Plateforme créée avec succès" 
      })
      
      router.push("/dashboard/platforms/list")
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
      name: "",
      external_id: "",
      min_deposit_amount: "",
      max_deposit_amount: "",
      min_withdrawal_amount: "",
      max_withdrawal_amount: "",
      deposit_commission_rate: "",
      withdrawal_commission_rate: "",
      description: "",
      is_active: true,
      logo: null,
    })
    setSelectedExternalPlatform(null)
    setError("")
  }

  return (
    <div className="min-h-screen bg-whiten dark:bg-boxdark-2">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-3 sm:px-6 py-4 sm:py-6">
        
        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-4 mb-4">
            <Link href="/dashboard/platforms/list">
              <Button variant="outline" size="sm" className="bg-white dark:bg-boxdark">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-base font-bold sm:text-lg sm:text-2xl bg-gradient-to-r from-primary to-meta-3 bg-clip-text text-transparent">
              Créer une Plateforme de Paris
            </h1>
            <p className="text-body dark:text-bodydark mt-2 text-lg">
              Ajouter une nouvelle plateforme de paris sportifs
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:p-5 md:p-8">
          {/* External Platforms Selection */}
          <div className="lg:col-span-1">
            <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ExternalLink className="h-5 w-5 text-blue-600" />
                  <span>Plateformes Externes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {externalPlatformsLoading ? (
                  <div className="flex items-center justify-center py-4 sm:py-6">
                    <div className="flex flex-col items-center space-y-4">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <span className="text-body dark:text-bodydark">Chargement...</span>
                    </div>
                  </div>
                ) : externalPlatformsError ? (
                  <ErrorDisplay error={externalPlatformsError} />
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {externalPlatforms.map((platform) => (
                      <div
                        key={platform.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                          selectedExternalPlatform?.id === platform.id
                            ? "border-primary bg-gray dark:bg-orange-900/20"
                            : "border-stroke dark:border-strokedark hover:border-stroke dark:hover:border-gray-600"
                        }`}
                        onClick={() => handleExternalPlatformSelect(platform)}
                      >
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          {platform.image ? (
                            <img 
                              src={platform.image} 
                              alt={platform.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-meta-3 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                              {platform.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {platform.name}
                            </div>
                            <div className="text-sm text-body dark:text-bodydark2">
                              {platform.public_name}
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
                        {selectedExternalPlatform?.id === platform.id && (
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

          {/* Platform Form */}
          <div className="lg:col-span-2">
            <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>Informations de la Plateforme</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                      <ErrorDisplay error={error} />
                    </div>
                  )}

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nom de la plateforme *</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Ex: 1xbet"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="external_id">ID Externe *</Label>
                      <Input
                        id="external_id"
                        value={form.external_id}
                        onChange={(e) => handleInputChange("external_id", e.target.value)}
                        placeholder="ID de la plateforme externe"
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={form.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Description de la plateforme"
                      rows={3}
                      required
                      className="mt-1"
                    />
                  </div>

                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="logo">Logo de la plateforme</Label>
                    {form.logo && (
                      <div className="mb-3">
                        <div className="relative h-24 w-24 overflow-hidden rounded-lg border-2 border-orange-100 dark:border-strokedark bg-white dark:bg-boxdark flex items-center justify-center shadow-md p-1">
                          <img 
                            src={URL.createObjectURL(form.logo)} 
                            alt="Logo preview" 
                            className="object-contain h-full w-full rounded"
                          />
                        </div>
                      </div>
                    )}
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleInputChange("logo", e.target.files[0]);
                        }
                      }}
                      className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark cursor-pointer"
                    />
                  </div>

                  {/* Deposit Limits */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Limites de Dépôt</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="min_deposit_amount">Montant minimum (FCFA) *</Label>
                        <Input
                          id="min_deposit_amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.min_deposit_amount}
                          onChange={(e) => handleInputChange("min_deposit_amount", e.target.value)}
                          placeholder="1000.00"
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="max_deposit_amount">Montant maximum (FCFA) *</Label>
                        <Input
                          id="max_deposit_amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.max_deposit_amount}
                          onChange={(e) => handleInputChange("max_deposit_amount", e.target.value)}
                          placeholder="500000.00"
                          required
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Withdrawal Limits */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Limites de Retrait</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="min_withdrawal_amount">Montant minimum (FCFA) *</Label>
                        <Input
                          id="min_withdrawal_amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.min_withdrawal_amount}
                          onChange={(e) => handleInputChange("min_withdrawal_amount", e.target.value)}
                          placeholder="1000.00"
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="max_withdrawal_amount">Montant maximum (FCFA) *</Label>
                        <Input
                          id="max_withdrawal_amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.max_withdrawal_amount}
                          onChange={(e) => handleInputChange("max_withdrawal_amount", e.target.value)}
                          placeholder="300000.00"
                          required
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Commission Rates (optional) */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Commissions (optionnel)</h3>
                    <p className="text-sm text-body dark:text-bodydark2">
                      Laissez vide pour utiliser le taux partner, puis 1% par défaut.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="deposit_commission_rate">Commission dépôt (%)</Label>
                        <Input
                          id="deposit_commission_rate"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={form.deposit_commission_rate}
                          onChange={(e) => handleInputChange("deposit_commission_rate", e.target.value)}
                          placeholder="Ex: 1.5 (vide = fallback)"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="withdrawal_commission_rate">Commission retrait (%)</Label>
                        <Input
                          id="withdrawal_commission_rate"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={form.withdrawal_commission_rate}
                          onChange={(e) => handleInputChange("withdrawal_commission_rate", e.target.value)}
                          placeholder="Ex: 0.8 (vide = fallback)"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Switch
                      id="is_active"
                      checked={form.is_active}
                      onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                    />
                    <Label htmlFor="is_active" className="text-sm font-medium">
                      Plateforme active
                    </Label>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center gap-2 sm:gap-4 pt-6 border-t border-stroke dark:border-strokedark">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Création...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Créer la Plateforme
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      disabled={loading}
                    >
                      Réinitialiser
                    </Button>
                    <Link href="/dashboard/platforms/list">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={loading}
                      >
                        Annuler
                      </Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Selected Platform Preview */}
        {selectedExternalPlatform && (
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-meta-3" />
                <span>Plateforme Sélectionnée</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:p-4 md:p-6">
                <div className="flex items-center gap-2 sm:gap-4">
                  {selectedExternalPlatform.image ? (
                    <img 
                      src={selectedExternalPlatform.image} 
                      alt={selectedExternalPlatform.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-meta-3 rounded-lg flex items-center justify-center text-white font-semibold text-lg">
                      {selectedExternalPlatform.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {selectedExternalPlatform.name}
                    </h3>
                    <p className="text-sm text-body dark:text-bodydark2">
                      {selectedExternalPlatform.public_name}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Limites de Dépôt</h4>
                  <div className="text-sm text-body dark:text-bodydark2">
                    <div>Min: {selectedExternalPlatform.minimun_deposit} FCFA</div>
                    <div>Max: {selectedExternalPlatform.max_deposit} FCFA</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Limites de Retrait</h4>
                  <div className="text-sm text-body dark:text-bodydark2">
                    <div>Min: {selectedExternalPlatform.minimun_with} FCFA</div>
                    <div>Max: {selectedExternalPlatform.max_win} FCFA</div>
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
