"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2 } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={2000}>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} {...props} variant={variant}>
            <div className="grid gap-2 flex-1">
              <div className="flex items-start gap-3">
                {variant === "success" && (
                  <CheckCircle2 className="h-5 w-5 text-meta-3 dark:text-green-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  {title && <ToastTitle><span>{title}</span></ToastTitle>}
                  {description && (
                    <ToastDescription><span>{description}</span></ToastDescription>
                  )}
                </div>
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
