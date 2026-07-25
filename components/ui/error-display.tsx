"use client"

import { useState } from "react"
import { AlertTriangle, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLanguage } from "@/components/providers/language-provider"

interface ErrorDisplayProps {
  error: string
  onRetry?: () => void
  onDismiss?: () => void
  variant?: "inline" | "full" | "modal"
  className?: string
  showRetry?: boolean
  showDismiss?: boolean
}

// Helper to extract error messages from API responses
export function extractErrorMessages(errorObj: any): string {
  // Handle null/undefined
  if (!errorObj) return "An unknown error occurred"

  // Handle strings (already extracted)
  if (typeof errorObj === "string") return errorObj

  // Handle non-objects
  if (typeof errorObj !== "object") return String(errorObj)

  // Handle arrays
  if (Array.isArray(errorObj)) {
    return errorObj.map(item => extractErrorMessages(item)).join(" ")
  }

  // Handle objects - check for common error fields
  if (errorObj.detail) return errorObj.detail
  if (errorObj.message) return errorObj.message
  if (errorObj.error) return errorObj.error
  if (errorObj.msg) return errorObj.msg

  // Handle field-specific errors (e.g., {"email": ["This field is required"]})
  const fieldErrors = Object.entries(errorObj)
    .filter(([key, value]) => Array.isArray(value) && value.length > 0)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
    .join("; ")

  if (fieldErrors) return fieldErrors

  // Handle other object values
  const values = Object.values(errorObj)
    .map((v) => Array.isArray(v) ? v.join(" ") : String(v))
    .join(" ")

  return values || "An unknown error occurred"
}

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  variant = "inline",
  className = "",
  showRetry = true,
  showDismiss = true
}: ErrorDisplayProps) {
  const { t } = useLanguage()
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = async () => {
    if (!onRetry) return
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  if (!error) return null

  const errorMessage = typeof error === "string" ? error : extractErrorMessages(error)

  if (variant === "full") {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[400px] space-y-6 ${className}`}>
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 p-3 sm:p-4 md:p-6 rounded-full shadow-lg">
            <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <div className="space-y-3">
            <h3 className="text-base font-bold sm:text-lg bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent dark:from-red-400 dark:to-red-300">
              <span>{t("common.errorOccurred")}</span>
            </h3>
            <p className="text-sm text-body dark:text-bodydark2 max-w-md">
              <span>{errorMessage}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {showRetry && onRetry && (
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  <span>{t("common.retrying")}</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <span>{t("common.retry")}</span>
                </>
              )}
            </Button>
          )}
          {showDismiss && onDismiss && (
            <Button
              onClick={onDismiss}
              variant="ghost"
              className="text-body hover:text-gray-900 dark:text-bodydark2 dark:hover:text-gray-100"
            >
              <span>{t("common.dismiss")}</span>
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (variant === "modal") {
    return (
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}>
        <div className="bg-white/95 dark:bg-boxdark/95 backdrop-blur-md border-2 border-stroke/50 dark:border-strokedark/50 rounded-xl p-3 sm:p-4 md:p-6 max-w-md mx-4 shadow-2xl">
          <div className="flex items-start gap-2 sm:gap-4">
            <div className="bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 p-3 rounded-full flex-shrink-0 shadow-sm">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent dark:from-red-400 dark:to-red-300">
                <span>{t("common.errorOccurred")}</span>
              </h3>
              <p className="text-sm text-body dark:text-bodydark2">
                <span>{errorMessage}</span>
              </p>
              <div className="flex items-center space-x-2 pt-3">
                {showRetry && onRetry && (
                  <Button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    {isRetrying ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        <span>{t("common.retrying")}</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        <span>{t("common.retry")}</span>
                      </>
                    )}
                  </Button>
                )}
                {showDismiss && onDismiss && (
                  <Button
                    onClick={onDismiss}
                    size="sm"
                    variant="ghost"
                    className="text-body hover:text-gray-900 dark:text-bodydark2 dark:hover:text-gray-100"
                  >
                    <span>{t("common.dismiss")}</span>
                  </Button>
                )}
              </div>
            </div>
            {showDismiss && onDismiss && (
              <Button
                onClick={onDismiss}
                size="sm"
                variant="ghost"
                className="text-body hover:text-gray-700 dark:text-bodydark2 dark:hover:text-gray-200 p-1 h-auto rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Default inline variant
  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
        <span className="flex-1">{errorMessage}</span>
        <div className="flex items-center space-x-2 ml-4">
          {showRetry && onRetry && (
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              size="sm"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 h-8 px-3"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  <span>{t("common.retrying")}</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  <span>{t("common.retry")}</span>
                </>
              )}
            </Button>
          )}
          {showDismiss && onDismiss && (
            <Button
              onClick={onDismiss}
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 h-8 px-3"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
} 