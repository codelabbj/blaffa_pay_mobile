"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { ArrowLeft, Save, Loader2, Settings, Globe, MessageSquare, AlertTriangle, Clock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getApiBaseUrl } from "@/lib/env-config"

const baseUrl = getApiBaseUrl()

// Colors for consistent theming
const COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981', 
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F97316',
  success: '#22C55E',
  info: '#06B6D4',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1'
};

export default function NetworkConfigCreatePage() {
  const router = useRouter()
  
  const [networks, setNetworks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Form state
  const [network, setNetwork] = useState("")
  const [isActive, setIsActive] = useState(true)
  
  // USSD Commands
  const [ussdBalance, setUssdBalance] = useState("*880#\n1\n{pin}")
  const [ussdDeposit, setUssdDeposit] = useState("*880#\n2\n1\n{phone}\n{phone}\n{amount}\n{pin}")
  const [ussdWithdrawal, setUssdWithdrawal] = useState("*880#\n3\n1\n{phone}\n{phone}\n{amount}\n{object}\n{pin}")
  
  // SMS Keywords
  const [smsBalanceKeywords, setSmsBalanceKeywords] = useState("solde actuel, votre solde")
  const [smsDepositKeywords, setSmsDepositKeywords] = useState("depot effectue, retrait effectue")
  const [smsWithdrawalKeywords, setSmsWithdrawalKeywords] = useState("vous avez envoye, transfert effectue")
  
  // Error Keywords
  const [errorKeywords, setErrorKeywords] = useState("solde insuffisant, code incorrect, service indisponible")
  
  // Custom Settings
  const [timeoutSeconds, setTimeoutSeconds] = useState(30)
  const [maxRetries, setMaxRetries] = useState(3)
  const [autoConfirm, setAutoConfirm] = useState(false)
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast();

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const data = await apiFetch(`payments/networks/`)
        setNetworks(Array.isArray(data) ? data : data.results || [])
        toast({
          title: t("networkConfig.networksLoaded"),
          description: t("networkConfig.networksLoadedSuccessfully"),
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("networkConfig.failedToLoadNetworks")
        setError(errorMessage)
        setNetworks([])
        toast({
          title: t("networkConfig.networksFailedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
    
    fetchNetworks()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      const payload = {
        network,
        ussd_commands: {
          balance: ussdBalance,
          deposit: ussdDeposit,
          withdrawal: ussdWithdrawal
        },
        sms_keywords: {
          balance: smsBalanceKeywords.split(',').map(k => k.trim()),
          deposit: smsDepositKeywords.split(',').map(k => k.trim()),
          withdrawal: smsWithdrawalKeywords.split(',').map(k => k.trim())
        },
        error_keywords: errorKeywords.split(',').map(k => k.trim()),
        is_active: isActive,
        custom_settings: {
          timeout_seconds: timeoutSeconds,
          max_retries: maxRetries,
          auto_confirm: autoConfirm
        }
      }
      
      await apiFetch(`payments/network-configs/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      
      toast({
        title: t("networkConfig.created"),
        description: t("networkConfig.createdSuccessfully"),
      })
      
      router.push("/dashboard/network-config/list")
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("networkConfig.failedToCreate")
      setError(errorMessage)
      toast({
        title: t("networkConfig.failedToCreate"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:bg-boxdark-2">
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
                <h1 className="text-base font-bold sm:text-lg sm:text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t("networkConfig.create") || "Create Network Configuration"}
                </h1>
                <p className="text-body dark:text-bodydark mt-2 text-lg">
                  Ajouter une nouvelle configuration de réseau
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
          {/* Basic Settings */}
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <CardHeader className="border-b border-gray-100 dark:border-strokedark">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Settings className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <span>Paramètres de base</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="network">Réseau</Label>
                  <Select value={network} onValueChange={setNetwork}>
                    <SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
                      <SelectValue placeholder="Sélectionner le réseau" />
                    </SelectTrigger>
                    <SelectContent>
                      {networks.map((net) => (
                        <SelectItem key={net.id || net.uid} value={net.id || net.uid}>
                          {net.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="isActive">Actif</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* USSD Commands */}
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <CardHeader className="border-b border-gray-100 dark:border-strokedark">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Globe className="h-5 w-5 text-meta-3 dark:text-green-300" />
                </div>
                <span>Commandes USSD</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                <div>
                  <Label htmlFor="ussdBalance">Commande de solde</Label>
                  <Textarea
                    id="ussdBalance"
                    value={ussdBalance}
                    onChange={(e) => setUssdBalance(e.target.value)}
                    placeholder="*880#\n1\n{pin}"
                    rows={3}
                    className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                  />
                </div>
                <div>
                  <Label htmlFor="ussdDeposit">Commande de dépôt</Label>
                  <Textarea
                    id="ussdDeposit"
                    value={ussdDeposit}
                    onChange={(e) => setUssdDeposit(e.target.value)}
                    placeholder="*880#\n2\n1\n{phone}\n{phone}\n{amount}\n{pin}"
                    rows={3}
                    className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                  />
                </div>
                <div>
                  <Label htmlFor="ussdWithdrawal">Commande de retrait</Label>
                  <Textarea
                    id="ussdWithdrawal"
                    value={ussdWithdrawal}
                    onChange={(e) => setUssdWithdrawal(e.target.value)}
                    placeholder="*880#\n3\n1\n{phone}\n{phone}\n{amount}\n{object}\n{pin}"
                    rows={3}
                    className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SMS Keywords */}
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <CardHeader className="border-b border-gray-100 dark:border-strokedark">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
                <span>Mots-clés SMS</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                <div>
                  <Label htmlFor="smsBalance">Mots-clés de solde (séparés par des virgules)</Label>
                  <Input
                    id="smsBalance"
                    value={smsBalanceKeywords}
                    onChange={(e) => setSmsBalanceKeywords(e.target.value)}
                    placeholder="solde actuel, votre solde"
                    className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                  />
                </div>
                <div>
                  <Label htmlFor="smsDeposit">Mots-clés de dépôt (séparés par des virgules)</Label>
                  <Input
                    id="smsDeposit"
                    value={smsDepositKeywords}
                    onChange={(e) => setSmsDepositKeywords(e.target.value)}
                    placeholder="depot effectue, retrait effectue"
                    className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                  />
                </div>
                <div>
                  <Label htmlFor="smsWithdrawal">Mots-clés de retrait (séparés par des virgules)</Label>
                  <Input
                    id="smsWithdrawal"
                    value={smsWithdrawalKeywords}
                    onChange={(e) => setSmsWithdrawalKeywords(e.target.value)}
                    placeholder="vous avez envoye, transfert effectue"
                    className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Keywords */}
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <CardHeader className="border-b border-gray-100 dark:border-strokedark">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-300" />
                </div>
                <span>Mots-clés d'erreur</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div>
                <Label htmlFor="errorKeywords">Mots-clés d'erreur (séparés par des virgules)</Label>
                <Input
                  id="errorKeywords"
                  value={errorKeywords}
                  onChange={(e) => setErrorKeywords(e.target.value)}
                  placeholder="solde insuffisant, code incorrect, service indisponible"
                  className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                />
              </div>
            </CardContent>
          </Card>

          {/* Custom Settings */}
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <CardHeader className="border-b border-gray-100 dark:border-strokedark">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-meta-2 dark:bg-orange-900 rounded-lg">
                  <Clock className="h-5 w-5 text-primary dark:text-secondary" />
                </div>
                <span>Paramètres personnalisés</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                <div>
                  <Label htmlFor="timeoutSeconds">Délai d'attente (secondes)</Label>
                  <Input
                    id="timeoutSeconds"
                    type="number"
                    value={timeoutSeconds}
                    onChange={(e) => setTimeoutSeconds(parseInt(e.target.value) || 30)}
                    min="1"
                    max="300"
                    className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                  />
                </div>
                <div>
                  <Label htmlFor="maxRetries">Tentatives maximales</Label>
                  <Input
                    id="maxRetries"
                    type="number"
                    value={maxRetries}
                    onChange={(e) => setMaxRetries(parseInt(e.target.value) || 3)}
                    min="1"
                    max="10"
                    className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoConfirm"
                    checked={autoConfirm}
                    onCheckedChange={setAutoConfirm}
                  />
                  <Label htmlFor="autoConfirm">Confirmation automatique</Label>
                </div>
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
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Créer la configuration
                </>
              )}
            </Button>
          </div>
        </form>

      </div>
    </div>
  )
} 