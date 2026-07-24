"use client"

import { useState, useEffect } from "react"
import { useApi } from "@/lib/useApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/providers/language-provider"
import { ArrowLeft, BarChart3, User, DollarSign, Calendar, CheckCircle, XCircle, Clock, AlertTriangle, Copy, Shield, CheckCircle2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
}

export default function BettingTransactionDetailsPage() {
  const params = useParams()
  const transactionUid = params?.uid as string
  const [transaction, setTransaction] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [cancellationDialogOpen, setCancellationDialogOpen] = useState(false)
  const [processingCancellation, setProcessingCancellation] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")
  const apiFetch = useApi()
  const baseUrl = getApiBaseUrl()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!transactionUid) return
      
      setLoading(true)
      setError("")
      try {
        const endpoint = `payments/betting/admin/transactions/${transactionUid}/`
        const data = await apiFetch(endpoint)
        setTransaction(data)
      } catch (err: any) {
        setError(extractErrorMessages(err))
      } finally {
        setLoading(false)
      }
    }
    fetchTransaction()
  }, [transactionUid, baseUrl, apiFetch])

  const processCancellation = async (approve: boolean) => {
    if (!transaction) return
    
    setProcessingCancellation(true)
    try {
      const endpoint = `payments/betting/admin/transactions/${transactionUid}/process_cancellation/`
      const payload = {
        success: approve,
        admin_notes: adminNotes || (approve ? "Cancellation approved" : "Cancellation rejected")
      }
      
      const response = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      // Update the transaction with the response data
      setTransaction(response.transaction)
      setCancellationDialogOpen(false)
      setAdminNotes("")
      
      toast({
        title: "Succès",
        description: response.message || (approve ? "Annulation approuvée" : "Annulation rejetée"),
      })
      
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setProcessingCancellation(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'success': { variant: 'success' as const, label: 'Succès' },
      'pending': { variant: 'warning' as const, label: 'En attente' },
      'failed': { variant: 'destructive' as const, label: 'Échoué' },
      'cancelled': { variant: 'secondary' as const, label: 'Annulé' },
      'processing': { variant: 'info' as const, label: 'En cours' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'secondary' as const, label: status }
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant={type === 'deposit' ? 'success' : 'info'}>
        {type === 'deposit' ? 'Dépôt' : 'Retrait'}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-gray-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <span className="text-gray-600 dark:text-gray-300">Chargement des détails de la transaction...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-gray-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/betting-transactions">
                <Button 
                  variant="outline" 
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </Button>
              </Link>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-green-500 bg-clip-text text-transparent">
                  Détails de la transaction
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
                  Informations complètes de la transaction de paris
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

        {/* Cancellation Processing Button */}
        {transaction && transaction.cancellation_requested_at && !transaction.cancelled_at && (
          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 shadow-lg mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300">
                      Demande d'annulation en attente
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      Demande faite par {transaction.cancellation_requested_by_name} le{" "}
                      {new Date(transaction.cancellation_requested_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Dialog open={cancellationDialogOpen} onOpenChange={setCancellationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Traiter l'annulation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Traiter la demande d'annulation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="admin-notes">Notes d'administration</Label>
                        <Textarea
                          id="admin-notes"
                          placeholder="Ajouter des notes sur la décision..."
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <DialogFooter className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => processCancellation(false)}
                        disabled={processingCancellation}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Rejeter
                      </Button>
                      <Button
                        onClick={() => processCancellation(true)}
                        disabled={processingCancellation}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approuver
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        )}

        {transaction && (
          <div className="space-y-6">
            {/* Transaction Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
                <CardContent className="p-4">
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-3 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Partenaire
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Nom:</span>
                      <p className="text-lg font-semibold text-blue-600">
                        {transaction.partner_name}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">ID:</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {transaction.partner}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700">
                <CardContent className="p-4">
                  <h4 className="font-medium text-orange-800 dark:text-orange-300 mb-3 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Plateforme
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Nom:</span>
                      <p className="text-lg font-semibold text-orange-600">
                        {transaction.platform_name}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">ID:</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {transaction.platform}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                <CardContent className="p-4">
                  <h4 className="font-medium text-green-800 dark:text-green-300 mb-3 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Transaction
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Type:</span>
                      <div className="mt-1">
                        {getTypeBadge(transaction.transaction_type)}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Montant:</span>
                      <p className="text-lg font-semibold text-green-600">
                        {parseFloat(transaction.amount).toFixed(2)} FCFA
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transaction Details */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <span>Détails de la transaction</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Référence:</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {transaction.reference}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => {
                            navigator.clipboard.writeText(transaction.reference)
                            toast({ title: "Référence copiée!" })
                          }}
                          aria-label="Copier la référence"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">UID:</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-sm font-mono text-gray-900 dark:text-gray-100">
                          {transaction.uid}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => {
                            navigator.clipboard.writeText(transaction.uid)
                            toast({ title: "UID copié!" })
                          }}
                          aria-label="Copier l'UID"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Statut:</span>
                      <div className="mt-1">
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Commission:</span>
                      <p className="text-lg font-semibold text-purple-600">
                        {parseFloat(transaction.commission_amount || 0).toFixed(2)} FCFA
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Commission payée:</span>
                      <div className="mt-1">
                        <Badge variant={transaction.commission_paid ? 'success' : 'secondary'}>
                          {transaction.commission_paid ? 'Oui' : 'Non'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Créé le:</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {transaction.created_at 
                          ? new Date(transaction.created_at).toLocaleString()
                          : 'Non disponible'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-indigo-600" />
                  <span>Informations supplémentaires</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">ID utilisateur betting:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {transaction.betting_user_id || 'Non disponible'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Code de retrait:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {transaction.withdrawal_code || 'Non disponible'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">ID transaction externe:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {transaction.external_transaction_id || 'Non disponible'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Taux de commission:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {transaction.commission_rate || 0}%
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Solde partenaire avant:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {parseFloat(transaction.partner_balance_before || 0).toFixed(2)} FCFA
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Solde partenaire après:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {parseFloat(transaction.partner_balance_after || 0).toFixed(2)} FCFA
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Mis à jour le:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {transaction.updated_at 
                        ? new Date(transaction.updated_at).toLocaleString()
                        : 'Non disponible'
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Peut être annulé:</span>
                    <div className="mt-1">
                      <Badge variant={transaction.is_cancellable ? 'warning' : 'secondary'}>
                        {transaction.is_cancellable ? 'Oui' : 'Non'}
                      </Badge>
                    </div>
                  </div>
                  {transaction.cancellation_requested_at && (
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Demande d'annulation:</span>
                      <div className="mt-1 space-y-1">
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          Demandée le: {new Date(transaction.cancellation_requested_at).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          Par: {transaction.cancellation_requested_by_name}
                        </p>
                        {transaction.cancelled_at && (
                          <>
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              Annulée le: {new Date(transaction.cancelled_at).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              Par: {transaction.cancelled_by_name}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* External Response */}
            {transaction.external_response && (
              <Card className="bg-gray-50 dark:bg-gray-800 border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span>Réponse externe</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Succès:</span>
                        <div className="mt-1">
                          <Badge variant={transaction.external_response.success ? 'success' : 'destructive'}>
                            {transaction.external_response.success ? 'Oui' : 'Non'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Montant:</span>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {transaction.external_response.amount || 'Non disponible'} FCFA
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">ID transaction:</span>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {transaction.external_response.transaction_id || 'Non disponible'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Référence:</span>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {transaction.external_response.reference || 'Non disponible'}
                        </p>
                      </div>
                    </div>
                    
                    {transaction.external_response.data && (
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Données détaillées:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">ID:</span>
                            <p className="text-gray-900 dark:text-gray-100">{transaction.external_response.data.id}</p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Statut:</span>
                            <p className="text-gray-900 dark:text-gray-100">{transaction.external_response.data.status}</p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Type:</span>
                            <p className="text-gray-900 dark:text-gray-100">{transaction.external_response.data.type_trans}</p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Code de retrait:</span>
                            <p className="text-gray-900 dark:text-gray-100">{transaction.external_response.data.withdriwal_code}</p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Créé le:</span>
                            <p className="text-gray-900 dark:text-gray-100">
                              {transaction.external_response.data.created_at 
                                ? new Date(transaction.external_response.data.created_at).toLocaleString()
                                : 'Non disponible'
                              }
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Dernière transaction XBet:</span>
                            <p className="text-gray-900 dark:text-gray-100">
                              {transaction.external_response.data.last_xbet_trans 
                                ? new Date(transaction.external_response.data.last_xbet_trans).toLocaleString()
                                : 'Non disponible'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {transaction.notes && (
              <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span>Notes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 p-3 rounded">
                    {transaction.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}