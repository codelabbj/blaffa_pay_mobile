"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/providers/language-provider"
import { useApi } from "@/lib/useApi"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { ArrowLeft, Save, Loader2, UserPlus, Mail, Phone, User, Shield } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { getApiBaseUrl, getApiToken } from "@/lib/env-config"

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

export default function RegisterUserForm() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    identifier: "",
    password: "",
    password_confirm: "",
    is_partner: false,
    can_process_ussd_transaction: false,
    can_process_momo: true,
    can_process_mobcash: true,
    can_process_bulk_payment: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const { t } = useLanguage();
  const apiFetch = useApi();
  const { toast } = useToast();
  const router = useRouter();

  // Get base URL and token from env
  const baseUrl = getApiBaseUrl()
  const apiToken = getApiToken()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    if (form.password !== form.password_confirm) {
      setError("Les mots de passe ne correspondent pas")
      toast({
        title: "Échec de l'inscription",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (apiToken) {
        headers["Authorization"] = `Bearer ${apiToken}`
      }
      // Map identifier to email or phone for backend compatibility
      const isEmail = /@/.test(form.identifier)
      const submitBody = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: isEmail ? form.identifier : null,
        phone: isEmail ? null : form.identifier,
        password: form.password,
        password_confirm: form.password_confirm,
        is_partner: form.is_partner,
        can_process_ussd_transaction: form.can_process_ussd_transaction,
        can_process_momo: form.can_process_momo,
        can_process_mobcash: form.can_process_mobcash,
        can_process_bulk_payment: form.can_process_bulk_payment,
      }
      const data = await apiFetch(`auth/register/`, {
        method: "POST",
        headers,
        body: JSON.stringify(submitBody),
        successMessage: "Utilisateur enregistré avec succès"
      })
      if (data && data.detail) {
        const backendError = extractErrorMessages(data)
        setError(backendError)
        toast({
          title: "Échec de l'inscription",
          description: backendError,
          variant: "destructive",
        })
      } else {
        setSuccess("Utilisateur enregistré avec succès")
        setForm({
          first_name: "",
          last_name: "",
          identifier: "",
          password: "",
          password_confirm: "",
          is_partner: false,
          can_process_ussd_transaction: false,
          can_process_momo: false,
          can_process_mobcash: false,
          can_process_bulk_payment: false,
        })
      }
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || "Échec de l'inscription"
      setError(errorMessage)
      toast({
        title: "Échec de l'inscription",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-whiten dark:bg-boxdark-2">
      <div className="mx-auto px-4 sm:px-6 lg:px-3 sm:px-6 py-4 sm:py-6">

        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* <Button 
                variant="outline" 
                onClick={() => router.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button> */}
              <div>
                <h1 className="text-base font-bold sm:text-lg sm:text-2xl bg-gradient-to-r from-primary to-meta-3 bg-clip-text text-transparent">
                  {t("register.title") || "Enregistrer un utilisateur"}
                </h1>
                <p className="text-body dark:text-bodydark mt-2 text-lg">
                  Créer un nouveau compte utilisateur
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

        {success && (
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center space-x-2 text-meta-3">
                <UserPlus className="h-5 w-5" />
                <span className="font-medium">{success}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">

            <CardContent className="p-3 sm:p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    placeholder="Entrez le prénom"
                    className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Nom de famille</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    placeholder="Entrez le nom de famille"
                    className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="identifier">Email ou téléphone</Label>
                <Input
                  id="identifier"
                  name="identifier"
                  value={form.identifier}
                  onChange={handleChange}
                  placeholder="Entrez l'email ou le numéro de téléphone"
                  className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                  required
                />
                <p className="text-sm text-body dark:text-bodydark2 mt-1">
                  Entrez soit une adresse email soit un numéro de téléphone
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Entrez le mot de passe"
                    className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password_confirm">Confirmer le mot de passe</Label>
                  <Input
                    id="password_confirm"
                    name="password_confirm"
                    type="password"
                    value={form.password_confirm}
                    onChange={handleChange}
                    placeholder="Confirmez le mot de passe"
                    className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            {/* <CardHeader className="border-b border-gray-100 dark:border-strokedark">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Mail className="h-5 w-5 text-meta-3 dark:text-green-300" />
                </div>
                <span>Informations de contact</span>
              </CardTitle>
            </CardHeader> */}
            {/* <CardContent className="p-3 sm:p-4 md:p-6 space-y-4">
              <div>
                <Label htmlFor="identifier">Email ou téléphone</Label>
                <Input
                  id="identifier"
                  name="identifier"
                  value={form.identifier}
                  onChange={handleChange}
                  placeholder="Entrez l'email ou le numéro de téléphone"
                  className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                  required
                />
                <p className="text-sm text-body dark:text-bodydark2 mt-1">
                  Entrez soit une adresse email soit un numéro de téléphone
                </p>
              </div>
            </CardContent> */}
          </Card>

          {/* Security */}
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            {/* <CardHeader className="border-b border-gray-100 dark:border-strokedark">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <span>Sécurité</span>
              </CardTitle>
            </CardHeader> */}
            {/* <CardContent className="p-3 sm:p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Entrez le mot de passe"
                    className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password_confirm">Confirmer le mot de passe</Label>
                  <Input
                    id="password_confirm"
                    name="password_confirm"
                    type="password"
                    value={form.password_confirm}
                    onChange={handleChange}
                    placeholder="Confirmez le mot de passe"
                    className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
                    required
                  />
                </div>
              </div>
            </CardContent> */}
          </Card>

          {/* User Type */}
          <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            {/* <CardHeader className="border-b border-gray-100 dark:border-strokedark">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-meta-2 dark:bg-orange-900 rounded-lg">
                  <UserPlus className="h-5 w-5 text-primary dark:text-secondary" />
                </div>
                <span>Type d'utilisateur</span>
              </CardTitle>
            </CardHeader> */}
            <CardContent className="p-3 sm:p-4 md:p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_partner"
                  name="is_partner"
                  checked={form.is_partner}
                  onCheckedChange={(checked) => setForm({ ...form, is_partner: checked })}
                />
                <Label htmlFor="is_partner">S'enregistrer comme partenaire</Label>
              </div>
              <p className="text-sm text-body dark:text-bodydark2">
                Les partenaires ont accès au suivi des commissions et à des fonctionnalités supplémentaires
              </p>

              <div className="flex items-center space-x-2 pt-2 border-t border-stroke dark:border-strokedark">
                <Switch
                  id="can_process_ussd_transaction"
                  name="can_process_ussd_transaction"
                  checked={form.can_process_ussd_transaction}
                  onCheckedChange={(checked) => setForm({ ...form, can_process_ussd_transaction: checked })}
                />
                <Label htmlFor="can_process_ussd_transaction">Peut traiter les transactions USSD</Label>
              </div>
              <p className="text-sm text-body dark:text-bodydark2">
                Autorise l'utilisateur à effectuer des transactions via USSD
              </p>

              <div className="flex items-center space-x-2 pt-2 border-t border-stroke dark:border-strokedark">
                <Switch
                  id="can_process_momo"
                  name="can_process_momo"
                  checked={form.can_process_momo}
                  onCheckedChange={(checked) => setForm({ ...form, can_process_momo: checked })}
                />
                <Label htmlFor="can_process_momo">{t("register.canProcessMomo") || "Peut traiter MoMo"}</Label>
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t border-stroke dark:border-strokedark">
                <Switch
                  id="can_process_mobcash"
                  name="can_process_mobcash"
                  checked={form.can_process_mobcash}
                  onCheckedChange={(checked) => setForm({ ...form, can_process_mobcash: checked })}
                />
                <Label htmlFor="can_process_mobcash">{t("register.canProcessMobcash") || "Peut traiter Mobcash"}</Label>
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t border-stroke dark:border-strokedark">
                <Switch
                  id="can_process_bulk_payment"
                  name="can_process_bulk_payment"
                  checked={form.can_process_bulk_payment}
                  onCheckedChange={(checked) => setForm({ ...form, can_process_bulk_payment: checked })}
                />
                <Label htmlFor="can_process_bulk_payment">{t("register.canProcessBulkPayment") || "Peut traiter Pajement en masse"}</Label>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer l'utilisateur
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}