'use client'
import { SignInForm } from "@/components/auth/sign-in-form"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/providers/language-provider"

export default function SignInPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [checking, setChecking] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check for accessToken cookie
    if (typeof document !== 'undefined') {
      const hasToken = document.cookie.split(';').some(cookie => cookie.trim().startsWith('accessToken='))
      if (hasToken) {
        router.push('/dashboard')
      } else {
        setChecking(false)
      }
    }
  }, [router])

  // Hydration guard: show generic loading on server, and translated loading on client after mount
  if (!mounted || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-whiten dark:bg-boxdark-2">
        <span className="text-gray-700 dark:text-gray-200 text-lg">
          {mounted ? t("common.loading") : "Loading..."}
        </span>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-whiten px-4 py-4 sm:py-6 dark:bg-boxdark-2 sm:px-6">
      <div className="w-full max-w-md">
        <SignInForm />
      </div>
    </div>
  )
}
