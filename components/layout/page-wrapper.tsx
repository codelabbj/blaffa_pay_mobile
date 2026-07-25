/**
 * Shared page layout components matching betpay-dashboard design.
 * Use these in every dashboard page to ensure consistent styling.
 */

import React from "react"
import { Loader } from "lucide-react"

/** Top-level page container */
export function PageContainer({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full">{children}</div>
}

/** Page title + subtitle + optional right-side action */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-base font-bold sm:text-lg text-black dark:text-white sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-body dark:text-bodydark">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

/** White card with border, shadow and dark mode support — matches betpay cards */
export function PageCard({
  children,
  className = "",
  noPad = false,
}: {
  children: React.ReactNode
  className?: string
  noPad?: boolean
}) {
  return (
    <div
      className={`rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark ${noPad ? "" : "p-5 md:p-6"} ${className}`}
    >
      {children}
    </div>
  )
}

/** Card header with optional icon */
export function CardHead({
  icon,
  title,
}: {
  icon?: React.ReactNode
  title: string
}) {
  return (
    <div className="mb-4 flex items-center gap-3 border-b border-stroke pb-4 dark:border-strokedark">
      {icon && (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4 [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-black dark:text-white">{title}</h3>
    </div>
  )
}

/** Filter/search bar row */
export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

/** Betpay-style table wrapper */
export function DataTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

/** Standard table head row */
export function TableHeadRow({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="bg-gray-2 text-left dark:bg-meta-4">
        {cols.map((col, i) => (
          <th
            key={i}
            className="px-4 py-3 text-sm font-semibold text-black dark:text-white"
          >
            {col}
          </th>
        ))}
      </tr>
    </thead>
  )
}

/** Standard table body row */
export function TableBodyRow({
  children,
  index,
}: {
  children: React.ReactNode
  index: number
}) {
  return (
    <tr
      className={`border-t border-stroke dark:border-strokedark ${
        index % 2 === 0 ? "" : "bg-gray/30 dark:bg-meta-4/20"
      }`}
    >
      {children}
    </tr>
  )
}

/** Standard table cell */
export function TD({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-sm text-black dark:text-white ${className}`}>{children}</td>
}

/** Centered loader */
export function PageLoader({ text = "Chargement..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 sm:py-10 gap-3">
      <Loader className="h-7 w-7 animate-spin text-primary" />
      <span className="text-sm text-body dark:text-bodydark">{text}</span>
    </div>
  )
}

/** Empty state */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-6 sm:py-10 text-center">
      {icon && <div className="mb-3 text-bodydark2 [&>svg]:h-10 [&>svg]:w-10">{icon}</div>}
      <p className="text-base font-semibold text-black dark:text-white">{title}</p>
      {description && <p className="mt-1 text-sm text-body dark:text-bodydark">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/** Betpay-style pagination */
export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalCount)

  const pages: (number | "...")[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) pages.push(i)
    else if (pages[pages.length - 1] !== "...") pages.push("...")
  }

  return (
    <div className="mt-5 flex flex-wrap items-start justify-between gap-3 sm:items-center">
      <span className="text-xs text-body dark:text-bodydark">
        {start}–{end} sur {totalCount}
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="rounded-sm border border-stroke px-3 py-1 text-sm text-body hover:border-primary hover:text-primary disabled:opacity-40 dark:border-strokedark dark:text-bodydark"
        >
          Préc.
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={i} className="px-1 text-sm text-body dark:text-bodydark">…</span>
          ) : (
            <button
              key={i}
              onClick={() => onPageChange(p as number)}
              className={`rounded-sm border px-3 py-1 text-sm ${
                currentPage === p
                  ? "border-primary bg-primary text-white"
                  : "border-stroke text-body hover:border-primary hover:text-primary dark:border-strokedark dark:text-bodydark"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded-sm border border-stroke px-3 py-1 text-sm text-body hover:border-primary hover:text-primary disabled:opacity-40 dark:border-strokedark dark:text-bodydark"
        >
          Suiv.
        </button>
      </div>
    </div>
  )
}

/** Status badge using betpay color tokens */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "bg-meta-3/10 text-meta-3 border-meta-3/30",
    success:   "bg-meta-3/10 text-meta-3 border-meta-3/30",
    confirmed: "bg-meta-3/10 text-meta-3 border-meta-3/30",
    active:    "bg-meta-3/10 text-meta-3 border-meta-3/30",
    delivered: "bg-meta-3/10 text-meta-3 border-meta-3/30",
    pending:   "bg-warning/10 text-warning border-warning/30",
    processing:"bg-secondary/20 text-primary border-secondary/40",
    sent_to_user:"bg-secondary/20 text-primary border-secondary/40",
    failed:    "bg-danger/10 text-danger border-danger/30",
    cancelled: "bg-danger/10 text-danger border-danger/30",
    timeout:   "bg-danger/10 text-danger border-danger/30",
    expired:   "bg-danger/10 text-danger border-danger/30",
    inactive:  "bg-danger/10 text-danger border-danger/30",
    blocked:   "bg-danger/10 text-danger border-danger/30",
    reject:    "bg-danger/10 text-danger border-danger/30",
    verify:    "bg-meta-3/10 text-meta-3 border-meta-3/30",
  }
  const cls = map[status] || "bg-stroke/50 text-body border-stroke dark:border-strokedark"
  return (
    <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  )
}

/** Primary action button */
export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: "button" | "submit"
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-60"
    >
      {children}
    </button>
  )
}

/** Secondary / outline button */
export function OutlineButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-sm border border-stroke px-4 py-2 text-sm font-medium text-body hover:border-primary hover:text-primary disabled:opacity-60 dark:border-strokedark dark:text-bodydark"
    >
      {children}
    </button>
  )
}

/** Search input matching betpay style */
export function SearchInput({
  value,
  onChange,
  placeholder = "Rechercher...",
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative w-full sm:w-64">
      <svg
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bodydark2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-sm border border-stroke bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
      />
    </div>
  )
}
