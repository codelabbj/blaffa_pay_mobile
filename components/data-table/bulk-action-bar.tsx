"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { ReactNode } from "react"

export function BulkActionBar({
  count,
  onClear,
  children,
  loading,
}: {
  count: number
  onClear: () => void
  children: ReactNode
  loading?: boolean
}) {
  if (count <= 0) return null
  return (
    <Card className="border-orange-300 bg-gray/80 dark:bg-orange-900/20 dark:border-orange-700 shadow-md">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {count} élément{count > 1 ? "s" : ""} sélectionné{count > 1 ? "s" : ""}
        </p>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          {children}
          <Button size="sm" variant="ghost" onClick={onClear} disabled={loading}>
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
