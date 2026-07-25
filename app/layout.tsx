import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import "@/css/satoshi.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { LanguageProvider } from "@/components/providers/language-provider"
import { Toaster } from "@/components/ui/toaster"
import { getAppName, getAppTagline } from "@/lib/env-config"

const appName = getAppName()
const appTagline = getAppTagline()

export const metadata: Metadata = {
  title: `${appName} - ${appTagline}`,
  description: `Professional admin dashboard for ${appName}`,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-whiter text-boxdark dark:bg-boxdark-2 dark:text-white" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            {children}
            <Toaster />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
