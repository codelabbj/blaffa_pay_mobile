"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/providers/language-provider"
import { useApi } from "@/lib/useApi"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { Copy, ArrowLeft, Save, RefreshCw, FileText, Phone, User, Calendar, DollarSign, Network, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"
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

export default function EditTransactionPage() {
  const { uid } = useParams()
  const { t } = useLanguage()
  const apiFetch = useApi()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [transaction, setTransaction] = useState<any>(null)
  const [form, setForm] = useState({
    recipient_name: "",
    objet: "",
    external_transaction_id: "",
    raw_sms: "",
    processed_by_phone: "",
  })

  // Transaction logs state
  const [logs, setLogs] = useState<any[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsError, setLogsError] = useState("")

  useEffect(() => {
    const fetchTransaction = async () => {
      setLoading(true)
      setError("")
      try {
        const data = await apiFetch(`payments/transactions/${uid}/`)
        setTransaction(data)
        setForm({
          recipient_name: data.recipient_name || data.display_recipient_name || "",
          objet: data.objet || "",
          external_transaction_id: data.external_transaction_id || "",
          raw_sms: data.raw_sms || "",
          processed_by_phone: data.processed_by_phone || "",
        })
      } catch (err: any) {
        setError(extractErrorMessages(err) || t("transactions.failedToLoad"))
      } finally {
        setLoading(false)
      }
    }
    fetchTransaction()
  }, [uid])

  // Fetch transaction logs
  const fetchTransactionLogs = async () => {
    setLogsLoading(true)
    setLogsError("")
    try {
      const data = await apiFetch(`payments/transaction-logs/?transaction=${uid}`)
      const items = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []
      setLogs(items)
    } catch (err: any) {
      setLogsError(extractErrorMessages(err) || (t("transactions.failedToLoad") || "Failed to load"))
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    if (uid) fetchTransactionLogs()
  }, [uid])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const [copied, setCopied] = useState(false)
  const handleCopyReference = () => {
    if (transaction?.reference) {
      navigator.clipboard.writeText(transaction.reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const payload = {
        recipient_name: form.recipient_name,
        objet: form.objet,
        external_transaction_id: form.external_transaction_id,
        raw_sms: form.raw_sms,
        processed_by_phone: form.processed_by_phone,
      }
      await apiFetch(`payments/transactions/${uid}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        successMessage: t("transactions.transactionUpdatedSuccessfully") || "Transaction mise à jour avec succès"
      })
      router.push("/dashboard/transactions")
    } catch (err: any) {
      setError(extractErrorMessages(err) || t("transactions.failedToUpdate"))
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
      failed: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
      cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
    } as const

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
        {status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
        {status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
        {status === 'cancelled' && <AlertTriangle className="h-3 w-3 mr-1" />}
        {t(`transactions.${status}`)}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:bg-boxdark-2 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="text-body dark:text-bodydark text-lg">Chargement de la transaction...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:bg-boxdark-2 flex items-center justify-center">
        <div className="max-w-md w-full">
          <ErrorDisplay error={error} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:bg-boxdark-2">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-3 sm:px-6 py-4 sm:py-6">
        
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
                  Modifier la transaction
                </h1>
                <p className="text-body dark:text-bodydark mt-2 text-lg">
                  Mettre à jour les détails de la transaction et consulter les journaux
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-white dark:bg-boxdark rounded-lg px-4 py-2 shadow-sm">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-bodydark">
                    ID: {uid}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Information */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
          <CardHeader className="border-b border-gray-100 dark:border-strokedark">
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <span>Détails de la transaction</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:p-4 md:p-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-body dark:text-bodydark2">Référence</div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{transaction.reference}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyReference}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    {copied && <span className="text-xs text-meta-3">Copié!</span>}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <DollarSign className="h-4 w-4 text-meta-3" />
                </div>
                <div>
                  <div className="text-sm text-body dark:text-bodydark2">Montant</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{transaction.amount}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Network className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-body dark:text-bodydark2">Réseau</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{transaction.network_name}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-2 bg-meta-2 dark:bg-orange-900 rounded-lg">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-body dark:text-bodydark2">Destinataire</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {transaction.display_recipient_name || transaction.recipient_name}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                  <Phone className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm text-body dark:text-bodydark2">Téléphone du destinataire</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{transaction.recipient_phone}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <Calendar className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <div className="text-sm text-body dark:text-bodydark2">Créé</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {transaction.created_at ? new Date(transaction.created_at).toLocaleString() : "-"}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-2 bg-gray-100 dark:bg-boxdark-2 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-body" />
                </div>
                <div>
                  <div className="text-sm text-body dark:text-bodydark2">Statut</div>
                  <div>{getStatusBadge(transaction.status)}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-body dark:text-bodydark2">Traité par</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{transaction.processed_by_name}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <DollarSign className="h-4 w-4 text-meta-3" />
                </div>
                <div>
                  <div className="text-sm text-body dark:text-bodydark2">Frais</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{transaction.fees ?? "-"}</div>
                </div>
              </div>
            </div>

            {/* Balance Information */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-boxdark-2/50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-bodydark mb-3">Informations sur le solde</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                <div>
                  <div className="text-sm text-body dark:text-bodydark2">Solde avant</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{transaction.balance_before ?? "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-body dark:text-bodydark2">Solde après</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{transaction.balance_after ?? "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-body dark:text-bodydark2">Type</div>
                  <Badge variant="outline">{t(`transactions.${transaction.type}`)}</Badge>
                </div>
              </div>
            </div>

            {/* Messages */}
            {(transaction.confirmation_message || transaction.error_message) && (
              <div className="mt-6 space-y-4">
                {transaction.confirmation_message && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-meta-3" />
                      <span className="font-medium text-green-800 dark:text-green-200">Message de confirmation</span>
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">{transaction.confirmation_message}</div>
                  </div>
                )}
                {transaction.error_message && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-800 dark:text-red-200">Message d'erreur</span>
                    </div>
                    <div className="text-sm text-red-700 dark:text-red-300">{transaction.error_message}</div>
                  </div>
                )}
              </div>
            )}

            {/* USSD Path */}
            {transaction.ussd_path && Array.isArray(transaction.ussd_path) && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-bodydark mb-3">Chemin USSD</h3>
                <div className="bg-gray-50 dark:bg-boxdark-2/50 p-4 rounded-lg">
                  <pre className="text-xs whitespace-pre-wrap font-mono text-gray-700 dark:text-bodydark">
                    {transaction.ussd_path.map((step: string, idx: number) => {
                      const [key, ...rest] = step.split(":")
                      const value = rest.join(":").trim()
                      return (
                        <div key={idx} className="mb-3 last:mb-0">
                          <span className="font-bold text-blue-600">{key}:</span>{" "}
                          <span>{value}</span>
                        </div>
                      )
                    })}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
          <CardHeader className="border-b border-gray-100 dark:border-strokedark">
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Save className="h-5 w-5 text-meta-3 dark:text-green-300" />
              </div>
              <span>Modifier la transaction</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:p-4 md:p-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-bodydark mb-2">
                    {t("transactions.recipientName") || "Recipient Name"}
                  </label>
                  <Input 
                    name="recipient_name" 
                    value={form.recipient_name} 
                    onChange={handleChange}
                    className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-bodydark mb-2">Objet</label>
                  <Input 
                    name="objet" 
                    value={form.objet} 
                    onChange={handleChange}
                    className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-bodydark mb-2">
                    {t("transactions.externalTransactionId")}
                  </label>
                  <Input 
                    name="external_transaction_id" 
                    value={form.external_transaction_id} 
                    onChange={handleChange}
                    className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-bodydark mb-2">
                    {t("transactions.rawSms")}
                  </label>
                  <Textarea 
                    name="raw_sms" 
                    value={form.raw_sms} 
                    onChange={handleChange} 
                    rows={4} 
                    placeholder="Entrer le contenu du SMS brut..."
                    className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-bodydark mb-2">
                    Traité par téléphone
                  </label>
                  <Input 
                    name="processed_by_phone" 
                    value={form.processed_by_phone} 
                    onChange={handleChange}
                    className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t("transactions.saving")}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {t("transactions.saveChanges")}
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()}
                  className="border-stroke dark:border-strokedark"
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Transaction Logs */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <CardHeader className="border-b border-gray-100 dark:border-strokedark">
            <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
                <span>{t("transactionLogs.title") || "Transaction Logs"}</span>
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchTransactionLogs} 
                disabled={logsLoading}
                className="border-stroke dark:border-strokedark"
              >
                {logsLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Chargement...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t("common.refresh") || "Refresh"}
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            {logsError && (
              <div className="mb-6">
                <ErrorDisplay error={logsError} onRetry={fetchTransactionLogs} />
              </div>
            )}
            {logsLoading && !logs.length ? (
              <div className="flex items-center justify-center py-6 sm:py-10">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-body dark:text-bodydark">Chargement des journaux...</span>
                </div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-6 sm:py-10">
                <FileText className="h-12 w-12 text-bodydark2 mx-auto mb-4" />
                <p className="text-body dark:text-bodydark2">{t("transactionLogs.empty") || "Aucun journal pour cette transaction."}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log: any, idx: number) => (
                  <div key={log.uid || log.id || idx} className="bg-gray-50 dark:bg-boxdark-2/50 rounded-lg p-4 border border-stroke dark:border-strokedark">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 bg-blue-100 dark:bg-blue-900 rounded">
                          <FileText className="h-3 w-3 text-blue-600" />
                        </div>
                        <span className="text-sm text-body dark:text-bodydark2">
                          {new Date(log.created_at || log.timestamp || Date.now()).toLocaleString()}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {log.type || log.event || log.status || "event"}
                      </Badge>
                    </div>
                    {log.message && (
                      <div className="text-sm text-gray-900 dark:text-gray-100 mb-3">{log.message}</div>
                    )}
                    {(log.data || log.payload || log.meta) && (
                      <div className="bg-white dark:bg-boxdark p-3 rounded border border-stroke dark:border-strokedark">
                        <pre className="text-xs whitespace-pre-wrap break-words text-gray-700 dark:text-bodydark">
                          {JSON.stringify(log.data || log.payload || log.meta, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}