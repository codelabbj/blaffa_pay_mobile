"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/useApi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display";
import { ArrowLeft, DollarSign, Calendar, TrendingUp, Users, Loader2, Save, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { getApiBaseUrl } from "@/lib/env-config"


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

export default function CommissionStatPage({ params }: { params: { user_id: string } }) {
  const userId = params.user_id;
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");
  const [lastPeriodEnd, setLastPeriodEnd] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const apiFetch = useApi();
  const baseUrl = getApiBaseUrl();
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const endpoint = `payments/admin/users/${userId}/commission-stats/`;
        const data = await apiFetch(endpoint);
        setStats(data);
        // Find last period_end from commission_history
        if (data.commission_history && data.commission_history.length > 0) {
          const last = data.commission_history[data.commission_history.length - 1];
          setLastPeriodEnd(last.period_end);
        }
      } catch (err: any) {
        setError(extractErrorMessages(err));
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [userId, baseUrl, apiFetch]);

  // Handle opening the payload input modal
  const handlePayClick = () => {
    setPayError("");
    setModalOpen(true);
  };

  // Handle the "Payer la commission" button in the payload modal
  const handlePayCommissionClick = () => {
    setModalOpen(false);
    setConfirmModalOpen(true);
  };

  // Handle the final confirmation and API call
  const handleConfirmPay = async () => {
    setConfirmModalOpen(false);
    setPayLoading(true);
    setPayError("");
    try {
      const now = new Date().toISOString();
      const payload = {
        amount: parseFloat(amount),
        period_start: lastPeriodEnd || stats?.period_info?.start || now,
        period_end: now,
        // period_start: null,
        // period_end: null,
        admin_notes: adminNote,
      };
      const endpoint = `payments/admin/users/${userId}/pay-commission/`;
      await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
      setAmount("");
      setAdminNote("");
      // Optionally, refetch stats
      window.location.reload();
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err);
      setPayError(errorMessage);
      // Reopen the payload modal to show the error
      setModalOpen(true);
    } finally {
      setPayLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-whiten dark:bg-boxdark-2">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-3 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-center py-6 sm:py-10">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-body dark:text-bodydark">Chargement des statistiques de commission...</span>
            </div>
          </div>
        </div>
      </div>
    )
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
                  Statistiques de commission
                </h1>
                <p className="text-body dark:text-bodydark mt-2 text-lg">
                  Voir et gérer les données de commission des partenaires
                </p>
              </div>
            </div>
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-gradient-to-r from-meta-3 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  onClick={handlePayClick}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Payer la commission
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-meta-3" />
                    <span>Payer la commission</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {payError && (
                    <div className="flex items-center space-x-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">{payError}</span>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="amount">Montant</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Montant (ex: 25000.00)"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                    />
                  </div>
                  <div>
                    <Label htmlFor="adminNote">Notes d'administrateur</Label>
                    <Textarea
                      id="adminNote"
                      placeholder="Notes optionnelles sur ce paiement"
                      value={adminNote}
                      onChange={e => setAdminNote(e.target.value)}
                      className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setModalOpen(false)}>
                    Annuler
                  </Button>
                  <Button
                    onClick={handlePayCommissionClick}
                    disabled={!amount}
                    className="bg-gradient-to-r from-meta-3 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Payer la commission
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {error && (
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <ErrorDisplay error={error} />
            </CardContent>
          </Card>
        )}

        {stats && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:p-4 md:p-6">
              <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="p-3 bg-meta-2 dark:bg-orange-900 rounded-lg">
                      <DollarSign className="h-6 w-6 text-primary dark:text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-body dark:text-bodydark2">Commissions totales</p>
                      <p className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
                        XOF {parseFloat(stats.total_commissions || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-meta-3 dark:text-green-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-body dark:text-bodydark2">Commissions en attente</p>
                      <p className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
                        XOF {parseFloat(stats.pending_commissions || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="p-3 bg-meta-2 dark:bg-orange-900 rounded-lg">
                      <Users className="h-6 w-6 text-primary dark:text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-body dark:text-bodydark2">Transactions totales</p>
                      <p className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
                        {stats.total_transactions || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Period Information */}
            <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <CardHeader className="border-b border-gray-100 dark:border-strokedark">
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-meta-2 dark:bg-orange-900 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary dark:text-secondary" />
                  </div>
                  <span>Informations sur la période</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:p-4 md:p-6">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Calendar className="h-5 w-5 text-bodydark2" />
                    <div>
                      <p className="text-sm font-medium text-body dark:text-bodydark2">Début de période</p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {stats.period_info?.start ? new Date(stats.period_info.start).toLocaleString() : 'Non défini'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Calendar className="h-5 w-5 text-bodydark2" />
                    <div>
                      <p className="text-sm font-medium text-body dark:text-bodydark2">Fin de période</p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {stats.period_info?.end ? new Date(stats.period_info.end).toLocaleString() : 'Non défini'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Commission History */}
            <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <CardHeader className="border-b border-gray-100 dark:border-strokedark">
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-meta-3 dark:text-green-300" />
                  </div>
                  <span>Historique des commissions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                {stats.commission_history && stats.commission_history.length > 0 ? (
                  <div className="space-y-4">
                    {stats.commission_history.map((commission: any, index: number) => (
                      <div key={index} className="flex flex-wrap items-start justify-between gap-3 sm:items-center p-4 bg-gray-50 dark:bg-meta-4 rounded-lg">
                        <div className="flex items-center gap-2 sm:gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-meta-3 to-emerald-600 rounded-full flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              XOF {parseFloat(commission.amount || 0).toFixed(2)}
                            </p>
                            <p className="text-sm text-body dark:text-bodydark2">
                              {commission.period_start && commission.period_end ?
                                `${new Date(commission.period_start).toLocaleString()} - ${new Date(commission.period_end).toLocaleString()}` :
                                'Période non spécifiée'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={
                              commission.status === 'completed'
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                : commission.status === 'pending'
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                            }
                          >
                            <div className="flex items-center space-x-1">
                              {commission.status === 'completed' ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : commission.status === 'pending' ? (
                                <AlertTriangle className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              <span className="capitalize">{commission.status || 'Inconnu'}</span>
                            </div>
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 sm:py-6">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-meta-4 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-8 w-8 text-bodydark2" />
                    </div>
                    <h3 className="text-sm font-medium sm:text-base text-gray-900 dark:text-gray-100 mb-2">Aucun historique de commission</h3>
                    <p className="text-body dark:text-bodydark2">Aucun paiement de commission n'a encore été effectué.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Confirmation Modal */}
        <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <span>Confirmer le paiement</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {payError && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">{payError}</span>
                </div>
              )}
              <p className="text-body dark:text-bodydark2">
                Êtes-vous sûr de vouloir payer une commission de <span className="font-semibold">XOF {amount || '0.00'}</span> ?
              </p>
              <p className="text-sm text-body dark:text-bodydark2">
                Cette action ne peut pas être annulée et sera enregistrée dans l'historique des commissions.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleConfirmPay}
                disabled={payLoading}
                className="bg-gradient-to-r from-meta-3 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                {payLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Continuer
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}