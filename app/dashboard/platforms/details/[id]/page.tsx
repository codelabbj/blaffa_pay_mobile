"use client"

import { useState, useEffect } from "react"
import { useApi } from "@/lib/useApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/providers/language-provider"
import { ArrowLeft, BarChart3, Users, TrendingUp, CheckCircle, XCircle, Clock, DollarSign, Calendar, User, Edit, ToggleLeft, ToggleRight, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { getApiBaseUrl } from "@/lib/env-config"


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

interface PlatformStats {
  total_transactions: number;
  successful_transactions: number;
  failed_transactions: number;
  pending_transactions: number;
  total_volume: number;
  total_commissions: number;
  active_partners: number;
}

export default function PlatformDetailsPage() {
  const params = useParams()
  const platformId = params.id as string
  
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState("")
  const [statsError, setStatsError] = useState("")
  const [toggleLoading, setToggleLoading] = useState(false)
  const { t } = useLanguage()
  const baseUrl = getApiBaseUrl()
  const { toast } = useToast()
  const apiFetch = useApi();
  const router = useRouter()

  // Fetch platform data on component mount
  useEffect(() => {
    const fetchPlatform = async () => {
      if (!platformId) return
      
      setLoading(true)
      setError("")
      try {
        const endpoint = `payments/betting/admin/platforms/${platformId}/`
        const data = await apiFetch(endpoint)
        setPlatform(data)
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        toast({ title: "Erreur", description: errorMessage, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchPlatform()
  }, [platformId, baseUrl, apiFetch, toast])

  // Fetch platform statistics
  useEffect(() => {
    const fetchStats = async () => {
      if (!platformId) return
      
      setStatsLoading(true)
      setStatsError("")
      try {
        const endpoint = `payments/betting/admin/platforms/${platformId}/stats/`
        const data = await apiFetch(endpoint)
        setPlatformStats(data)
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setStatsError(errorMessage)
        toast({ title: "Erreur", description: errorMessage, variant: "destructive" })
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  }, [platformId, baseUrl, apiFetch, toast])

  // Toggle platform status
  const handleToggleStatus = async () => {
    if (!platform) return
    
    setToggleLoading(true)
    try {
      const endpoint = `payments/betting/admin/platforms/${platform.uid}/toggle_status/`
      const data = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      
      // Update the platform status
      setPlatform(prev => prev ? { ...prev, is_active: data.is_active } : null)
      
      toast({ 
        title: "Succès", 
        description: data.message || `Plateforme ${data.is_active ? 'activée' : 'désactivée'}` 
      })
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      toast({ title: "Erreur", description: errorMessage, variant: "destructive" })
    } finally {
      setToggleLoading(false)
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-3 w-3" />
            <span>Actif</span>
          </div>
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
          <div className="flex items-center space-x-1">
            <XCircle className="h-3 w-3" />
            <span>Inactif</span>
          </div>
        </Badge>
      )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-gray-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              <span className="text-gray-600 dark:text-gray-300">Chargement de la plateforme...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-gray-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link href="/dashboard/platforms/list">
                <Button variant="outline" size="sm" className="bg-white dark:bg-gray-800">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </Link>
            </div>
          </div>
          <ErrorDisplay error={error} />
        </div>
      </div>
    )
  }

  if (!platform) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-gray-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link href="/dashboard/platforms/list">
                <Button variant="outline" size="sm" className="bg-white dark:bg-gray-800">
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-gray-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/dashboard/platforms/list">
              <Button variant="outline" size="sm" className="bg-white dark:bg-gray-800">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-green-500 bg-clip-text text-transparent">
                {platform.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
                Détails et statistiques de la plateforme
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href={`/dashboard/platforms/edit/${platform.uid}`}>
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </Link>
              <Button 
                onClick={handleToggleStatus}
                disabled={toggleLoading}
                className={platform.is_active 
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-green-500 hover:bg-green-600 text-white"
                }
              >
                {toggleLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : platform.is_active ? (
                  <ToggleLeft className="h-4 w-4 mr-2" />
                ) : (
                  <ToggleRight className="h-4 w-4 mr-2" />
                )}
                {platform.is_active ? 'Désactiver' : 'Activer'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Platform Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  <span>Informations de la Plateforme</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Platform Header */}
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-green-600 rounded-lg flex items-center justify-center text-white font-semibold text-xl">
                      {platform.name?.charAt(0)?.toUpperCase() || 'P'}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {platform.name}
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400">
                        ID: {platform.external_id}
                      </p>
                      <div className="mt-2">
                        {getStatusBadge(platform.is_active)}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Description</h3>
                    <p className="text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                      {platform.description}
                    </p>
                  </div>

                  {/* Limits */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg">
                      <h4 className="font-semibold text-orange-800 dark:text-orange-300 mb-4 flex items-center">
                        <DollarSign className="h-5 w-5 mr-2" />
                        Limites de Dépôt
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Minimum:</span>
                          <p className="text-xl font-bold text-orange-600">
                            {parseFloat(platform.min_deposit_amount).toFixed(2)} FCFA
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Maximum:</span>
                          <p className="text-xl font-bold text-orange-600">
                            {parseFloat(platform.max_deposit_amount).toFixed(2)} FCFA
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                      <h4 className="font-semibold text-green-800 dark:text-green-300 mb-4 flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Limites de Retrait
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Minimum:</span>
                          <p className="text-xl font-bold text-green-600">
                            {parseFloat(platform.min_withdrawal_amount).toFixed(2)} FCFA
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Maximum:</span>
                          <p className="text-xl font-bold text-green-600">
                            {parseFloat(platform.max_withdrawal_amount).toFixed(2)} FCFA
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Commission Rates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-4">Commission Dépôt</h4>
                      <p className="text-xl font-bold text-blue-600">
                        {platform.deposit_commission_rate != null
                          ? `${parseFloat(platform.deposit_commission_rate).toFixed(2)}%`
                          : "Fallback (partner / 1%)"}
                      </p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                      <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-4">Commission Retrait</h4>
                      <p className="text-xl font-bold text-purple-600">
                        {platform.withdrawal_commission_rate != null
                          ? `${parseFloat(platform.withdrawal_commission_rate).toFixed(2)}%`
                          : "Fallback (partner / 1%)"}
                      </p>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Informations de Création</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Créé par:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{platform.created_by_name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Créé le:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {new Date(platform.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Mis à jour le:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {new Date(platform.updated_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Statistiques Actuelles</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Partenaires actifs:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{platform.active_partners_count}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Transactions totales:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{platform.total_transactions_count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics Sidebar */}
          <div className="space-y-6">
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <span>Statistiques Détaillées</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex flex-col items-center space-y-4">
                      <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                      <span className="text-gray-600 dark:text-gray-300 text-sm">Chargement...</span>
                    </div>
                  </div>
                ) : statsError ? (
                  <ErrorDisplay error={statsError} />
                ) : platformStats ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Transactions totales</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {platformStats.total_transactions}
                      </p>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Transactions réussies</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {platformStats.successful_transactions}
                      </p>
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Transactions échouées</span>
                      </div>
                      <p className="text-2xl font-bold text-red-600">
                        {platformStats.failed_transactions}
                      </p>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Transactions en attente</span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-600">
                        {platformStats.pending_transactions}
                      </p>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-purple-600" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Volume total</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">
                        {platformStats.total_volume.toFixed(2)} FCFA
                      </p>
                    </div>

                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-indigo-600" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Partenaires actifs</span>
                      </div>
                      <p className="text-2xl font-bold text-indigo-600">
                        {platformStats.active_partners}
                      </p>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  )
}