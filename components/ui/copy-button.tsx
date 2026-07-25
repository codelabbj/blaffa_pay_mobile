"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface CopyButtonProps {
    value: string
    className?: string
    iconClassName?: string
}

export function CopyButton({ value, className, iconClassName }: CopyButtonProps) {
    const [copied, setCopied] = useState(false)
    const { toast } = useToast()

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            toast({
                title: "Copié !",
                description: "La valeur a été copiée dans le presse-papiers.",
            })
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            toast({
                title: "Erreur",
                description: "Impossible de copier dans le presse-papiers.",
                variant: "destructive",
            })
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7", className)}
            onClick={handleCopy}
            title="Copier"
        >
            {copied ? (
                <Check className={cn("h-3.5 w-3.5 text-meta-3", iconClassName)} />
            ) : (
                <Copy className={cn("h-3.5 w-3.5", iconClassName)} />
            )}
            <span className="sr-only">Copier</span>
        </Button>
    )
}
