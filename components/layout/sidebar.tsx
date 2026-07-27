"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/components/providers/language-provider"
import {
  BarChart3, Users, CreditCard, LogOut, X, ChevronDown, ChevronUp,
  Globe, Share2, Phone, Monitor, MessageCircle, Bell, Settings, Terminal,
  User, Home, DollarSign, Waves, Smartphone, ArrowUpDown, Gamepad2,
  Shield, Receipt, ShieldCheck, Layers, Send, ArrowLeftRight,
} from "lucide-react"
import { clearTokens } from "@/lib/api"
import { FeatureGate } from "@/components/feature-gate"
import { getAppLogo, getAppName, getAppTagline } from "@/lib/env-config"

interface SidebarProps {
  mobileSidebarOpen?: boolean
  onToggleMobileSidebar?: () => void
}

function NavItem({ href, icon, label, active, onClick }: {
  href: string; icon: React.ReactNode; label: string; active: boolean; onClick?: () => void
}) {
  return (
    <Link href={href} onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium duration-200",
        active
          ? "bg-graydark text-white dark:bg-meta-4"
          : "text-bodydark1 hover:bg-graydark hover:text-white dark:hover:bg-meta-4"
      )}>
      <span className="flex-shrink-0 [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  )
}

function DropdownNav({ icon, label, active, open, onToggle, children }: {
  icon: React.ReactNode; label: string; active: boolean
  open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div>
      <button onClick={onToggle}
        className={cn(
          "group flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium duration-200",
          active
            ? "bg-graydark text-white dark:bg-meta-4"
            : "text-bodydark1 hover:bg-graydark hover:text-white dark:hover:bg-meta-4"
        )}>
        <span className="flex-shrink-0 [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
        <span className="flex-1 truncate text-left">{label}</span>
        {open ? <ChevronUp className="h-4 w-4 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 flex-shrink-0" />}
      </button>
      <div className={cn(
        "overflow-hidden transition-[max-height,opacity] duration-200",
        open ? "max-h-96 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
      )}>
        <ul className="mt-0.5 flex flex-col gap-0.5 pl-11">{children}</ul>
      </div>
    </div>
  )
}

function SubItem({ href, label, active, onClick }: {
  href: string; label: string; active: boolean; onClick?: () => void
}) {
  return (
    <li>
      <Link href={href} onClick={onClick}
        className={cn(
          "block truncate rounded-sm px-3 py-1.5 text-xs duration-200",
          active ? "text-white font-medium" : "text-bodydark2 hover:text-white"
        )}>
        {label}
      </Link>
    </li>
  )
}

function SidebarInner({ onNavClick }: { onNavClick?: () => void }) {
  const [drops, setDrops] = useState<Record<string, boolean>>({})
  const toggle = (k: string) => setDrops(p => ({ ...p, [k]: !p[k] }))
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useLanguage()
  const appLogo = getAppLogo()
  const appName = getAppName()
  const appTagline = getAppTagline()
  const is = (path: string) => pathname === path
  const has = (path: string) => pathname.startsWith(path)

  const logout = () => {
    clearTokens()
    if (typeof document !== "undefined")
      document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict"
    localStorage.removeItem("isAuthenticated")
    router.push("/")
  }

  return (
    <div className="flex h-full flex-col bg-black dark:bg-boxdark">
      {/* Logo */}
      <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center gap-2 px-4 py-4 lg:px-6 lg:py-6">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
          <img src={appLogo} alt={appName} className="h-9 w-9 flex-shrink-0 object-contain" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{appName}</p>
            <p className="truncate text-xs text-bodydark2">{appTagline}</p>
          </div>
        </Link>
        {onNavClick && (
          <button onClick={onNavClick} className="flex-shrink-0 rounded p-1 text-bodydark2 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Scrollable nav */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-3 py-2 lg:px-4 lg:py-4">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-bodydark2">Menu</p>
        <ul className="flex flex-col gap-0.5">

          <FeatureGate feature="dashboard">
            <li><NavItem href="/dashboard" icon={<Home />} label={t("nav.dashboard")} active={is("/dashboard")} onClick={onNavClick} /></li>
          </FeatureGate>

          <FeatureGate feature="users">
            <li>
              <DropdownNav icon={<Users />} label={t("nav.users")} active={has("/dashboard/users")} open={!!drops.users} onToggle={() => toggle("users")}>
                <SubItem href="/dashboard/users/register" label={t("nav.register")} active={is("/dashboard/users/register")} onClick={onNavClick} />
                <SubItem href="/dashboard/users/list" label={t("nav.userList")} active={is("/dashboard/users/list")} onClick={onNavClick} />
              </DropdownNav>
            </li>
          </FeatureGate>

          <FeatureGate feature="transactions">
            <li><NavItem href="/dashboard/transactions" icon={<ArrowLeftRight />} label={t("nav.transactions")} active={has("/dashboard/transactions")} onClick={onNavClick} /></li>
          </FeatureGate>

          <FeatureGate feature="outboundSms">
            <li><NavItem href="/dashboard/sms-outbound" icon={<Send />} label={t("nav.outboundSms")} active={has("/dashboard/sms-outbound")} onClick={onNavClick} /></li>
          </FeatureGate>

          <FeatureGate feature="bulkDepositNetworks">
            <li><NavItem href="/dashboard/bulk-deposit-networks" icon={<Shield />} label={t("nav.bulkDepositNetworks")} active={has("/dashboard/bulk-deposit-networks")} onClick={onNavClick} /></li>
          </FeatureGate>

          <FeatureGate feature="deviceAuthorizations">
            <li><NavItem href="/dashboard/device-authorizations" icon={<ShieldCheck />} label={t("nav.deviceAuthorizations")} active={has("/dashboard/device-authorizations")} onClick={onNavClick} /></li>
          </FeatureGate>

          <FeatureGate feature="aggregators">
            <li>
              <DropdownNav icon={<Layers />} label={t("nav.aggregators")} active={has("/dashboard/aggregators")} open={!!drops.agg} onToggle={() => toggle("agg")}>
                <SubItem href="/dashboard/aggregators/users" label={t("nav.aggregatorUsers")} active={has("/dashboard/aggregators/users")} onClick={onNavClick} />
                <SubItem href="/dashboard/aggregators/authorizations" label={t("nav.aggregatorAuthorizations")} active={is("/dashboard/aggregators/authorizations")} onClick={onNavClick} />
                <SubItem href="/dashboard/aggregators/network-mappings" label={t("nav.aggregatorNetworkMappings")} active={is("/dashboard/aggregators/network-mappings")} onClick={onNavClick} />
                <SubItem href="/dashboard/aggregators/transactions" label={t("nav.aggregatorTransactions")} active={is("/dashboard/aggregators/transactions")} onClick={onNavClick} />
              </DropdownNav>
            </li>
          </FeatureGate>

          <FeatureGate feature="country">
            <li>
              <DropdownNav icon={<Globe />} label={t("nav.country")} active={has("/dashboard/country")} open={!!drops.country} onToggle={() => toggle("country")}>
                <SubItem href="/dashboard/country/list" label={t("nav.countryList")} active={is("/dashboard/country/list")} onClick={onNavClick} />
                <SubItem href="/dashboard/country/create" label={t("nav.countryCreate")} active={is("/dashboard/country/create")} onClick={onNavClick} />
              </DropdownNav>
            </li>
          </FeatureGate>

          <FeatureGate feature="network">
            <li>
              <DropdownNav icon={<Share2 />} label={t("nav.network")} active={has("/dashboard/network")} open={!!drops.network} onToggle={() => toggle("network")}>
                <SubItem href="/dashboard/network/list" label={t("nav.networkList")} active={is("/dashboard/network/list")} onClick={onNavClick} />
                <SubItem href="/dashboard/network/create" label={t("nav.networkCreate")} active={is("/dashboard/network/create")} onClick={onNavClick} />
              </DropdownNav>
            </li>
          </FeatureGate>

          <FeatureGate feature="phoneNumbers">
            <li><NavItem href="/dashboard/phone-number/list" icon={<Phone />} label={t("nav.phoneNumbers")} active={has("/dashboard/phone-number")} onClick={onNavClick} /></li>
          </FeatureGate>

          <FeatureGate feature="devices">
            <li>
              <DropdownNav icon={<Monitor />} label={t("nav.devices")} active={has("/dashboard/devices")} open={!!drops.devices} onToggle={() => toggle("devices")}>
                <SubItem href="/dashboard/devices/flashpay" label="FlashPay" active={has("/dashboard/devices/flashpay")} onClick={onNavClick} />
              </DropdownNav>
            </li>
          </FeatureGate>

          <FeatureGate feature="smsLogs">
            <li><NavItem href="/dashboard/sms-logs/list" icon={<MessageCircle />} label={t("nav.smsLogs")} active={has("/dashboard/sms-logs")} onClick={onNavClick} /></li>
          </FeatureGate>

          <FeatureGate feature="fcmLogs">
            <li><NavItem href="/dashboard/fcm-logs/list" icon={<Bell />} label={t("nav.fcmLogs")} active={has("/dashboard/fcm-logs")} onClick={onNavClick} /></li>
          </FeatureGate>

          <FeatureGate feature="partner">
            <li><NavItem href="/dashboard/partner" icon={<User />} label={t("nav.partner")} active={has("/dashboard/partner") && !has("/dashboard/partner-")} onClick={onNavClick} /></li>
          </FeatureGate>

          <FeatureGate feature="partnerTransfers">
            <li><NavItem href="/dashboard/partner-transfers" icon={<ArrowUpDown />} label="Transferts Partenaires" active={has("/dashboard/partner-transfers")} onClick={onNavClick} /></li>
          </FeatureGate>

          <FeatureGate feature="platforms">
            <li>
              <DropdownNav icon={<Gamepad2 />} label="Plateformes" active={has("/dashboard/platforms")} open={!!drops.platforms} onToggle={() => toggle("platforms")}>
                <SubItem href="/dashboard/platforms/list" label="Liste" active={is("/dashboard/platforms/list")} onClick={onNavClick} />
                <SubItem href="/dashboard/platforms/create" label="Créer" active={is("/dashboard/platforms/create")} onClick={onNavClick} />
              </DropdownNav>
            </li>
          </FeatureGate>

          <FeatureGate feature="bettingTransactions">
            <li><NavItem href="/dashboard/betting-transactions" icon={<Receipt />} label="Transactions Paris" active={has("/dashboard/betting-transactions")} onClick={onNavClick} /></li>
          </FeatureGate>

          <FeatureGate feature="permissions">
            <li>
              <DropdownNav icon={<Shield />} label="Permissions" active={has("/dashboard/permissions")} open={!!drops.perms} onToggle={() => toggle("perms")}>
                <SubItem href="/dashboard/permissions/list" label="Liste" active={is("/dashboard/permissions/list")} onClick={onNavClick} />
                <SubItem href="/dashboard/permissions/create" label="Créer" active={is("/dashboard/permissions/create")} onClick={onNavClick} />
              </DropdownNav>
            </li>
          </FeatureGate>

          <FeatureGate feature="networkConfig">
            <li>
              <DropdownNav icon={<Settings />} label={t("nav.networkConfig")} active={has("/dashboard/network-config")} open={!!drops.netcfg} onToggle={() => toggle("netcfg")}>
                <SubItem href="/dashboard/network-config/list" label={t("nav.networkConfigList")} active={is("/dashboard/network-config/list")} onClick={onNavClick} />
                <SubItem href="/dashboard/network-config/create" label={t("nav.networkConfigCreate")} active={is("/dashboard/network-config/create")} onClick={onNavClick} />
              </DropdownNav>
            </li>
          </FeatureGate>

          <FeatureGate feature="momoPay">
            <li><NavItem href="/dashboard/momo-pay" icon={<Smartphone />} label="MoMo Pay" active={has("/dashboard/momo-pay")} onClick={onNavClick} /></li>
          </FeatureGate>

          <FeatureGate feature="waveBusiness">
            <li><NavItem href="/dashboard/wave-business-transaction" icon={<Waves />} label="Wave Business" active={has("/dashboard/wave-business-transaction")} onClick={onNavClick} /></li>
          </FeatureGate>

          <FeatureGate feature="topup">
            <li><NavItem href="/dashboard/topup" icon={<DollarSign />} label={t("nav.topup")} active={has("/dashboard/topup")} onClick={onNavClick} /></li>
          </FeatureGate>

          <FeatureGate feature="earningManagement">
            <li><NavItem href="/dashboard/earning-management" icon={<BarChart3 />} label={t("nav.earningManagement")} active={has("/dashboard/earning-management")} onClick={onNavClick} /></li>
          </FeatureGate>

          <FeatureGate feature="remoteCommand">
            <li><NavItem href="/dashboard/remote-command" icon={<Terminal />} label={t("nav.remoteCommand")} active={has("/dashboard/remote-command")} onClick={onNavClick} /></li>
          </FeatureGate>

          <FeatureGate feature="profile">
            <li><NavItem href="/dashboard/profile" icon={<User />} label={t("nav.profile")} active={has("/dashboard/profile")} onClick={onNavClick} /></li>
          </FeatureGate>

        </ul>
      </div>

      {/* Logout */}
      <div className="border-t border-white/10 px-3 py-3 lg:px-4">
        <button onClick={logout}
          className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium text-bodydark1 duration-200 hover:bg-graydark hover:text-white dark:hover:bg-meta-4">
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className="truncate">{t("nav.logout")}</span>
        </button>
      </div>
    </div>
  )
}

export function Sidebar({ mobileSidebarOpen = false, onToggleMobileSidebar }: SidebarProps) {
  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-59 lg:block">
        <SidebarInner />
      </aside>

      {/* Mobile overlay sidebar */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", mobileSidebarOpen ? "block" : "hidden")}>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onToggleMobileSidebar} />
        <aside className="fixed inset-y-0 left-0 w-72 shadow-xl">
          <SidebarInner onNavClick={onToggleMobileSidebar} />
        </aside>
      </div>
    </>
  )
}
