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
import { useRouter, useParams } from "next/navigation"
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
  deposit_commission_rate: string | null;
  withdrawal_commission_rate: string | null;
  description: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  active_partners_count: number;
  total_transactions_count: number;
}

interface PlatformForm {
  name: string;
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

export default function EditPlatformPage() {
  const params = useParams()
  const platformId = params.id as string
  
  const [form, setForm] = useState<PlatformForm>({
    name: "",
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
  
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState("")
  const [fetchError, setFetchError] = useState("")
  const { t } = useLanguage()
  const baseUrl = getApiBaseUrl()
  const { toast } = useToast()
  const apiFetch = useApi();
  const router = useRouter()

  // Fetch platform data on component mount
  useEffect(() => {
    const fetchPlatform = async () => {
      if (!platformId) return
      
      setFetchLoading(true)
      setFetchError("")
      try {
        const endpoint = `payments/betting/admin/platforms/${platformId}/`
        const data = await apiFetch(endpoint)
        setPlatform(data)
        
        // Populate form with existing data
        setForm({
          name: data.name || "",
          min_deposit_amount: data.min_deposit_amount || "",
          max_deposit_amount: data.max_deposit_amount || "",
          min_withdrawal_amount: data.min_withdrawal_amount || "",
          max_withdrawal_amount: data.max_withdrawal_amount || "",
          deposit_commission_rate: data.deposit_commission_rate ?? "",
          withdrawal_commission_rate: data.withdrawal_commission_rate ?? "",
          description: data.description || "",
          is_active: data.is_active ?? true,
          logo: null,
        })
        
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setFetchError(errorMessage)
        toast({ title: "Erreur", description: errorMessage, variant: "destructive" })
      } finally {
        setFetchLoading(false)
      }
    }
    fetchPlatform()
  }, [platformId, baseUrl, apiFetch, toast])

  const handleInputChange = (field: keyof PlatformForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      let body: any;
      let headers: Record<string, string> = {};

      const depositRate = parseOptionalCommission(form.deposit_commission_rate);
      const withdrawalRate = parseOptionalCommission(form.withdrawal_commission_rate);

      if (form.logo) {
        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("min_deposit_amount", parseFloat(form.min_deposit_amount).toFixed(2));
        formData.append("max_deposit_amount", parseFloat(form.max_deposit_amount).toFixed(2));
        formData.append("min_withdrawal_amount", parseFloat(form.min_withdrawal_amount).toFixed(2));
        formData.append("max_withdrawal_amount", parseFloat(form.max_withdrawal_amount).toFixed(2));
        formData.append("deposit_commission_rate", depositRate ?? "");
        formData.append("withdrawal_commission_rate", withdrawalRate ?? "");
        formData.append("description", form.description);
        formData.append("is_active", String(form.is_active));
        formData.append("logo", form.logo);
        body = formData;
      } else {
        const payload: Record<string, unknown> = {
          name: form.name,
          min_deposit_amount: parseFloat(form.min_deposit_amount).toFixed(2),
          max_deposit_amount: parseFloat(form.max_deposit_amount).toFixed(2),
          min_withdrawal_amount: parseFloat(form.min_withdrawal_amount).toFixed(2),
          max_withdrawal_amount: parseFloat(form.max_withdrawal_amount).toFixed(2),
          deposit_commission_rate: depositRate,
          withdrawal_commission_rate: withdrawalRate,
          description: form.description,
          is_active: form.is_active,
        }
        body = JSON.stringify(payload);
        headers["Content-Type"] = "application/json";
      }

      const endpoint = `payments/betting/admin/platforms/${platformId}/`
      const data = await apiFetch(endpoint, {
        method: "PATCH",
        headers: headers,
        body: body,
      })

      toast({ 
        title: "Succès", 
        description: "Plateforme mise à jour avec succès" 
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
    if (platform) {
      setForm({
        name: platform.name || "",
        min_deposit_amount: platform.min_deposit_amount || "",
        max_deposit_amount: platform.max_deposit_amount || "",
        min_withdrawal_amount: platform.min_withdrawal_amount || "",
        max_withdrawal_amount: platform.max_withdrawal_amount || "",
        deposit_commission_rate: platform.deposit_commission_rate ?? "",
        withdrawal_commission_rate: platform.withdrawal_commission_rate ?? "",
        description: platform.description || "",
        is_active: platform.is_active ?? true,
        logo: null,
      })
    }
    setError("")
  }

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-whiten dark:bg-boxdark-2">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-3 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-center py-6 sm:py-10">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-body dark:text-bodydark">Chargement de la plateforme...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-whiten dark:bg-boxdark-2">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-3 sm:px-6 py-4 sm:py-6">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-4 mb-4">
              <Link href="/dashboard/platforms/list">
                <Button variant="outline" size="sm" className="bg-white dark:bg-boxdark">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </Link>
            </div>
          </div>
          <ErrorDisplay error={fetchError} />
        </div>
      </div>
    )
  }

  if (!platform) {
    return (
      <div className="min-h-screen bg-whiten dark:bg-boxdark-2">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-3 sm:px-6 py-4 sm:py-6">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-4 mb-4">
              <Link href="/dashboard/platforms/list">
                <Button variant="outline" size="sm" className="bg-white dark:bg-boxdark">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </Link>
            </div>
          </div>
          <ErrorDisplay error="Plateforme non trouvée" />
        </div>
      </div>
    )
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
              Modifier la Plateforme
            </h1>
            <p className="text-body dark:text-bodydark mt-2 text-lg">
              Modifier les informations de {platform.name}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:p-5 md:p-8">
          {/* Platform Info */}
          <div className="lg:col-span-1">
            <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span>Informations Actuelles</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="w-16 h-16 overflow-hidden bg-gradient-to-br from-primary to-meta-3 rounded-lg flex items-center justify-center text-white font-semibold shadow-md">
                      {platform.logo ? (
                        <img 
                          src={platform.logo.startsWith('http') ? platform.logo : `${baseUrl.replace(/\/$/, "")}/${platform.logo.replace(/^\//, "")}`} 
                          alt={platform.name}
                          className="object-contain w-full h-full p-1"
                          onError={(e) => {
                            (e.target as any).style.display = 'none';
                            (e.target as any).parentElement.innerHTML = `<span>${platform.name?.charAt(0)?.toUpperCase() || 'P'}</span>`;
                          }}
                        />
                      ) : (
                        <span className="text-xl">{platform.name?.charAt(0)?.toUpperCase() || 'P'}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {platform.name}
                      </h3>
                      <p className="text-sm text-body dark:text-bodydark2">
                        ID: {platform.external_id}
                      </p>
                    </div>
                  </div>
                  
                  <div>
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
                  
                  <div className="text-sm text-body dark:text-bodydark2">
                    <div>Partenaires actifs: {platform.active_partners_count}</div>
                    <div>Transactions: {platform.total_transactions_count}</div>
                    <div>Créé le: {new Date(platform.created_at).toLocaleDateString()}</div>
                    <div>Créé par: {platform.created_by_name}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Form */}
          <div className="lg:col-span-2">
            <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>Modifier la Plateforme</span>
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
                      <Label htmlFor="external_id">ID Externe</Label>
                      <Input
                        id="external_id"
                        value={platform.external_id}
                        disabled
                        className="mt-1 bg-gray-100 dark:bg-meta-4"
                      />
                      <p className="text-xs text-body dark:text-bodydark2 mt-1">
                        L'ID externe ne peut pas être modifié
                      </p>
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
                    
                    {(platform.logo || form.logo) && (
                      <div className="mb-3 flex items-center gap-2 sm:gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-body dark:text-bodydark2">Aperçu</p>
                          <div className="relative h-24 w-24 overflow-hidden rounded-lg border-2 border-orange-100 dark:border-strokedark bg-white dark:bg-boxdark flex items-center justify-center shadow-md p-1">
                            <img 
                              src={form.logo ? URL.createObjectURL(form.logo) : (platform.logo?.startsWith('http') ? platform.logo : `${baseUrl.replace(/\/$/, "")}/${platform.logo?.replace(/^\//, "")}`)} 
                              alt="Logo preview" 
                              className="object-contain h-full w-full rounded"
                              onError={(e) => {
                                (e.target as any).src = "https://placehold.co/100x100?text=Logo";
                              }}
                            />
                          </div>
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
                    <p className="text-xs text-body dark:text-bodydark2">
                      Laissez vide pour conserver le logo actuel
                    </p>
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
                      Laissez vide pour réinitialiser au fallback (taux partner, puis 1%).
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
                          placeholder="Vide = fallback"
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
                          placeholder="Vide = fallback"
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
                          Mise à jour...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Mettre à jour
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

        {/* Current Limits Preview */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-meta-3" />
              <span>Limites Actuelles</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:p-4 md:p-6">
              <div className="bg-gray dark:bg-orange-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-orange-800 dark:text-secondary mb-3">Limites de Dépôt</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-body dark:text-bodydark2">Minimum:</span>
                    <span className="ml-2 text-lg font-semibold text-primary">
                      {parseFloat(platform.min_deposit_amount).toFixed(2)} FCFA
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-body dark:text-bodydark2">Maximum:</span>
                    <span className="ml-2 text-lg font-semibold text-primary">
                      {parseFloat(platform.max_deposit_amount).toFixed(2)} FCFA
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 dark:text-green-300 mb-3">Limites de Retrait</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-body dark:text-bodydark2">Minimum:</span>
                    <span className="ml-2 text-lg font-semibold text-meta-3">
                      {parseFloat(platform.min_withdrawal_amount).toFixed(2)} FCFA
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-body dark:text-bodydark2">Maximum:</span>
                    <span className="ml-2 text-lg font-semibold text-meta-3">
                      {parseFloat(platform.max_withdrawal_amount).toFixed(2)} FCFA
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}