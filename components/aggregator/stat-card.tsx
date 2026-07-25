"use client"

import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    description?: string
    trend?: {
        value: string
        isPositive: boolean
    }
    className?: string
    iconClassName?: string
}

export function StatCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    className,
    iconClassName,
}: StatCardProps) {
    return (
        <Card className={cn("relative overflow-hidden border-0 shadow-lg", className)}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
            <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
                    <div>
                        <p className="text-sm font-medium opacity-80 mb-1"><span>{title}</span></p>
                        <p className="text-lg font-bold sm:text-xl"><span>{value}</span></p>
                        {trend && (
                            <div className="flex items-center mt-2">
                                <span
                                    className={cn(
                                        "text-xs font-medium px-2 py-0.5 rounded-full bg-white/20",
                                        trend.isPositive ? "text-green-100" : "text-red-100"
                                    )}
                                >
                                    <span>{trend.value}</span>
                                </span>
                                {description && (
                                    <span className="text-xs ml-2 opacity-70"><span>{description}</span></span>
                                )}
                            </div>
                        )}
                        {!trend && description && (
                            <p className="text-xs mt-2 opacity-70"><span>{description}</span></p>
                        )}
                    </div>
                    <div className={cn("rounded-full p-3 bg-white/20", iconClassName)}>
                        <Icon className="h-8 w-8 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
