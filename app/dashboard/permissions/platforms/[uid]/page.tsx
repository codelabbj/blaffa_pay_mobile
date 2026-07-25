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
    <div className="min-h-screen bg-whiten dark:bg-boxdark-2">
      <div className="w-full">
        
        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoBack}
                className="text-body hover:text-gray-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-base font-bold sm:text-lg sm:text-2xl bg-gradient-to-r from-primary to-meta-3 bg-clip-text text-transparent">
                  Permissions Plateformes
                </h1>
                <p className="text-body dark:text-bodydark mt-2 text-lg">
                  Détails des permissions utilisateur sur les plateformes de paris
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="bg-white dark:bg-boxdark rounded-lg px-4 py-2 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-bodydark">
                    {userPlatformsData?.summary?.total_platforms || 0} plateformes
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {userPlatformsLoading && (
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <CardContent className="p-12">
              <div className="flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="text-body dark:text-bodydark">Chargement des permissions...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {userPlatformsError && (
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <CardContent className="p-3 sm:p-4 md:p-6">
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
              <CardContent className="p-3 sm:p-4 md:p-6">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-4 flex items-center text-lg">
                  <User className="h-5 w-5 mr-2" />
                  Informations Utilisateur
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-body dark:text-bodydark2">Nom:</span>
                    <p className="text-lg font-semibold text-blue-600">
                      {userPlatformsData.user_info?.display_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-body dark:text-bodydark2">Email:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {userPlatformsData.user_info?.email}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-body dark:text-bodydark2">Statut:</span>
                    <Badge className={userPlatformsData.user_info?.is_active ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"}>
                      {userPlatformsData.user_info?.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-body dark:text-bodydark2">Type:</span>
                    <Badge className={userPlatformsData.user_info?.is_partner ? "bg-meta-2 text-orange-800 dark:bg-orange-900/20 dark:text-secondary" : "bg-gray-100 text-gray-800 dark:bg-boxdark-2/20 dark:text-bodydark"}>
                      {userPlatformsData.user_info?.is_partner ? "Partenaire" : "Utilisateur"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Commission Config */}
            {userPlatformsData.commission_config && (
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <h4 className="font-medium text-green-800 dark:text-green-300 mb-4 flex items-center text-lg">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Configuration Commission
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                    <div>
                      <span className="text-sm font-medium text-body dark:text-bodydark2">Taux Dépôt:</span>
                      <p className="text-lg font-semibold text-meta-3">
                        {userPlatformsData.commission_config.deposit_commission_rate}%
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-body dark:text-bodydark2">Taux Retrait:</span>
                      <p className="text-lg font-semibold text-meta-3">
                        {userPlatformsData.commission_config.withdrawal_commission_rate}%
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-body dark:text-bodydark2">Statut:</span>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                        {userPlatformsData.commission_config.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            <Card className="bg-gray dark:bg-orange-900/20 border-stroke dark:border-orange-700">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <h4 className="font-medium text-orange-800 dark:text-secondary mb-4 flex items-center text-lg">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Résumé des Permissions
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  <div>
                    <span className="text-sm font-medium text-body dark:text-bodydark2">Total Plateformes:</span>
                    <p className="text-lg font-semibold text-primary">
                      {userPlatformsData.summary?.total_platforms}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-body dark:text-bodydark2">Avec Permissions:</span>
                    <p className="text-lg font-semibold text-primary">
                      {userPlatformsData.summary?.platforms_with_permissions}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-body dark:text-bodydark2">Sans Permissions:</span>
                    <p className="text-lg font-semibold text-primary">
                      {userPlatformsData.summary?.platforms_without_permissions}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-body dark:text-bodydark2">Permissions Actives:</span>
                    <p className="text-lg font-semibold text-primary">
                      {userPlatformsData.summary?.active_permissions}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Platforms with Permissions */}
            {userPlatformsData.platforms_with_permissions && userPlatformsData.platforms_with_permissions.length > 0 && (
              <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-meta-3" />
                    <span>Plateformes avec Permissions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userPlatformsData.platforms_with_permissions.map((platform: any) => (
                      <div key={platform.uid} className="border border-stroke dark:border-strokedark rounded-lg p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center mb-3">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-meta-3 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {platform.platform_name?.charAt(0)?.toUpperCase() || 'P'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {platform.platform_name}
                              </div>
                              <div className="text-sm text-body dark:text-bodydark2">
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
                            <span className="font-medium text-body dark:text-bodydark2">Limites Dépôt:</span>
                            <p className="text-gray-900 dark:text-gray-100">
                              {parseFloat(platform.min_deposit_amount).toFixed(0)} - {parseFloat(platform.max_deposit_amount).toFixed(0)} FCFA
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-body dark:text-bodydark2">Limites Retrait:</span>
                            <p className="text-gray-900 dark:text-gray-100">
                              {parseFloat(platform.min_withdrawal_amount).toFixed(0)} - {parseFloat(platform.max_withdrawal_amount).toFixed(0)} FCFA
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-body dark:text-bodydark2">Accordé par:</span>
                            <p className="text-gray-900 dark:text-gray-100">
                              {platform.granted_by_name}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-body dark:text-bodydark2">Créé le:</span>
                            <p className="text-gray-900 dark:text-gray-100">
                              {platform.created_at ? new Date(platform.created_at).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        {platform.transaction_stats && (
                          <div className="mt-4 pt-4 border-t border-stroke dark:border-strokedark">
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Statistiques Transactions</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              <div>
                                <span className="text-body dark:text-bodydark2">Total:</span>
                                <p className="font-medium">{platform.transaction_stats.total_transactions}</p>
                              </div>
                              <div>
                                <span className="text-body dark:text-bodydark2">Réussies:</span>
                                <p className="font-medium text-meta-3">{platform.transaction_stats.successful_transactions}</p>
                              </div>
                              <div>
                                <span className="text-body dark:text-bodydark2">Échouées:</span>
                                <p className="font-medium text-red-600">{platform.transaction_stats.failed_transactions}</p>
                              </div>
                              <div>
                                <span className="text-body dark:text-bodydark2">Commission:</span>
                                <p className="font-medium text-primary">{parseFloat(platform.transaction_stats.total_commission || 0).toFixed(2)} FCFA</p>
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
              <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span>Plateformes sans Permissions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userPlatformsData.platforms_without_permissions.map((platform: any, index: number) => (
                      <div key={index} className="border border-stroke dark:border-strokedark rounded-lg p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center mb-3">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {platform.platform_name?.charAt(0)?.toUpperCase() || 'P'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {platform.platform_name}
                              </div>
                              <div className="text-sm text-body dark:text-bodydark2">
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
                            <span className="font-medium text-body dark:text-bodydark2">Limites Dépôt:</span>
                            <p className="text-gray-900 dark:text-gray-100">
                              {platform.min_deposit_amount} - {platform.max_deposit_amount} FCFA
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-body dark:text-bodydark2">Limites Retrait:</span>
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