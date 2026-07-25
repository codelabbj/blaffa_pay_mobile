"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApi } from "@/lib/useApi"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { useLanguage } from "@/components/providers/language-provider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ArrowLeft, DollarSign, Phone, Network, FileText, CheckCircle, AlertTriangle, Loader2, TrendingDown } from "lucide-react"
import { getApiBaseUrl } from "@/lib/env-config"

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

const baseUrl = getApiBaseUrl()

export default function WithdrawPage() {
  const [networks, setNetworks] = useState<any[]>([])
  const [network, setNetwork] = useState("")
  const [amount, setAmount] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")
  const [confirmRecipientPhone, setConfirmRecipientPhone] = useState("")
  const [objet, setObjet] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirmDetails, setConfirmDetails] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any | null>(null)
  const apiFetch = useApi()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const data = await apiFetch(`payments/networks/`)
        setNetworks(data.results || [])
      } catch (err) {
        setError(t("transactions.failedToLoadNetworks") || "Échec du chargement des réseaux")
      }
    }
    fetchNetworks()
  }, [apiFetch])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (recipientPhone.trim() !== confirmRecipientPhone.trim()) {
      setError(t("transactions.phoneMismatch") || "Le numéro de téléphone et la confirmation ne correspondent pas")
      return
    }
    if (!confirmDetails) {
      setError(t("transactions.confirmDetailsRequired") || "Veuillez confirmer le numéro de téléphone et le montant")
      return
    }
    // Prepare payload and open confirmation modal
    const payload = {
      type: "withdrawal",
      amount,
      recipient_phone: recipientPhone,
      recipient_name: null,
      objet: objet.trim() === "" ? null : objet,
      network,
    }
    setPendingPayload(payload)
    setShowConfirmModal(true)
  }

  const handleConfirmSubmit = async () => {
    if (!pendingPayload) return
    setLoading(true)
    setError("")
    try {
      await apiFetch(`payments/transactions/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingPayload),
        successMessage: t("transactions.transactionCreatedDesc") || "Transaction créée avec succès"
      })
      setShowConfirmModal(false)
      setPendingPayload(null)
      router.push("/dashboard/transactions")
    } catch (err: any) {
      setError(extractErrorMessages(err) || t("transactions.failedToCreateWithdrawal") || "Échec de la création du retrait")
    } finally {
      setLoading(false)
    }
  }

  const selectedNetwork = networks.find(n => n.uid === network)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:bg-boxdark-2">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-3 sm:px-6 py-4 sm:py-6">
        
        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-base font-bold sm:text-lg sm:text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t("transactions.withdrawTitle") || "Withdraw"}
                </h1>
                <p className="text-body dark:text-bodydark mt-2 text-lg">
                  Créer une nouvelle transaction de retrait
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-white dark:bg-boxdark rounded-lg px-4 py-2 shadow-sm">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-bodydark">
                    Nouveau retrait
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Form */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <CardHeader className="border-b border-gray-100 dark:border-strokedark">
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-300" />
              </div>
              <span>Détails du retrait</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Network Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-bodydark mb-2">
                  {t("transactions.selectNetwork") || "Select Network"}
                </label>
                <Select value={network} onValueChange={setNetwork}>
                  <SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
                    <SelectValue placeholder={t("transactions.selectNetwork") || "Select Network"} />
                  </SelectTrigger>
                  <SelectContent>
                    {networks.map((n) => (
                      <SelectItem key={n.uid} value={n.uid}>
                        <div className="flex items-center space-x-2">
                          <Network className="h-4 w-4 text-blue-600" />
                          <span>{n.nom}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-bodydark mb-2">
                  {t("transactions.amount") || "Amount"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-bodydark2" />
                  </div>
                  <Input
                    placeholder={t("transactions.amount") || "Amount"}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    type="number"
                    required
                    className="pl-10 bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                  />
                </div>
              </div>

              {/* Recipient Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-bodydark mb-2">
                  {t("transactions.recipientPhone") || "Recipient Phone"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-bodydark2" />
                  </div>
                  <Input
                    placeholder={t("transactions.recipientPhone") || "Recipient Phone"}
                    value={recipientPhone}
                    onChange={e => setRecipientPhone(e.target.value)}
                    required
                    className="pl-10 bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                  />
                </div>
              </div>

              {/* Confirm Recipient Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-bodydark mb-2">
                  {t("transactions.confirmRecipientPhone") || "Confirm Recipient Phone"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-bodydark2" />
                  </div>
                  <Input
                    placeholder={t("transactions.confirmRecipientPhone") || "Confirm Recipient Phone"}
                    value={confirmRecipientPhone}
                    onChange={e => setConfirmRecipientPhone(e.target.value)}
                    required
                    className="pl-10 bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                  />
                </div>
                {recipientPhone && confirmRecipientPhone && recipientPhone.trim() !== confirmRecipientPhone.trim() && (
                  <div className="mt-2 flex items-center space-x-2 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Les numéros de téléphone ne correspondent pas</span>
                  </div>
                )}
                {recipientPhone && confirmRecipientPhone && recipientPhone.trim() === confirmRecipientPhone.trim() && (
                  <div className="mt-2 flex items-center space-x-2 text-sm text-meta-3">
                    <CheckCircle className="h-4 w-4" />
                    <span>Les numéros de téléphone correspondent</span>
                  </div>
                )}
              </div>

              {/* Purpose/Objet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-bodydark mb-2">
                  {t("transactions.purpose") || "Purpose"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="h-5 w-5 text-bodydark2" />
                  </div>
                  <Input
                    placeholder={t("transactions.purpose") || "Purpose"}
                    value={objet}
                    onChange={e => setObjet(e.target.value)}
                    className="pl-10 bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                  />
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                <input
                  type="checkbox"
                  checked={confirmDetails}
                  onChange={e => setConfirmDetails(e.target.checked)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-stroke rounded"
                />
                <label className="text-sm text-red-800 dark:text-red-200">
                  {t("transactions.confirmationLabel") || "I confirm the phone number and amount are correct"}
                </label>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                  <ErrorDisplay error={error} variant="inline" />
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={
                  loading ||
                  !network ||
                  !confirmDetails ||
                  recipientPhone.trim() !== confirmRecipientPhone.trim()
                }
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("common.submitting") || "Soumission..."}
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 mr-2" />
                    {t("transactions.reviewAndConfirm") || t("transactions.createWithdrawal") || "Examiner et soumettre"}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Confirmation Modal */}
        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent className="bg-white dark:bg-boxdark border-0 shadow-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <span>{t("transactions.confirmWithdrawalTitle") || t("transactions.reviewAndConfirm") || "Confirmer le retrait"}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center p-3 bg-gray-50 dark:bg-boxdark-2/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Network className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-body dark:text-bodydark2">{t("transactions.selectNetwork") || "Réseau"}:</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{selectedNetwork?.nom || network}</span>
                </div>
                <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center p-3 bg-gray-50 dark:bg-boxdark-2/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-body dark:text-bodydark2">{t("transactions.amount") || "Montant"}:</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{amount}</span>
                </div>
                <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center p-3 bg-gray-50 dark:bg-boxdark-2/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm text-body dark:text-bodydark2">{t("transactions.recipientPhone") || "Téléphone du destinataire"}:</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{recipientPhone}</span>
                </div>
                {objet && (
                  <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center p-3 bg-gray-50 dark:bg-boxdark-2/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-body dark:text-bodydark2">{t("transactions.purpose") || "Objet"}:</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{objet}</span>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => { setShowConfirmModal(false); }} 
                disabled={loading}
                className="border-stroke dark:border-strokedark"
              >
                {t("common.cancel") || "Annuler"}
              </Button>
              <Button 
                onClick={handleConfirmSubmit} 
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("common.submitting") || "Soumission..."}
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 mr-2" />
                    {t("transactions.submit") || "Soumettre"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}