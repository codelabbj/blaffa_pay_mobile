"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/useApi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display";
import { ArrowLeft, Users, Mail, Phone, Calendar, DollarSign, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export default function PartnerDetailsPage({ params }: { params: { user_id: string } }) {
  const userId = params.user_id;
  const [partner, setPartner] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const apiFetch = useApi();
  const baseUrl = getApiBaseUrl();
  const router = useRouter();

  useEffect(() => {
    const fetchPartner = async () => {
      setLoading(true);
      setError("");
      try {
        const endpoint = `auth/admin/users/partners/${userId}/`;
        const data = await apiFetch(endpoint);
        setPartner(data);
      } catch (err: any) {
        setError(extractErrorMessages(err));
      } finally {
        setLoading(false);
      }
    };
    fetchPartner();
  }, [userId, baseUrl, apiFetch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:bg-boxdark-2">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-3 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-center py-6 sm:py-10">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="text-body dark:text-bodydark">Chargement des détails du partenaire...</span>
            </div>
          </div>
        </div>
      </div>
    )
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
                  Détails du partenaire
                </h1>
                <p className="text-body dark:text-bodydark mt-2 text-lg">
                  Voir les informations détaillées du partenaire
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

        {partner && (
          <div className="space-y-6">
            {/* Partner Overview */}
            <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <CardHeader className="border-b border-gray-100 dark:border-strokedark">
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Users className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                  </div>
                  <span>Aperçu du partenaire</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center gap-2 sm:gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                    {partner.display_name?.charAt(0)?.toUpperCase() || 'P'}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
                      {partner.display_name || `${partner.first_name || ""} ${partner.last_name || ""}`}
                    </h2>
                    <p className="text-body dark:text-bodydark2">UID: {partner.uid}</p>
                  </div>
                  <Badge
                    className={
                      partner.is_active
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                    }
                  >
                    <div className="flex items-center space-x-1">
                      {partner.is_active ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      <span>{partner.is_active ? 'Actif' : 'Inactif'}</span>
                    </div>
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <CardHeader className="border-b border-gray-100 dark:border-strokedark">
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Mail className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <span>Informations de contact</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:p-4 md:p-6">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Mail className="h-5 w-5 text-bodydark2" />
                    <div>
                      <p className="text-sm font-medium text-body dark:text-bodydark2">E-mail</p>
                      <p className="text-gray-900 dark:text-gray-100">{partner.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Phone className="h-5 w-5 text-bodydark2" />
                    <div>
                      <p className="text-sm font-medium text-body dark:text-bodydark2">Téléphone</p>
                      <p className="text-gray-900 dark:text-gray-100">{partner.phone || 'Non fourni'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Calendar className="h-5 w-5 text-bodydark2" />
                    <div>
                      <p className="text-sm font-medium text-body dark:text-bodydark2">Créé</p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {partner.created_at ? new Date(partner.created_at).toLocaleString() : 'Inconnu'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Calendar className="h-5 w-5 text-bodydark2" />
                    <div>
                      <p className="text-sm font-medium text-body dark:text-bodydark2">Dernière connexion</p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {partner.last_login_at ? new Date(partner.last_login_at).toLocaleString() : 'Jamais'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Status */}
            <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <CardHeader className="border-b border-gray-100 dark:border-strokedark">
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-meta-3 dark:text-green-300" />
                  </div>
                  <span>Statut du compte</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:p-4 md:p-6">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-body dark:text-bodydark2">E-mail vérifié</p>
                      <Badge variant={partner.email_verified ? "default" : "secondary"}>
                        {partner.email_verified ? 'Oui' : 'Non'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Phone className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-body dark:text-bodydark2">Téléphone vérifié</p>
                      <Badge variant={partner.phone_verified ? "default" : "secondary"}>
                        {partner.phone_verified ? 'Oui' : 'Non'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-meta-3 dark:text-green-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-body dark:text-bodydark2">Compte actif</p>
                      <Badge variant={partner.account_is_active ? "default" : "secondary"}>
                        {partner.account_is_active ? 'Oui' : 'Non'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-body dark:text-bodydark2">Account Frozen</p>
                      <Badge variant={partner.account_is_frozen ? "destructive" : "secondary"}>
                        {partner.account_is_frozen ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <CardHeader className="border-b border-gray-100 dark:border-strokedark">
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <DollarSign className="h-5 w-5 text-meta-3 dark:text-green-300" />
                  </div>
                  <span>Financial Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:p-4 md:p-6">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <DollarSign className="h-5 w-5 text-bodydark2" />
                    <div>
                      <p className="text-sm font-medium text-body dark:text-bodydark2">Account Balance</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        ${parseFloat(partner.account_balance || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <DollarSign className="h-5 w-5 text-bodydark2" />
                    <div>
                      <p className="text-sm font-medium text-body dark:text-bodydark2">Total Commissions</p>
                      <p className="text-lg font-semibold text-meta-3">
                        ${parseFloat(partner.total_commissions_received || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <DollarSign className="h-5 w-5 text-bodydark2" />
                    <div>
                      <p className="text-sm font-medium text-body dark:text-bodydark2">Total Transaction Amount</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        ${parseFloat(partner.total_transaction_amount || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Users className="h-5 w-5 text-bodydark2" />
                    <div>
                      <p className="text-sm font-medium text-body dark:text-bodydark2">Total Transactions</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {partner.total_transactions || 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-5 w-5 text-bodydark2" />
                    <div>
                      <p className="text-sm font-medium text-body dark:text-bodydark2">Completed Transactions</p>
                      <p className="text-lg font-semibold text-meta-3">
                        {partner.completed_transactions || 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Mail className="h-5 w-5 text-bodydark2" />
                    <div>
                      <p className="text-sm font-medium text-body dark:text-bodydark2">Contact Method</p>
                      <p className="text-gray-900 dark:text-gray-100">{partner.contact_method || 'Non spécifié'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Phone className="h-5 w-5 text-bodydark2" />
                    <div>
                      <p className="text-sm font-medium text-body dark:text-bodydark2">USSD Transactions</p>
                      <Badge variant={partner.can_process_ussd_transaction ? "success" : "secondary"}>
                        {partner.can_process_ussd_transaction ? 'Autorisé' : 'Non autorisé'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}