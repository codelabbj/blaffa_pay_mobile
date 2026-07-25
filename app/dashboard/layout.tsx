"use client"

import type React from "react"
import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex overflow-x-hidden">
      <Sidebar
        mobileSidebarOpen={sidebarOpen}
        onToggleMobileSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="relative flex min-w-0 flex-1 flex-col lg:ml-59">
        <Header onMobileMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="min-w-0">
          <div className="min-h-screen w-full overflow-x-hidden bg-whiten p-3 dark:bg-boxdark-2 sm:p-4 md:p-3 sm:p-4 md:p-6 2xl:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
