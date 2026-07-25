"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { useLanguage } from "@/components/providers/language-provider"
import { Zap, Eye, EyeOff, Mail, Lock, Shield, ArrowRight, Sparkles, CheckCircle } from "lucide-react"
import { useApi } from "@/lib/useApi"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { getAppName } from "@/lib/env-config"

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

export function SignInForm() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()
  const appName = getAppName()
  const [showPassword, setShowPassword] = useState(false)
  const apiFetch = useApi();
  const { toast } = useToast();

  // Forgot Password Flow State
  const [flow, setFlow] = useState<"login" | "forgot-password" | "otp" | "reset-password" | "success">("login")
  const [otpCode, setOtpCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const data = await apiFetch(`auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      })
      if (!data || !data.access || !data.refresh || !data.user) {
        const backendError = extractErrorMessages(data) || t("auth.loginFailed")
        setError(backendError)
        toast({
          title: t("auth.loginFailed"),
          description: backendError,
          variant: "destructive",
        })
        setLoading(false)
        return
      }
      // Enforce staff/superuser-only access
      const user = data.user
      const isStaff = Boolean(user?.is_staff)
      const isSuperuser = Boolean(user?.is_superuser)
      if (!isStaff && !isSuperuser) {
        const notAllowedMsg = t("auth.notAllowed") || "User is not allowed to access this dashboard."
        setError(notAllowedMsg)
        toast({
          title: t("auth.loginFailed"),
          description: notAllowedMsg,
          variant: "destructive",
        })
        setLoading(false)
        return
      }
      localStorage.setItem("accessToken", data.access)
      localStorage.setItem("refreshToken", data.refresh)
      localStorage.setItem("user", JSON.stringify(data.user))
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true")
        document.cookie = `accessToken=${data.access}; path=/; max-age=86400; secure; samesite=strict`;
      } else {
        localStorage.removeItem("rememberMe")
        document.cookie = `accessToken=${data.access}; path=/; secure; samesite=strict`;
      }
      toast({
        title: t("auth.loginSuccess"),
        description: t("auth.loggedInSuccessfully"),
      })
      router.push("/dashboard")
    } catch (err: any) {
      let backendError = t("auth.networkError");
      if (err && err.message) {
        try {
          const parsed = JSON.parse(err.message);
          backendError = extractErrorMessages(parsed) || backendError;
        } catch {
          backendError = extractErrorMessages(err.message) || backendError;
        }
      } else if (err) {
        backendError = extractErrorMessages(err) || backendError;
      }
      setError(backendError);
      toast({
        title: t("auth.networkError"),
        description: backendError,
        variant: "destructive",
      });
      setLoading(false);
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const response = await apiFetch(`auth/password-reset/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
        successMessage: "Un code OTP a été envoyé à votre adresse e-mail.",
      })

      // Check if response indicates an error (even with 200 status)
      if (response?.error || response?.errors || response?.detail) {
        const errorMsg = response.error || response.detail || extractErrorMessages(response) || "Impossible d'envoyer l'OTP"
        setError(errorMsg)
        return // Don't advance to next step
      }

      // Only advance to next step if we got a successful response
      if (response) {
        setFlow("otp")
      }
    } catch (err: any) {
      setError(extractErrorMessages(err) || "Impossible d'envoyer l'OTP")
      // Don't advance to next step on error
    } finally {
      setLoading(false)
    }
  }


  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (otpCode.length < 6) {
      setError("Le code OTP doit comporter 6 chiffres.")
      return
    }
    setFlow("reset-password")
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }
    setLoading(true)
    try {
      const response = await apiFetch(`auth/password-reset/confirm/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          code: otpCode,
          new_password: newPassword,
        }),
        successMessage: "Votre mot de passe a été réinitialisé avec succès.",
      })

      // Check if response indicates an error (even with 200 status)
      if (response?.error || response?.errors || response?.detail) {
        const errorMsg = response.error || response.detail || extractErrorMessages(response) || "Impossible de réinitialiser le mot de passe"
        setError(errorMsg)
        return // Don't advance to next step
      }

      // Only advance to success step if we got a successful response
      if (response) {
        setFlow("success")
      }
    } catch (err: any) {
      setError(extractErrorMessages(err) || "Impossible de réinitialiser le mot de passe")
      // Don't advance to next step on error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50/30 via-transparent to-green-50/30 dark:from-gray-900/50 dark:via-transparent dark:to-gray-800/50">
      <div className="w-full max-w-md space-y-4 sm:space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold sm:text-xl bg-gradient-to-r from-primary to-meta-3 bg-clip-text text-transparent">
            {appName}
          </h2>
        </div>

        <Card className="bg-white/90 dark:bg-boxdark/90 backdrop-blur-sm border border-stroke/20 dark:border-orange-800/20 shadow-2xl shadow-orange-500/10">
          <CardHeader className="space-y-4 pb-6">
            <div className="text-center space-y-2">
              <CardTitle className="text-lg font-bold sm:text-xl text-gray-900 dark:text-white">
                {flow === "login" && <span>{t("auth.welcome")} à {appName}</span>}
                {flow === "forgot-password" && <span>Mot de passe oublié</span>}
                {flow === "otp" && <span>Vérification OTP</span>}
                {flow === "reset-password" && <span>Nouveau mot de passe</span>}
                {flow === "success" && <span>Succès !</span>}
              </CardTitle>
              <CardDescription className="text-body dark:text-bodydark2">
                {flow === "login" && "Accédez à votre tableau de bord administrateur"}
                {flow === "forgot-password" && "Entrez votre identifiant pour recevoir un code OTP"}
                {flow === "otp" && `Entrez le code envoyé à ${identifier}`}
                {flow === "reset-password" && "Choisissez votre nouveau mot de passe"}
                {flow === "success" && "Votre mot de passe a été modifié"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {flow === "login" && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-bodydark flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span>{t("auth.email")}</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      className="pl-12 pr-4 py-3 bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark focus:border-primary focus:ring-primary transition-all duration-200"
                    />
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-bodydark2" />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-bodydark flex items-center space-x-2">
                    <Lock className="h-4 w-4 text-primary" />
                    <span>{t("auth.password")}</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-12 pr-12 py-3 bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark focus:border-primary focus:ring-primary transition-all duration-200"
                    />
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-bodydark2" />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-bodydark2 hover:text-body dark:hover:text-gray-300 transition-colors duration-200"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label htmlFor="remember" className="text-sm text-gray-700 dark:text-bodydark">
                      <span>{t("auth.rememberMe")}</span>
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-sm text-primary hover:text-orange-700"
                    onClick={() => setFlow("forgot-password")}
                  >
                    Mot de passe oublié ?
                  </Button>
                </div>

                <Button type="submit" className="w-full py-3 bg-gradient-to-r from-primary to-primary" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                  {loading ? <span>{t("auth.loggingIn")}</span> : <span>{t("auth.signIn")}</span>}
                </Button>
              </form>
            )}

            {flow === "forgot-password" && (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="reset-email">Identifiant (Email)</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Envoyer le code OTP
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setFlow("login")}>
                  Retour à la connexion
                </Button>
              </form>
            )}

            {flow === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="otp">Code OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="720290"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Vérifier le code
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setFlow("forgot-password")}>
                  Changer l'email
                </Button>
              </form>
            )}

            {flow === "reset-password" && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="new-password">Nouveau mot de passe</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Réinitialiser le mot de passe
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setFlow("otp")} type="button">
                  Retour
                </Button>
              </form>
            )}

            {flow === "success" && (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="h-10 w-10 text-meta-3" />
                  </div>
                </div>
                <p>Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.</p>
                <Button className="w-full" onClick={() => setFlow("login")}>
                  Aller à la connexion
                </Button>
              </div>
            )}

            {error && (
              <ErrorDisplay
                error={error}
                variant="inline"
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

