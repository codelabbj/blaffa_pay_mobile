"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { ArrowLeft, Save, Loader2, Globe, CheckCircle } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { getApiBaseUrl } from "@/lib/env-config"

const baseUrl = getApiBaseUrl()

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

export default function CountryCreatePage() {
  const [nom, setNom] = useState("")
  const [code, setCode] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast();

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await apiFetch(`payments/countries/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, code, is_active: isActive })
      })
      toast({
        title: t("country.created"),
        description: t("country.createdSuccessfully"),
      })
      router.push("/dashboard/country/list")
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("country.failedToCreate")
      setError(errorMessage)
      toast({
        title: t("country.failedToCreate"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-whiten dark:bg-boxdark-2">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-3 sm:px-6 py-4 sm:py-6">
        
        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button 
                variant="outline" 
                onClick={() => router.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <div>
                <h1 className="text-base font-bold sm:text-lg sm:text-2xl bg-gradient-to-r from-primary to-meta-3 bg-clip-text text-transparent">
                  {t("country.create") || "Create Country"}
                </h1>
                <p className="text-body dark:text-bodydark mt-2 text-lg">
                  Ajouter une nouvelle configuration de pays
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <ErrorDisplay error={error} />
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Country Information */}
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <CardHeader className="border-b border-gray-100 dark:border-strokedark">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-meta-2 dark:bg-orange-900 rounded-lg">
                  <Globe className="h-5 w-5 text-primary dark:text-secondary" />
                </div>
                <span>Informations sur le pays</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nom">Nom du pays</Label>
                  <Input
                    id="nom"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="ex: Cameroun, Nigeria, Ghana"
                    className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="code">Code du pays</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="ex: CM, NG, GH"
                    className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="isActive">Actif</Label>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 sm:gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
            >
              Annuler
            </Button>
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
                  Créer le pays
                </>
              )}
            </Button>
          </div>
        </form>

      </div>
    </div>
  )
} 