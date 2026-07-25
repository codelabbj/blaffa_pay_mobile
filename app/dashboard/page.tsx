"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { ChartContainer } from "@/components/ui/chart"
import { useApi } from "@/lib/useApi"
import { useAggregatorApi, AggregatorDashboardStats } from "@/lib/aggregator-api"
import { StatCard as AggregatorStatCard } from "@/components/aggregator/stat-card"
import { useLanguage } from "@/components/providers/language-provider"
import { useRouter } from "next/navigation"
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area } from "recharts";
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ClipboardList,
  Users,
  KeyRound,
  Bell,
  Clock,
  TrendingUp,
  Loader,
  ServerCrash,
  DollarSign,
  RefreshCw,
  UserCheck,
  Activity,
  Zap,
  Shield,
  Globe,
  Smartphone,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Calendar,
  BarChart3,
  CreditCard,
  Settings,
  Waves,
  Phone,
  Wallet,
  Layers
} from "lucide-react";
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { getAppName, apiUrl } from "@/lib/env-config"

const appName = getAppName()

// Colors for charts and UI elements - using logo colors
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

const CHART_COLORS = ['#194185', '#10B981', '#1E3A8A', '#EF4444', '#8B5CF6', '#EC4899'];

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [authError, setAuthError] = useState("")
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showOnlyActiveUsers, setShowOnlyActiveUsers] = useState(false)
  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [transactionStats, setTransactionStats] = useState<any>(null);
  const [transactionStatsLoading, setTransactionStatsLoading] = useState(false);
  const [transactionStatsError, setTransactionStatsError] = useState("");
  const [systemEvents, setSystemEvents] = useState<any[]>([]);
  const [systemEventsLoading, setSystemEventsLoading] = useState(false);
  const [systemEventsError, setSystemEventsError] = useState("");
  const [balanceOps, setBalanceOps] = useState<any>(null);
  const [balanceOpsLoading, setBalanceOpsLoading] = useState(false);
  const [balanceOpsError, setBalanceOpsError] = useState("");
  const [rechargeStats, setRechargeStats] = useState<any>(null);
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [rechargeError, setRechargeError] = useState("");
  const [momoPayStats, setMomoPayStats] = useState<any>(null);
  const [momoPayLoading, setMomoPayLoading] = useState(false);
  const [momoPayError, setMomoPayError] = useState("");
  const [waveStats, setWaveStats] = useState<any>(null);
  const [waveLoading, setWaveLoading] = useState(false);
  const [waveError, setWaveError] = useState("");
  const [aggregatorStats, setAggregatorStats] = useState<AggregatorDashboardStats | null>(null);
  const [aggregatorLoading, setAggregatorLoading] = useState(false);
  const [aggregatorError, setAggregatorError] = useState("");

  const apiFetch = useApi();
  const { getDashboardStats } = useAggregatorApi();
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    setAuthError("");
    setShowAuthModal(false);
    try {
      const data = await apiFetch(`auth/admin/notifications/stats/`);
      setStats(data);
    } catch (err: any) {
      let backendError = extractErrorMessages(err) || "Échec du chargement des statistiques";
      if (
        err?.code === 'token_not_valid' ||
        err?.status === 401 ||
        (typeof backendError === 'string' && backendError.toLowerCase().includes('token'))
      ) {
        setAuthError(backendError);
        setShowAuthModal(true);
        setLoading(false);
        return;
      }
      setError(backendError);
      toast({
        title: "Échec du chargement des statistiques",
        description: backendError,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      // Fetch summary data
      setSummaryLoading(true);
      try {
        const res = await apiFetch(`payments/dashboard/summary/`);
        setSummary(res);
      } catch (err: any) {
        setSummaryError("Échec du chargement du résumé des paiements");
      } finally {
        setSummaryLoading(false);
      }

      // Fetch transaction stats
      setTransactionStatsLoading(true);
      try {
        const res = await apiFetch(`payments/stats/transactions/`);
        setTransactionStats(res);
      } catch (err: any) {
        setTransactionStatsError("Échec du chargement des statistiques de transactions");
      } finally {
        setTransactionStatsLoading(false);
      }

      // Fetch system events
      setSystemEventsLoading(true);
      try {
        const res = await apiFetch(`payments/system-events/`);
        setSystemEvents(res.results || []);
      } catch (err: any) {
        setSystemEventsError("Échec du chargement des événements système");
      } finally {
        setSystemEventsLoading(false);
      }

      // Fetch balance operations stats
      setBalanceOpsLoading(true);
      try {
        const res = await apiFetch(`payments/admin/balance-operations/stats/`);
        setBalanceOps(res);
      } catch (err: any) {
        setBalanceOpsError("Échec du chargement des statistiques d'opérations de solde");
      } finally {
        setBalanceOpsLoading(false);
      }

      // Fetch recharge requests stats
      setRechargeLoading(true);
      try {
        const res = await apiFetch(`payments/user/recharge_requests/stats/`);
        setRechargeStats(res);
      } catch (err: any) {
        setRechargeError("Échec du chargement des statistiques de recharge");
      } finally {
        setRechargeLoading(false);
      }

      // Fetch MoMo Pay stats
      setMomoPayLoading(true);
      try {
        const res = await apiFetch(`payments/momo-pay-transactions/stats/`);
        setMomoPayStats(res);
      } catch (err: any) {
        setMomoPayError("Échec du chargement des statistiques MoMo Pay");
      } finally {
        setMomoPayLoading(false);
      }

      // Fetch Wave Business stats
      setWaveLoading(true);
      try {
        const res = await apiFetch(`payments/wave-business-transactions/stats/`);
        setWaveStats(res);
      } catch (err: any) {
        setWaveError("Échec du chargement des statistiques Wave Business");
      } finally {
        setWaveLoading(false);
      }

      // Fetch Aggregator stats
      setAggregatorLoading(true);
      try {
        const data = await getDashboardStats();
        setAggregatorStats(data);
      } catch (err: any) {
        setAggregatorError("Échec du chargement des statistiques d'agrégateur");
      } finally {
        setAggregatorLoading(false);
      }
    };

    fetchAllData();
  }, [apiFetch]);

  useEffect(() => {
    fetchStats();
  }, [apiFetch]);

  // Prepare chart data
  const prepareFinancialChartData = () => {
    if (!summary || !transactionStats || !balanceOps) return [];
    return [
      { name: "Revenus d'aujourd'hui", value: parseFloat(summary.today_revenue) || 0, color: COLORS.primary },
      { name: "Ajustements totaux", value: parseFloat(balanceOps?.adjustments?.total_credits?.total) || 0, color: COLORS.success },
      { name: "Remboursements totaux", value: parseFloat(balanceOps?.refunds?.total_amount) || 0, color: COLORS.danger }
    ];
  };

  const prepareAdminActivityData = () => {
    if (!balanceOps) return [];
    const adjustmentAdmins = balanceOps.adjustments?.by_admin || [];
    const refundAdmins = balanceOps.refunds?.by_admin || [];
    const adminMap = new Map();

    adjustmentAdmins.forEach((admin: any) => {
      const email = admin.created_by__email;
      if (!adminMap.has(email)) {
        adminMap.set(email, { email, adjustments: 0, refunds: 0, total: 0 });
      }
      const current = adminMap.get(email);
      current.adjustments = parseFloat(admin.total_amount) || 0;
      current.total += current.adjustments;
    });

    refundAdmins.forEach((admin: any) => {
      const email = admin.created_by__email;
      if (!adminMap.has(email)) {
        adminMap.set(email, { email, adjustments: 0, refunds: 0, total: 0 });
      }
      const current = adminMap.get(email);
      current.refunds = parseFloat(admin.total_amount) || 0;
      current.total += current.refunds;
    });

    return Array.from(adminMap.values());
  };

  const prepareTransactionTrendData = () => {
    if (!transactionStats) return [];
    return [
      { name: "Terminées", value: transactionStats.completed_transactions || 0, color: COLORS.success },
      { name: "En attente", value: transactionStats.pending_transactions || 0, color: COLORS.warning },
      { name: "Échouées", value: transactionStats.failed_transactions || 0, color: COLORS.danger },
      { name: "En cours", value: transactionStats.processing_transactions || 0, color: COLORS.info }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="animate-spin h-8 w-8 text-primary" />
          <span className="text-lg font-semibold"><span>Chargement...</span></span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={fetchStats}
        variant="full"
        showDismiss={false}
      />
    );
  }

  if (!stats) {
    return null;
  }

  const financialChartData = prepareFinancialChartData();
  const adminActivityData = prepareAdminActivityData();
  const transactionTrendData = prepareTransactionTrendData();

  return (
    <>
      {/* Auth Error Modal */}
      <Dialog open={showAuthModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erreur d'authentification</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center text-red-600">{authError}</div>
          <DialogFooter>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full"
              onClick={() => { setShowAuthModal(false); router.push("/"); }}
            >
              OK
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Dashboard Content */}
      <div className="min-h-screen bg-whiten dark:bg-boxdark-2">
        <div className="w-full">

          {/* Dashboard Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-base font-bold sm:text-lg sm:text-2xl bg-gradient-to-r from-primary to-meta-3 bg-clip-text text-transparent">
                  <span>{appName}</span>
                </h1>
                <p className="text-body dark:text-bodydark mt-2 text-sm sm:text-base lg:text-lg">
                  <span>Tableau de bord administrateur</span>
                </p>
              </div>
              <div className="flex items-center space-x-2 sm:gap-2 sm:gap-4">
                <div className="flex items-center space-x-2 bg-white dark:bg-boxdark rounded-lg px-3 sm:px-4 py-2 shadow-sm">
                  <Switch
                    id="active-users-toggle"
                    checked={showOnlyActiveUsers}
                    onCheckedChange={setShowOnlyActiveUsers}
                  />
                  <label htmlFor="active-users-toggle" className="text-xs sm:text-sm font-medium">
                    <span className="hidden sm:inline">Afficher uniquement les utilisateurs actifs</span>
                    <span className="sm:hidden">Utilisateurs actifs</span>
                  </label>
                </div>
                {/* <div className="bg-white dark:bg-boxdark rounded-lg px-4 py-2 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-body" />
                      <span className="text-sm text-body dark:text-bodydark">
                        {new Date().toLocaleTimeString()}
                      </span>
                      </div>
                  </div> */}
              </div>
            </div>
          </div>

          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 sm:gap-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
            {/* Total Users */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-primary to-primary text-white border-0 shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
              <CardContent className="p-4 sm:p-3 sm:p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
                  <div>
                    <p className="text-blue-100 text-xs sm:text-sm font-medium"><span>Utilisateurs totaux</span></p>
                    <p className="text-2xl sm:text-lg font-bold sm:text-xl"><span>{stats.user_stats.total_users}</span></p>
                    <div className="flex items-center mt-1 sm:mt-2">
                      <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-green-300" />
                      <span className="text-xs sm:text-sm text-blue-100 ml-1"><span>{`+${stats.user_stats.users_registered_today}`}</span> <span>aujourd'hui</span></span>
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full p-2 sm:p-3">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Tasks */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-meta-3 to-meta-3 text-white border-0 shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
              <CardContent className="p-4 sm:p-3 sm:p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
                  <div>
                    <p className="text-green-100 text-xs sm:text-sm font-medium"><span>Tâches actives</span></p>
                    <p className="text-2xl sm:text-lg font-bold sm:text-xl"><span>{stats.task_stats.active}</span></p>
                    <div className="flex items-center mt-1 sm:mt-2">
                      <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-green-300" />
                      <span className="text-xs sm:text-sm text-green-100 ml-1"><span>En cours</span></span>
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full p-2 sm:p-3">
                    <ClipboardList className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Today's Revenue */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-meta-3 to-meta-3 text-white border-0 shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
              <CardContent className="p-4 sm:p-3 sm:p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
                  <div>
                    <p className="text-purple-100 text-xs sm:text-sm font-medium"><span>Revenus d'aujourd'hui</span></p>
                    <p className="text-xl sm:text-2xl lg:text-lg font-bold sm:text-xl">
                      <span>{summary ? `${parseFloat(summary.today_revenue || 0).toFixed(2)}` : '0.00'}</span> <span>FCFA</span>
                    </p>
                    <div className="flex items-center mt-1 sm:mt-2">
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-purple-300" />
                      <span className="text-xs sm:text-sm text-purple-100 ml-1">
                        <span>{summary ? `${summary.today_success_rate?.toFixed(1)}%` : '0%'}</span> <span>taux de réussite</span>
                      </span>
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full p-2 sm:p-3">
                    <DollarSign className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-primary to-primary text-white border-0 shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
              <CardContent className="p-4 sm:p-3 sm:p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
                  <div>
                    <p className="text-orange-100 text-xs sm:text-sm font-medium"><span>Statut du système</span></p>
                    <p className="text-xl sm:text-2xl lg:text-lg font-bold sm:text-xl">
                      <span>{stats.notification_info.async_enabled ? 'En ligne' : 'Hors ligne'}</span>
                    </p>
                    <div className="flex items-center mt-1 sm:mt-2">
                      {stats.notification_info.async_enabled ? (
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-300" />
                      ) : (
                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-300" />
                      )}
                      <span className="text-xs sm:text-sm text-orange-100 ml-1">
                        <span>{stats.notification_info.async_enabled ? 'Tous les systèmes' : 'Problèmes détectés'}</span>
                      </span>
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full p-2 sm:p-3">
                    <Shield className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-3 sm:p-4 md:p-6 lg:gap-3 sm:p-5 md:p-8 mb-4 sm:mb-6">
            {/* Financial Overview Chart */}
            {financialChartData.length > 0 && (
              <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <CardHeader className="border-b border-gray-100 dark:border-strokedark">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="p-2 bg-meta-2 dark:bg-orange-900 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-primary dark:text-secondary" />
                    </div>
                    <span><span>Aperçu financier</span></span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-3 sm:p-4 md:p-6">
                  <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={financialChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value.toFixed(2)} FCFA`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {financialChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} FCFA`, 'Montant']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transaction Trends */}
            {transactionTrendData.length > 0 && (
              <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <CardHeader className="border-b border-gray-100 dark:border-strokedark">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-meta-3 dark:text-green-300" />
                    </div>
                    <span><span>Tendances des transactions</span></span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-3 sm:p-4 md:p-6">
                  <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={transactionTrendData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Detailed Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
            {/* User Statistics */}
            <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark hover:shadow-xl transition-shadow">
              <CardHeader className="border-b border-gray-100 dark:border-strokedark">
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-meta-2 dark:bg-orange-900 rounded-lg">
                    <Users className="h-5 w-5 text-primary dark:text-secondary" />
                  </div>
                  <span><span>Statistiques des utilisateurs</span></span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-sm font-medium">Utilisateurs totaux</span>
                    <Badge className="bg-blue-600 text-white">{stats.user_stats.total_users}</Badge>
                  </div>
                  <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-sm font-medium">Utilisateurs actifs</span>
                    <Badge className="bg-meta-3 text-white">{stats.user_stats.active_users}</Badge>
                  </div>
                  <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <span className="text-sm font-medium">Utilisateurs en attente</span>
                    <Badge className="bg-yellow-600 text-white">{stats.user_stats.pending_users}</Badge>
                  </div>
                  <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <span className="text-sm font-medium">Utilisateurs vérifiés</span>
                    <Badge className="bg-purple-600 text-white">{stats.user_stats.verified_users}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Task Statistics */}
            <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark hover:shadow-xl transition-shadow">
              <CardHeader className="border-b border-gray-100 dark:border-strokedark">
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <ClipboardList className="h-5 w-5 text-meta-3 dark:text-green-300" />
                  </div>
                  <span><span>Statistiques des tâches</span></span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-sm font-medium">Tâches actives</span>
                    <Badge className="bg-meta-3 text-white">{stats.task_stats.active}</Badge>
                  </div>
                  <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-sm font-medium">Tâches programmées</span>
                    <Badge className="bg-blue-600 text-white">{stats.task_stats.scheduled}</Badge>
                  </div>
                  <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center p-3 bg-gray dark:bg-orange-900/20 rounded-lg">
                    <span className="text-sm font-medium">Tâches réservées</span>
                    <Badge className="bg-primary text-white">{stats.task_stats.reserved}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Information */}
            <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark hover:shadow-xl transition-shadow">
              <CardHeader className="border-b border-gray-100 dark:border-strokedark">
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Settings className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                  </div>
                  <span><span>Informations système</span></span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center p-3 bg-gray-50 dark:bg-boxdark-2/20 rounded-lg">
                    <span className="text-sm font-medium">Service email</span>
                    <Badge variant="outline">{stats.notification_info.email_service}</Badge>
                  </div>
                  <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center p-3 bg-gray-50 dark:bg-boxdark-2/20 rounded-lg">
                    <span className="text-sm font-medium">Service SMS</span>
                    <Badge variant="outline">{stats.notification_info.sms_service}</Badge>
                  </div>
                  <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center p-3 bg-gray-50 dark:bg-boxdark-2/20 rounded-lg">
                    <span className="text-sm font-medium">Asynchrone activé</span>
                    <Badge className={stats.notification_info.async_enabled ? "bg-meta-3 text-white" : "bg-red-600 text-white"}>
                      {stats.notification_info.async_enabled ? 'Oui' : 'Non'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center p-3 bg-gray-50 dark:bg-boxdark-2/20 rounded-lg">
                    <span className="text-sm font-medium">Journalisation activée</span>
                    <Badge className={stats.notification_info.logging_enabled ? "bg-meta-3 text-white" : "bg-red-600 text-white"}>
                      {stats.notification_info.logging_enabled ? 'Oui' : 'Non'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment & Transaction Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-3 sm:p-4 md:p-6 lg:gap-3 sm:p-5 md:p-8 mb-4 sm:mb-6">
            {/* Payment Summary */}
            <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <CardHeader className="border-b border-gray-100 dark:border-strokedark">
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                    <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                  </div>
                  <span><span>Résumé des paiements</span></span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-3 sm:p-4 md:p-6">
                {summaryLoading ? (
                  <div className="flex items-center justify-center py-4 sm:py-6">
                    <Loader className="animate-spin mr-2" /> Chargement...
                  </div>
                ) : summaryError ? (
                  <div className="text-red-600 text-center py-4">{summaryError}</div>
                ) : summary ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 sm:p-4 rounded-lg">
                      <div className="text-xs sm:text-sm text-primary dark:text-secondary font-medium">Transactions d'aujourd'hui</div>
                      <div className="text-xl sm:text-lg font-bold sm:text-xl text-orange-900 dark:text-orange-100"><span>{summary.today_transactions}</span></div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 sm:p-4 rounded-lg">
                      <div className="text-xs sm:text-sm text-meta-3 dark:text-green-300 font-medium">Terminées</div>
                      <div className="text-xl sm:text-lg font-bold sm:text-xl text-green-900 dark:text-green-100"><span>{summary.today_completed}</span></div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-3 sm:p-4 rounded-lg">
                      <div className="text-xs sm:text-sm text-purple-600 dark:text-purple-300 font-medium">Revenus</div>
                      <div className="text-xl sm:text-lg font-bold sm:text-xl text-purple-900 dark:text-purple-100"><span>{parseFloat(summary.today_revenue || 0).toFixed(2)}</span> <span>FCFA</span></div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-3 sm:p-4 rounded-lg">
                      <div className="text-xs sm:text-sm text-primary dark:text-secondary font-medium">Taux de réussite</div>
                      <div className="text-xl sm:text-lg font-bold sm:text-xl text-orange-900 dark:text-orange-100"><span>{summary.today_success_rate?.toFixed(1)}%</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-body text-center py-4 sm:py-6">Aucune donnée disponible</div>
                )}
              </CardContent>
            </Card>

            {/* System Events */}
            <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <CardHeader className="border-b border-gray-100 dark:border-strokedark">
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                  </div>
                  <span><span>Événements système récents</span></span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                {systemEventsLoading ? (
                  <div className="flex items-center justify-center py-4 sm:py-6">
                    <Loader className="animate-spin mr-2" /> Chargement...
                  </div>
                ) : systemEventsError ? (
                  <div className="text-red-600 text-center py-4">{systemEventsError}</div>
                ) : systemEvents && systemEvents.length > 0 ? (
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {systemEvents.slice(0, 5).map((event, idx) => (
                      <div key={event.uid} className="p-4 bg-gray-50 dark:bg-boxdark-2/50 rounded-lg">
                        <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center mb-2">
                          <span className="font-semibold text-sm">{event.event_type.replace(/_/g, " ").toUpperCase()}</span>
                          <Badge variant="outline" className="text-xs">{event.level}</Badge>
                        </div>
                        <div className="text-sm text-body dark:text-bodydark mb-2">{event.description}</div>
                        <div className="text-xs text-body dark:text-bodydark2">
                          {new Date(event.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-body text-center py-4 sm:py-6">Aucun événement récent</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats Cards */}
          {rechargeStats && (
            <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4 sm:mb-6">
              <CardHeader className="border-b border-gray-100 dark:border-strokedark">
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-sky-100 dark:bg-sky-900 rounded-lg">
                    <RefreshCw className="h-5 w-5 text-sky-600 dark:text-sky-300" />
                  </div>
                  <span><span>Aperçu des demandes de recharge</span></span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:p-4 md:p-6">
                  <div className="text-center p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg">
                    <div className="text-lg font-bold sm:text-xl text-sky-600 dark:text-sky-300"><span>{rechargeStats.total_requests}</span></div>
                    <div className="text-sm text-body dark:text-bodydark">Demandes totales</div>
                  </div>
                  <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <div className="text-lg font-bold sm:text-xl text-amber-600 dark:text-amber-300"><span>{rechargeStats.pending_review}</span></div>
                    <div className="text-sm text-body dark:text-bodydark">En attente de révision</div>
                  </div>
                  <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <div className="text-lg font-bold sm:text-xl text-emerald-600 dark:text-emerald-300"><span>{parseFloat(rechargeStats.total_approved_amount || 0).toFixed(2)}</span> <span>FCFA</span></div>
                    <div className="text-sm text-body dark:text-bodydark">Montant approuvé</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Balance Operations */}
          {balanceOps && (
            <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4 sm:mb-6">
              <CardHeader className="border-b border-gray-100 dark:border-strokedark">
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                    <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                  </div>
                  <span><span>Opérations de solde</span></span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                  <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <div className="text-lg font-bold sm:text-xl text-emerald-600 dark:text-emerald-300"><span>{balanceOps.adjustments.total_count}</span></div>
                    <div className="text-sm text-body dark:text-bodydark">Ajustements totaux</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-lg font-bold sm:text-xl text-primary dark:text-secondary"><span>{balanceOps.adjustments.total_credits.count}</span></div>
                    <div className="text-sm text-body dark:text-bodydark">Crédits</div>
                  </div>
                  <div className="text-center p-4 bg-gray dark:bg-orange-900/20 rounded-lg">
                    <div className="text-lg font-bold sm:text-xl text-primary dark:text-secondary"><span>{balanceOps.adjustments.total_debits.count}</span></div>
                    <div className="text-sm text-body dark:text-bodydark">Débits</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-lg font-bold sm:text-xl text-red-600 dark:text-red-300"><span>{balanceOps.refunds.total_count}</span></div>
                    <div className="text-sm text-body dark:text-bodydark">Remboursements</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Methods Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:p-5 md:p-8 mb-4 sm:mb-6">
            {/* MoMo Pay Statistics */}
            <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <CardHeader className="border-b border-gray-100 dark:border-strokedark">
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Smartphone className="h-5 w-5 text-meta-3 dark:text-green-300" />
                  </div>
                  <span><span>Statistiques MoMo Pay</span></span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                {momoPayLoading ? (
                  <div className="flex items-center justify-center py-4 sm:py-6">
                    <Loader className="animate-spin mr-2" /> Chargement...
                  </div>
                ) : momoPayError ? (
                  <div className="text-red-600 text-center py-4">{momoPayError}</div>
                ) : momoPayStats ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg">
                        <div className="text-sm text-meta-3 dark:text-green-300 font-medium">Total Transactions</div>
                        <div className="text-lg font-bold sm:text-xl text-green-900 dark:text-green-100"><span>{momoPayStats.total_transactions || 0}</span></div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg">
                        <div className="text-sm text-primary dark:text-secondary font-medium">Montant Total</div>
                        <div className="text-lg font-bold sm:text-xl text-orange-900 dark:text-orange-100"><span>{parseFloat((momoPayStats.total_amount || 0).toString()).toFixed(2)}</span> <span>FCFA</span></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-4 rounded-lg">
                        <div className="text-sm text-emerald-600 dark:text-emerald-300 font-medium">Confirmées</div>
                        <div className="text-lg font-bold sm:text-xl text-emerald-900 dark:text-green-100"><span>{momoPayStats.confirmed_count || 0}</span></div>
                      </div>
                      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-4 rounded-lg">
                        <div className="text-sm text-yellow-600 dark:text-yellow-300 font-medium">En Attente</div>
                        <div className="text-lg font-bold sm:text-xl text-yellow-900 dark:text-yellow-100"><span>{momoPayStats.pending_count || 0}</span></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-lg">
                        <div className="text-sm text-red-600 dark:text-red-300 font-medium">Annulées</div>
                        <div className="text-lg font-bold sm:text-xl text-red-900 dark:text-red-100"><span>{momoPayStats.cancelled_count || 0}</span></div>
                      </div>
                      <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-lg">
                        <div className="text-sm text-primary dark:text-secondary font-medium">Échouées</div>
                        <div className="text-lg font-bold sm:text-xl text-orange-900 dark:text-orange-100"><span>{momoPayStats.failed_count || 0}</span></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-body text-center py-4 sm:py-6">Aucune donnée disponible</div>
                )}
              </CardContent>
            </Card>

            {/* Wave Business Statistics */}
            <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <CardHeader className="border-b border-gray-100 dark:border-strokedark">
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-meta-2 dark:bg-orange-900 rounded-lg">
                    <Waves className="h-5 w-5 text-primary dark:text-secondary" />
                  </div>
                  <span><span>Statistiques Wave Business</span></span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                {waveLoading ? (
                  <div className="flex items-center justify-center py-4 sm:py-6">
                    <Loader className="animate-spin mr-2" /> Chargement...
                  </div>
                ) : waveError ? (
                  <div className="text-red-600 text-center py-4">{waveError}</div>
                ) : waveStats ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg">
                        <div className="text-sm text-primary dark:text-secondary font-medium">Total Transactions</div>
                        <div className="text-lg font-bold sm:text-xl text-orange-900 dark:text-orange-100"><span>{waveStats.total_transactions || 0}</span></div>
                      </div>
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg">
                        <div className="text-sm text-purple-600 dark:text-purple-300 font-medium">Montant Total</div>
                        <div className="text-lg font-bold sm:text-xl text-purple-900 dark:text-purple-100"><span>{parseFloat((waveStats.total_amount || 0).toString()).toFixed(2)}</span> <span>FCFA</span></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-4 rounded-lg">
                        <div className="text-sm text-emerald-600 dark:text-emerald-300 font-medium">Confirmées</div>
                        <div className="text-lg font-bold sm:text-xl text-emerald-900 dark:text-emerald-100"><span>{waveStats.confirmed_count || 0}</span></div>
                      </div>
                      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-4 rounded-lg">
                        <div className="text-sm text-yellow-600 dark:text-yellow-300 font-medium">En Attente</div>
                        <div className="text-lg font-bold sm:text-xl text-yellow-900 dark:text-yellow-100"><span>{waveStats.pending_count || 0}</span></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-lg">
                        <div className="text-sm text-red-600 dark:text-red-300 font-medium">Annulées</div>
                        <div className="text-lg font-bold sm:text-xl text-red-900 dark:text-red-100"><span>{waveStats.cancelled_count || 0}</span></div>
                      </div>
                      <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-lg">
                        <div className="text-sm text-primary dark:text-secondary font-medium">Expirées</div>
                        <div className="text-lg font-bold sm:text-xl text-orange-900 dark:text-orange-100"><span>{waveStats.expired_count || 0}</span></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-body text-center py-4 sm:py-6">Aucune donnée disponible</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Aggregator Overview Section */}
          <div className="mt-12 mb-4 sm:mb-6" id="aggregator-overview">
            <h2 className="text-xl sm:text-lg font-bold sm:text-xl text-gray-800 dark:text-gray-100 mb-6 flex items-center space-x-2">
              <div className="p-2 bg-meta-2 dark:bg-orange-900 rounded-lg">
                <Layers className="h-5 w-5 text-primary dark:text-secondary" />
              </div>
              <span>{t("dashboard.aggregatorOverview")}</span>
            </h2>

            {aggregatorLoading ? (
              <div className="flex items-center justify-center py-6 sm:py-10">
                <Loader className="animate-spin h-8 w-8 text-primary mr-3" />
                <span className="text-sm font-medium sm:text-base text-body">{t("dashboard.loadingAggregatorData")}</span>
              </div>
            ) : aggregatorError ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 sm:p-4 md:p-6 rounded-xl text-center">
                <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
                <p className="text-red-700 dark:text-red-400 font-medium">{aggregatorError}</p>
              </div>
            ) : aggregatorStats ? (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
                {/* Aggregator Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:p-4 md:p-6">
                  <AggregatorStatCard
                    title={t("nav.aggregatorUsers")}
                    value={aggregatorStats.users?.total_aggregators || 0}
                    icon={Users}
                    className="bg-gradient-to-br from-primary to-primary text-white"
                    description={<span>{`${aggregatorStats.users?.active_aggregators || 0} actifs aujourd'hui`}</span>}
                  />
                  <AggregatorStatCard
                    title="Volume Payin"
                    value={`${(aggregatorStats.payin?.total_amount || 0).toLocaleString()} FCFA`}
                    icon={TrendingUp}
                    className="bg-gradient-to-br from-meta-3 to-meta-3 text-white"
                    description={<span>{`${aggregatorStats.payin?.success_count || 0} transactions (${aggregatorStats.payin?.total_platform_profit || 0} profit)`}</span>}
                  />
                  <AggregatorStatCard
                    title={t("dashboard.successRate")}
                    value={`${(aggregatorStats.transactions?.success_rate || 0).toFixed(1)}%`}
                    icon={Activity}
                    className="bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                    description={<span>{`${aggregatorStats.transactions?.success_count || 0} réussies sur ${aggregatorStats.transactions?.total_count || 0}`}</span>}
                  />
                  <AggregatorStatCard
                    title="Volume 7 jours"
                    value={`${(aggregatorStats.last_7_days?.total_amount || 0).toLocaleString()} FCFA`}
                    icon={Zap}
                    className="bg-gradient-to-br from-purple-500 to-purple-600 text-white"
                    description={<span>{`${aggregatorStats.last_7_days?.success_count || 0} transactions réussies`}</span>}
                  />
                </div>

                {/* Today's Specific Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:p-4 md:p-6">
                  <Card className="border-0 shadow-lg bg-gray/50 dark:bg-orange-900/10">
                    <CardContent className="p-4 flex flex-wrap items-start justify-between gap-3 sm:items-center">
                      <div>
                        <p className="text-xs font-semibold text-primary uppercase tracking-wider">Trx Aujourd'hui</p>
                        <p className="text-lg font-bold sm:text-xl"><span>{aggregatorStats.today?.total_count || 0}</span></p>
                      </div>
                      <div className="bg-meta-2 dark:bg-orange-900/40 p-2 rounded-full text-primary">
                        <Activity className="h-5 w-5" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg bg-green-50/50 dark:bg-green-900/10">
                    <CardContent className="p-4 flex flex-wrap items-start justify-between gap-3 sm:items-center">
                      <div>
                        <p className="text-xs font-semibold text-meta-3 uppercase tracking-wider">Volume Aujourd'hui</p>
                        <p className="text-lg font-bold sm:text-xl"><span>{(aggregatorStats.today?.total_amount || 0).toLocaleString()}</span> <span>FCFA</span></p>
                      </div>
                      <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded-full text-meta-3">
                        <DollarSign className="h-5 w-5" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg bg-blue-50/50 dark:bg-blue-900/10">
                    <CardContent className="p-4 flex flex-wrap items-start justify-between gap-3 sm:items-center">
                      <div>
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Profit Aujourd'hui</p>
                        <p className="text-lg font-bold sm:text-xl"><span>{(aggregatorStats.today?.total_platform_profit || 0).toLocaleString()}</span> <span>FCFA</span></p>
                      </div>
                      <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full text-blue-600">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:p-4 md:p-6">
                  {/* Top Aggregators */}
                  <Card className="border-0 shadow-lg bg-white dark:bg-boxdark transition-all duration-300 hover:shadow-xl overflow-hidden">
                    <CardHeader className="border-b border-gray-100 dark:border-strokedark bg-gray-50/50 dark:bg-boxdark-2/50">
                      <CardTitle className="flex items-center space-x-2 text-lg">
                        <Users className="h-5 w-5 text-indigo-500" />
                        <span><span>Top Agrégateurs</span></span>
                      </CardTitle>
                    </CardHeader>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="text-xs uppercase bg-gray-50 dark:bg-boxdark-2/50 text-body dark:text-bodydark2">
                          <tr>
                            <th className="px-6 py-4 font-semibold tracking-wider"><span>Agrégateur</span></th>
                            <th className="px-6 py-4 font-semibold tracking-wider"><span>Montant</span></th>
                            <th className="px-6 py-4 font-semibold tracking-wider"><span>Transactions</span></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {(aggregatorStats.top_aggregators || []).map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-medium"><span>{item.user__first_name}</span> <span>{item.user__last_name}</span></div>
                                <div className="text-xs text-body"><span>{item.user__email}</span></div>
                              </td>
                              <td className="px-6 py-4 font-mono text-sm">
                                <span>{(item.total_amount || 0).toLocaleString()}</span> <span>FCFA</span>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span>{item.tx_count}</span>
                              </td>
                            </tr>
                          ))}
                          {(aggregatorStats.top_aggregators || []).length === 0 && (
                            <tr>
                              <td colSpan={3} className="px-6 py-4 text-center text-body"><span>Aucun agrégateur</span></td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  {/* Network Performance Table */}
                  <Card className="border-0 shadow-lg bg-white dark:bg-boxdark transition-all duration-300 hover:shadow-xl overflow-hidden">
                    <CardHeader className="border-b border-gray-100 dark:border-strokedark bg-gray-50/50 dark:bg-boxdark-2/50">
                      <CardTitle className="flex items-center space-x-2 text-lg">
                        <Activity className="h-5 w-5 text-primary" />
                        <span><span>Performances par Réseau</span></span>
                      </CardTitle>
                    </CardHeader>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="text-xs uppercase bg-gray-50 dark:bg-boxdark-2/50 text-body dark:text-bodydark2">
                          <tr>
                            <th className="px-6 py-4 font-semibold tracking-wider"><span>{t("dashboard.network")}</span></th>
                            <th className="px-6 py-4 font-semibold tracking-wider"><span>Opérations</span></th>
                            <th className="px-6 py-4 font-semibold tracking-wider text-right"><span>{t("dashboard.volume")}</span></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {(aggregatorStats.network_stats || []).map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                              <td className="px-6 py-4 font-medium"><span>{item.network__nom || 'Inconnu'}</span></td>
                              <td className="px-6 py-4 font-medium text-sm text-body dark:text-bodydark">
                                <span>{item.tx_count || 0}</span> <span>trx</span>
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-sm font-semibold text-meta-3">
                                <span>{(item.total_amount || 0).toLocaleString()}</span> <span>FCFA</span>
                              </td>
                            </tr>
                          ))}
                          {(aggregatorStats.network_stats || []).length === 0 && (
                            <tr>
                              <td colSpan={3} className="px-6 py-4 text-center text-body"><span>Aucun réseau actif</span></td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-body text-center py-6 sm:py-10 bg-white dark:bg-boxdark rounded-xl shadow-sm">
                <span>{t("dashboard.noAggregatorData")}</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}