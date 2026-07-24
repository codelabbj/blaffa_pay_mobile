"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { ArrowLeft, Save, Loader2, Globe, Settings } from "lucide-react"
import { getApiBaseUrl } from "@/lib/env-config"


const baseUrl = getApiBaseUrl()

// Colors for consistent theming - using logo colors
const COLORS = {
  primary: '#FF6B35', // Orange (primary from logo)
  secondary: '#00FF88', // Bright green from logo
  accent: '#1E3A8A', // Dark blue from logo
  danger: '#EF4444',
  warning: '#F97316',
  success: '#00FF88', // Using bright green for success
  info: '#1E3A8A', // Using dark blue for info
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1'
};

export default function NetworkEditPage() {
  const router = useRouter()
  const params = useParams()
  const { id } = params
  const [nom, setNom] = useState("")
  const [code, setCode] = useState("")
  const [country, setCountry] = useState("")
  const [ussdBaseCode, setUssdBaseCode] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(true)
  const [sentDepositToModule, setSentDepositToModule] = useState(false)
  const [sentWithdrawalToModule, setSentWithdrawalToModule] = useState(false)
  const [countries, setCountries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast();

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const data = await apiFetch(`payments/countries/`)
        setCountries(Array.isArray(data) ? data : data.results || [])
        toast({
          title: t("network.countriesLoaded"),
          description: t("network.countriesLoadedSuccessfully"),
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("network.failedToLoadCountries")
        setCountries([])
        toast({
          title: t("network.countriesFailedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
    
    fetchCountries()
  }, [])

  useEffect(() => {
    if (!id) return
    
    const fetchNetwork = async () => {
      setLoading(true)
      setError("")
      try {
        const data = await apiFetch(`payments/networks/${id}/`)
        setNom(data.nom || "")
        setCode(data.code || "")
        setCountry(data.country || "")
        setUssdBaseCode(data.ussd_base_code || "")
        setExistingImageUrl(data.image || null)
        setIsActive(data.is_active)
        setSentDepositToModule(!!data.sent_deposit_to_module)
        setSentWithdrawalToModule(!!data.sent_withdrawal_to_module)
        toast({
          title: t("network.loaded"),
          description: t("network.loadedSuccessfully"),
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("network.failedToLoad")
        setError(errorMessage)
        toast({
          title: t("network.failedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchNetwork()
  }, [id])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      let body: any;
      let headers: Record<string, string> = {};
      
      if (image) {
        const formData = new FormData();
        formData.append("nom", nom);
        formData.append("code", code);
        formData.append("country", country);
        if (ussdBaseCode) formData.append("ussd_base_code", ussdBaseCode);
        formData.append("is_active", String(isActive));
        formData.append("sent_deposit_to_module", String(sentDepositToModule));
        formData.append("sent_withdrawal_to_module", String(sentWithdrawalToModule));
        formData.append("image", image);
        body = formData;
      } else {
        body = JSON.stringify({ 
          nom, 
          code, 
          country, 
          ussd_base_code: ussdBaseCode, 
          is_active: isActive,
          sent_deposit_to_module: sentDepositToModule,
          sent_withdrawal_to_module: sentWithdrawalToModule
        });
        headers["Content-Type"] = "application/json";
      }

      await apiFetch(`payments/networks/${id}/`, {
        method: "PATCH",
        headers: headers,
        body: body
      })
      toast({
        title: t("network.updated"),
        description: t("network.updatedSuccessfully"),
      })
      router.push("/dashboard/network/list")
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("network.failedToUpdate")
      setError(errorMessage)
      toast({
        title: t("network.failedToUpdate"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-gray-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <span className="text-gray-600 dark:text-gray-300">Chargement du réseau...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-gray-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => router.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-green-500 bg-clip-text text-transparent">
                  {t("network.edit") || "Edit Network"}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
                  Mettre à jour la configuration du réseau
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg mb-6">
            <CardContent className="p-6">
              <ErrorDisplay error={error} />
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Globe className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                </div>
                <span>Informations de base</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nom">Nom du réseau</Label>
                  <Input
                    id="nom"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="ex: MTN, Orange, Airtel"
                    className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="code">Code du réseau</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="ex: MTN, ORG, AIR"
                    className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="country">Pays</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                      <SelectValue placeholder="Sélectionner le pays" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id || country.uid} value={country.id || country.uid}>
                          {country.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ussdBaseCode">Code de base USSD</Label>
                  <Input
                    id="ussdBaseCode"
                    value={ussdBaseCode}
                    onChange={(e) => setUssdBaseCode(e.target.value)}
                    placeholder="ex: *123#"
                    className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="image" className="block mb-2">{t("network.image") || "Image / Logo"}</Label>
                  
                  {(existingImageUrl || image) && (
                    <div className="mb-3">
                      <div className="relative h-24 w-24 overflow-hidden rounded-lg border-2 border-orange-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center shadow-md p-1 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={image ? URL.createObjectURL(image) : (existingImageUrl?.startsWith('http') ? existingImageUrl : `${baseUrl.replace(/\/$/, "")}/${existingImageUrl?.replace(/^\//, "")}`)} 
                          alt="Network logo preview" 
                          className="object-contain h-full w-full rounded transition-opacity duration-300"
                          onLoad={(e) => (e.target as any).style.opacity = "1"}
                          onError={(e) => {
                            console.warn(`Failed to load network image: ${existingImageUrl}`);
                            (e.target as any).src = "https://placehold.co/100x100?text=Logo";
                          }}
                          style={{ opacity: 0 }}
                        />
                      </div>
                    </div>
                  )}

                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setImage(e.target.files[0]);
                      }
                    }}
                    className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 cursor-pointer"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Settings className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
                <span>Paramètres</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="isActive">Actif</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sentDepositToModule"
                    checked={sentDepositToModule}
                    onCheckedChange={setSentDepositToModule}
                  />
                  <Label htmlFor="sentDepositToModule">Envoyer le dépôt au module</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sentWithdrawalToModule"
                    checked={sentWithdrawalToModule}
                    onCheckedChange={setSentWithdrawalToModule}
                  />
                  <Label htmlFor="sentWithdrawalToModule">Envoyer le retrait au module</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={saving}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder les modifications
                </>
              )}
            </Button>
          </div>
        </form>

      </div>
    </div>
  )
} 