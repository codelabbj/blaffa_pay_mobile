"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useApi } from "@/lib/useApi"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { Settings, ArrowLeft, Save, Loader2, Globe, MessageSquare, AlertTriangle, Clock, RefreshCw } from "lucide-react"
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

export default function NetworkConfigEditPage() {
  const router = useRouter()
  const params = useParams()
  const { id } = params
  const apiFetch = useApi()
  const { toast } = useToast();
  
  const [networks, setNetworks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [network, setNetwork] = useState("")
  const [isActive, setIsActive] = useState(true)
  
  // USSD Commands
  const [ussdBalance, setUssdBalance] = useState("")
  const [ussdDeposit, setUssdDeposit] = useState("")
  const [ussdWithdrawal, setUssdWithdrawal] = useState("")
  
  // SMS Keywords
  const [smsBalanceKeywords, setSmsBalanceKeywords] = useState("")
  const [smsDepositKeywords, setSmsDepositKeywords] = useState("")
  const [smsWithdrawalKeywords, setSmsWithdrawalKeywords] = useState("")
  
  // Error Keywords
  const [errorKeywords, setErrorKeywords] = useState("")
  
  // Custom Settings
  const [timeoutSeconds, setTimeoutSeconds] = useState(30)
  const [maxRetries, setMaxRetries] = useState(3)
  const [autoConfirm, setAutoConfirm] = useState(false)

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const data = await apiFetch(`payments/networks/`)
        setNetworks(Array.isArray(data) ? data : data.results || [])
        toast({
          title: "Réseaux chargés",
          description: "Les réseaux ont été chargés avec succès.",
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || "Échec du chargement des réseaux"
        setError(errorMessage)
        setNetworks([])
        toast({
          title: "Échec du chargement des réseaux",
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
    
    fetchNetworks()
  }, [])

  useEffect(() => {
    if (!id) return
    
    const fetchNetworkConfig = async () => {
      setLoading(true)
      setError("")
      try {
        const data = await apiFetch(`payments/network-configs/${id}/`)
        
        setNetwork(data.network || "")
        setIsActive(data.is_active)
        
        // USSD Commands
        if (data.ussd_commands) {
          setUssdBalance(data.ussd_commands.balance || "")
          setUssdDeposit(data.ussd_commands.deposit || "")
          setUssdWithdrawal(data.ussd_commands.withdrawal || "")
        }
        
        // SMS Keywords
        if (data.sms_keywords) {
          setSmsBalanceKeywords(Array.isArray(data.sms_keywords.balance) ? data.sms_keywords.balance.join(', ') : "")
          setSmsDepositKeywords(Array.isArray(data.sms_keywords.deposit) ? data.sms_keywords.deposit.join(', ') : "")
          setSmsWithdrawalKeywords(Array.isArray(data.sms_keywords.withdrawal) ? data.sms_keywords.withdrawal.join(', ') : "")
        }
        
        // Error Keywords
        if (data.error_keywords) {
          setErrorKeywords(Array.isArray(data.error_keywords) ? data.error_keywords.join(', ') : "")
        }
        
        // Custom Settings
        if (data.custom_settings) {
          setTimeoutSeconds(data.custom_settings.timeout_seconds || 30)
          setMaxRetries(data.custom_settings.max_retries || 3)
          setAutoConfirm(data.custom_settings.auto_confirm || false)
        }
        
        toast({
          title: "Configuration chargée",
          description: "La configuration du réseau a été chargée avec succès.",
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || "Échec du chargement de la configuration"
        setError(errorMessage)
        toast({
          title: "Échec du chargement de la configuration",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchNetworkConfig()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const configData = {
        network: network,
        is_active: isActive,
        ussd_commands: {
          balance: ussdBalance,
          deposit: ussdDeposit,
          withdrawal: ussdWithdrawal
        },
        sms_keywords: {
          balance: smsBalanceKeywords.split(',').map(k => k.trim()).filter(k => k),
          deposit: smsDepositKeywords.split(',').map(k => k.trim()).filter(k => k),
          withdrawal: smsWithdrawalKeywords.split(',').map(k => k.trim()).filter(k => k)
        },
        error_keywords: errorKeywords.split(',').map(k => k.trim()).filter(k => k),
        custom_settings: {
          timeout_seconds: timeoutSeconds,
          max_retries: maxRetries,
          auto_confirm: autoConfirm
        }
      }
      
      await apiFetch(`payments/network-configs/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(configData)
      })
      
      toast({
        title: "Configuration mise à jour",
        description: "La configuration du réseau a été mise à jour avec succès.",
      })
      
      router.push('/dashboard/network-config/list')
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || "Échec de la mise à jour de la configuration"
      setError(errorMessage)
      toast({
        title: "Échec de la mise à jour de la configuration",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="text-gray-600 dark:text-gray-300">Chargement de la configuration...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Modifier la configuration du réseau
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
                  Mettre à jour les paramètres de configuration du réseau
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
          {/* Basic Settings */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Settings className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <span>Paramètres de base</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="network">Réseau</Label>
                  <Select value={network} onValueChange={setNetwork}>
                    <SelectTrigger className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
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
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Globe className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
                <span>Commandes USSD</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="ussdBalance">Commande de solde</Label>
                  <Input
                    id="ussdBalance"
                    value={ussdBalance}
                    onChange={(e) => setUssdBalance(e.target.value)}
                    placeholder="e.g., *123#"
                    className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="ussdDeposit">Commande de dépôt</Label>
                  <Input
                    id="ussdDeposit"
                    value={ussdDeposit}
                    onChange={(e) => setUssdDeposit(e.target.value)}
                    placeholder="e.g., *124#"
                    className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="ussdWithdrawal">Commande de retrait</Label>
                  <Input
                    id="ussdWithdrawal"
                    value={ussdWithdrawal}
                    onChange={(e) => setUssdWithdrawal(e.target.value)}
                    placeholder="e.g., *125#"
                    className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SMS Keywords */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
                <span>Mots-clés SMS</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="smsBalance">Mots-clés de solde</Label>
                  <Input
                    id="smsBalance"
                    value={smsBalanceKeywords}
                    onChange={(e) => setSmsBalanceKeywords(e.target.value)}
                    placeholder="e.g., BAL, BALANCE, SOLDE"
                    className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="smsDeposit">Mots-clés de dépôt</Label>
                  <Input
                    id="smsDeposit"
                    value={smsDepositKeywords}
                    onChange={(e) => setSmsDepositKeywords(e.target.value)}
                    placeholder="e.g., DEP, DEPOSIT, VERSER"
                    className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="smsWithdrawal">Mots-clés de retrait</Label>
                  <Input
                    id="smsWithdrawal"
                    value={smsWithdrawalKeywords}
                    onChange={(e) => setSmsWithdrawalKeywords(e.target.value)}
                    placeholder="e.g., WIT, WITHDRAW, RETIRER"
                    className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Keywords */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-300" />
                </div>
                <span>Mots-clés d'erreur</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div>
                <Label htmlFor="errorKeywords">Mots-clés d'erreur (séparés par des virgules)</Label>
                <Input
                  id="errorKeywords"
                  value={errorKeywords}
                  onChange={(e) => setErrorKeywords(e.target.value)}
                  placeholder="e.g., ERROR, FAILED, ECHEC, INSUFFICIENT"
                  className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Custom Settings */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                </div>
                <span>Paramètres personnalisés</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="timeoutSeconds">Délai d'attente (secondes)</Label>
                  <Input
                    id="timeoutSeconds"
                    type="number"
                    value={timeoutSeconds}
                    onChange={(e) => setTimeoutSeconds(parseInt(e.target.value) || 30)}
                    min="1"
                    max="300"
                    className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
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
                    className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
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
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
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