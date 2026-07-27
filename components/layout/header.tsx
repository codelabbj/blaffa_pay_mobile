"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { useLanguage } from "@/components/providers/language-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, User, LogOut, Menu } from "lucide-react"
import { clearTokens } from "@/lib/api"
import { useRouter } from "next/navigation"
import { getAppName } from "@/lib/env-config"

interface HeaderProps {
  onMobileMenuClick?: () => void
}

export function Header({ onMobileMenuClick }: HeaderProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const appName = getAppName()

  const handleLogout = () => {
    clearTokens()
    if (typeof document !== "undefined")
      document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict"
    localStorage.removeItem("isAuthenticated")
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-999 flex w-full bg-white shadow-sm dark:bg-boxdark">
      <div className="flex flex-grow items-center justify-between px-3 py-3 md:px-6 md:py-4">

        {/* Left: hamburger + app name */}
        <div className="flex items-center gap-3">
          {/* Hamburger — visible only on mobile */}
          <button
            aria-label="Open menu"
            onClick={onMobileMenuClick}
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-stroke bg-white text-body shadow-sm hover:bg-gray dark:border-strokedark dark:bg-boxdark dark:text-bodydark dark:hover:bg-meta-4 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          {/* App name — visible on mobile only */}
          <span className="text-sm font-bold text-black dark:text-white lg:hidden">{appName}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-3">

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Language — hidden on small mobile */}
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {/* User avatar + dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none">
                <Avatar className="h-8 w-8 ring-2 ring-stroke transition-colors hover:ring-primary dark:ring-strokedark dark:hover:ring-primary sm:h-9 sm:w-9">
                  <AvatarImage src="/placeholder-user.jpg" alt="Admin" />
                  <AvatarFallback className="bg-primary text-xs font-bold text-white">AD</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 border-stroke dark:border-strokedark dark:bg-boxdark">
              <div className="flex items-center gap-3 border-b border-stroke px-3 py-3 dark:border-strokedark">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-sm font-bold text-white">AD</AvatarFallback>
                </Avatar>
                <p className="text-sm font-semibold text-black dark:text-white">Admin</p>
              </div>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-black dark:text-white">
                  <User className="h-4 w-4 text-body" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/api-config" className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-black dark:text-white">
                  <Settings className="h-4 w-4 text-body" /> Paramètres
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/5">
                <LogOut className="h-4 w-4" /> Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
