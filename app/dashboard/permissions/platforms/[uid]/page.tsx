"use client"

import { useState, useEffect } from "react"
import { useApi } from "@/lib/useApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/providers/language-provider"
import { ArrowLeft, Users, User, DollarSign, BarChart3, CheckCircle, XCircle, Calendar, TrendingUp, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { useRouter, useParams } from "next/navigation"
import { getApiBaseUrl } from "@/lib/env-config"


export default function UserPlatformsPage() {
  const [userPlatformsData, setUserPlatformsData] = useState<any | null>(null)
  const [userPlatformsLoading, setUserPlatformsLoading] = useState(false)
  const [userPlatformsError, setUserPlatformsError] = useState("")
  const { t } = useLanguage()
  const baseUrl = getApiBaseUrl()
  const { toast } = useToast()
  const apiFetch = useApi()
  const router = useRouter()
  const params = useParams()
  const userUid = params.uid as string

  // Fetch user platform permissions
  useEffect(() => {
    const fetchUserPlatforms = async () => {
      if (!userUid) return
      
      setUserPlatformsLoading(true)
      setUserPlatformsError("")
      setUserPlatformsData(null)
      try {
        const endpoint = `payments/betting/admin/permissions/user_platforms/?user_uid=${userUid}`
        const data = await apiFetch(endpoint)
        setUserPlatformsData(data)
      } catch (err: any) {
        setUserPlatformsError(extractErrorMessages(err))
        toast({ title: "Erreur", description: extractErrorMessages(err), variant: "destructive" })
      } finally {
        setUserPlatformsLoading(false)
      }
    }
    fetchUserPlatforms()
  }, [userUid, baseUrl, apiFetch, toast])

  const handleGoBack = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-gray-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoBack}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-green-500 bg-clip-text text-transparent">
                  Permissions Plateformes
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
                  Détails des permissions utilisateur sur les plateformes de paris
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {userPlatformsData?.summary?.total_platforms || 0} plateformes
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {userPlatformsLoading && (
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardContent className="p-12">
              <div className="flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="text-gray-600 dark:text-gray-300">Chargement des permissions...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {userPlatformsError && (
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <ErrorDisplay error={userPlatformsError} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        {userPlatformsData && !userPlatformsLoading && !userPlatformsError && (
          <div className="space-y-6">
            {/* User Info */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
              <CardContent className="p-6">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-4 flex items-center text-lg">
                  <User className="h-5 w-5 mr-2" />
                  Informations Utilisateur
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Nom:</span>
                    <p className="text-lg font-semibold text-blue-600">
                      {userPlatformsData.user_info?.display_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Email:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {userPlatformsData.user_info?.email}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Statut:</span>
                    <Badge className={userPlatformsData.user_info?.is_active ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"}>
                      {userPlatformsData.user_info?.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Type:</span>
                    <Badge className={userPlatformsData.user_info?.is_partner ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300" : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"}>
                      {userPlatformsData.user_info?.is_partner ? "Partenaire" : "Utilisateur"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Commission Config */}
            {userPlatformsData.commission_config && (
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                <CardContent className="p-6">
                  <h4 className="font-medium text-green-800 dark:text-green-300 mb-4 flex items-center text-lg">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Configuration Commission
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Taux Dépôt:</span>
                      <p className="text-lg font-semibold text-green-600">
                        {userPlatformsData.commission_config.deposit_commission_rate}%
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Taux Retrait:</span>
                      <p className="text-lg font-semibold text-green-600">
                        {userPlatformsData.commission_config.withdrawal_commission_rate}%
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Statut:</span>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                        {userPlatformsData.commission_config.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700">
              <CardContent className="p-6">
                <h4 className="font-medium text-orange-800 dark:text-orange-300 mb-4 flex items-center text-lg">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Résumé des Permissions
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Plateformes:</span>
                    <p className="text-lg font-semibold text-orange-600">
                      {userPlatformsData.summary?.total_platforms}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Avec Permissions:</span>
                    <p className="text-lg font-semibold text-orange-600">
                      {userPlatformsData.summary?.platforms_with_permissions}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sans Permissions:</span>
                    <p className="text-lg font-semibold text-orange-600">
                      {userPlatformsData.summary?.platforms_without_permissions}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Permissions Actives:</span>
                    <p className="text-lg font-semibold text-orange-600">
                      {userPlatformsData.summary?.active_permissions}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Platforms with Permissions */}
            {userPlatformsData.platforms_with_permissions && userPlatformsData.platforms_with_permissions.length > 0 && (
              <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Plateformes avec Permissions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userPlatformsData.platforms_with_permissions.map((platform: any) => (
                      <div key={platform.uid} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {platform.platform_name?.charAt(0)?.toUpperCase() || 'P'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {platform.platform_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                ID: {platform.platform_external_id}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={platform.can_deposit ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"}>
                              {platform.can_deposit ? "Dépôt" : "Pas de dépôt"}
                            </Badge>
                            <Badge className={platform.can_withdraw ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"}>
                              {platform.can_withdraw ? "Retrait" : "Pas de retrait"}
                            </Badge>
                            <Badge className={platform.is_active ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"}>
                              {platform.is_active ? "Actif" : "Inactif"}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Limites Dépôt:</span>
                            <p className="text-gray-900 dark:text-gray-100">
                              {parseFloat(platform.min_deposit_amount).toFixed(0)} - {parseFloat(platform.max_deposit_amount).toFixed(0)} FCFA
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Limites Retrait:</span>
                            <p className="text-gray-900 dark:text-gray-100">
                              {parseFloat(platform.min_withdrawal_amount).toFixed(0)} - {parseFloat(platform.max_withdrawal_amount).toFixed(0)} FCFA
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Accordé par:</span>
                            <p className="text-gray-900 dark:text-gray-100">
                              {platform.granted_by_name}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Créé le:</span>
                            <p className="text-gray-900 dark:text-gray-100">
                              {platform.created_at ? new Date(platform.created_at).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        {platform.transaction_stats && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Statistiques Transactions</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Total:</span>
                                <p className="font-medium">{platform.transaction_stats.total_transactions}</p>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Réussies:</span>
                                <p className="font-medium text-green-600">{platform.transaction_stats.successful_transactions}</p>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Échouées:</span>
                                <p className="font-medium text-red-600">{platform.transaction_stats.failed_transactions}</p>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Commission:</span>
                                <p className="font-medium text-orange-600">{parseFloat(platform.transaction_stats.total_commission || 0).toFixed(2)} FCFA</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Platforms without Permissions */}
            {userPlatformsData.platforms_without_permissions && userPlatformsData.platforms_without_permissions.length > 0 && (
              <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span>Plateformes sans Permissions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userPlatformsData.platforms_without_permissions.map((platform: any, index: number) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {platform.platform_name?.charAt(0)?.toUpperCase() || 'P'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {platform.platform_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                ID: {platform.platform_external_id}
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                            Aucune permission
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Limites Dépôt:</span>
                            <p className="text-gray-900 dark:text-gray-100">
                              {platform.min_deposit_amount} - {platform.max_deposit_amount} FCFA
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Limites Retrait:</span>
                            <p className="text-gray-900 dark:text-gray-100">
                              {platform.min_withdrawal_amount} - {platform.max_withdrawal_amount} FCFA
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}