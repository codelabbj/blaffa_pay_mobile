"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useLanguage } from "@/components/providers/language-provider"

export interface ComboboxOption {
    value: string
    label: string
}

interface AsyncComboboxProps {
    onSearch: (searchTerm: string) => Promise<ComboboxOption[]>
    value?: string
    onValueChange: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyMessage?: string
    className?: string
    disabled?: boolean
    initialOptions?: ComboboxOption[]
    initialLabel?: string
}

export function AsyncCombobox({
    onSearch,
    value,
    onValueChange,
    placeholder = "Select option...",
    searchPlaceholder = "Search...",
    emptyMessage = "No option found.",
    className,
    disabled,
    initialOptions = [],
    initialLabel,
}: AsyncComboboxProps) {
    const { t } = useLanguage()
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [options, setOptions] = React.useState<ComboboxOption[]>(initialOptions)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [label, setLabel] = React.useState(initialLabel || "")

    // Initial load or value change label sync
    React.useEffect(() => {
        if (value && !label) {
            const found = options.find(o => o.value === value)
            if (found) setLabel(found.label)
        }
    }, [value, options, label])

    const handleSearch = React.useCallback(async (term: string) => {
        setLoading(true)
        try {
            const results = await onSearch(term)
            setOptions(results)
        } catch (error) {
            console.error("Search failed", error)
        } finally {
            setLoading(false)
        }
    }, [onSearch])

    // Debounce search
    React.useEffect(() => {
        if (!open) return

        const timer = setTimeout(() => {
            handleSearch(searchTerm)
        }, 500)

        return () => clearTimeout(timer)
    }, [searchTerm, handleSearch, open])

    // Initial fetch when opened
    React.useEffect(() => {
        if (open && options.length === 0) {
            handleSearch("")
        }
    }, [open, handleSearch, options.length])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between font-normal", className)}
                    disabled={disabled}
                >
                    <span className="truncate">
                        {label || placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                    />
                    <CommandList className="max-h-[300px] overflow-y-auto">
                        <CommandEmpty>
                            {loading ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                </div>
                            ) : (
                                emptyMessage
                            )}
                        </CommandEmpty>
                        <CommandGroup>
                            {!loading && options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={() => {
                                        onValueChange(option.value)
                                        setLabel(option.label)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
