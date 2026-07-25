
"use client"

import { useState, useEffect, useCallback } from "react"
import { useApi } from "@/lib/useApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Copy, Users, Filter, CheckCircle, XCircle, Mail, Calendar, UserCheck, DollarSign, ArrowUpDown as ArrowUpDownIcon, Clock, Settings, TrendingUp, CreditCard, Shield, Eye, Wallet, MoreHorizontal, History } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { DateRangeFilter } from "@/components/ui/date-range-filter"
import { CopyButton } from "@/components/ui/copy-button"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"




// Colors for consistent theming - using logo colors
const COLORS = {
	primary: '#194185', // Orange (primary from logo)
	secondary: '#10B981', // Bright green from logo
	accent: '#1E3A8A', // Dark blue from logo
	danger: '#EF4444',
	warning: '#F97316',
	success: '#10B981', // Using bright green for success
	info: '#1E3A8A', // Using dark blue for info
	purple: '#8B5CF6',
	pink: '#EC4899',
	indigo: '#6366F1'
};

function PartnerPageContent() {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()

	const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
	const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all")
	const [startDate, setStartDate] = useState<string | null>(searchParams.get("start_date"))
	const [endDate, setEndDate] = useState<string | null>(searchParams.get("end_date"))
	const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1)
	const [partners, setPartners] = useState<any[]>([])
	const [totalCount, setTotalCount] = useState(0)
	const [totalPages, setTotalPages] = useState(1)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")
	const [sortField, setSortField] = useState<"display_name" | "email" | "created_at" | null>((searchParams.get("sort_field") as any) || null)
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">((searchParams.get("sort_dir") as any) || "desc")
	const [momoFilter, setMomoFilter] = useState(searchParams.get("momo") || "all")
	const [mobcashFilter, setMobcashFilter] = useState(searchParams.get("mobcash") || "all")
	const [bulkFilter, setBulkFilter] = useState(searchParams.get("bulk") || "all")
	const { t } = useLanguage()
	const itemsPerPage = 20
	const baseUrl = getApiBaseUrl()
	const { toast } = useToast()
	const apiFetch = useApi();
	const [detailModalOpen, setDetailModalOpen] = useState(false)
	const [detailPartner, setDetailPartner] = useState<any | null>(null)
	const [detailLoading, setDetailLoading] = useState(false)
	const [detailError, setDetailError] = useState("")
	const [transferModalOpen, setTransferModalOpen] = useState(false)
	const [transferPartner, setTransferPartner] = useState<any | null>(null)
	const [transferLoading, setTransferLoading] = useState(false)
	const [transferError, setTransferError] = useState("")
	const [partnerTransfers, setPartnerTransfers] = useState<any[]>([])

	// Betting Commission States
	const [bettingCommissionModalOpen, setBettingCommissionModalOpen] = useState(false)
	const [bettingCommissionPartner, setBettingCommissionPartner] = useState<any | null>(null)
	const [bettingCommissionConfig, setBettingCommissionConfig] = useState<any | null>(null)
	const [bettingCommissionLoading, setBettingCommissionLoading] = useState(false)
	const [bettingCommissionError, setBettingCommissionError] = useState("")
	const [bettingCommissionForm, setBettingCommissionForm] = useState({
		deposit_commission_rate: "",
		withdrawal_commission_rate: "",
	})
	const [bettingCommissionStats, setBettingCommissionStats] = useState<any | null>(null)
	const [partnerAccountInfo, setPartnerAccountInfo] = useState<any | null>(null)
	const [bettingCommissionPaymentModalOpen, setBettingCommissionPaymentModalOpen] = useState(false)
	const [bettingCommissionPaymentForm, setBettingCommissionPaymentForm] = useState({
		admin_notes: "",
		amount: "",
	})
	const [bettingCommissionPaymentLoading, setBettingCommissionPaymentLoading] = useState(false)
	const [bettingCommissionPaymentError, setBettingCommissionPaymentError] = useState("")

	// Grant Permission States
	const [grantPermissionModalOpen, setGrantPermissionModalOpen] = useState(false)
	const [grantPermissionPartner, setGrantPermissionPartner] = useState<any | null>(null)
	const [grantPermissionLoading, setGrantPermissionLoading] = useState(false)
	const [grantPermissionError, setGrantPermissionError] = useState("")
	const [grantPermissionForm, setGrantPermissionForm] = useState({
		uid: "",
		permission_type: "ussd_transaction",
		notes: "",
	})

	// Account Transactions States
	const [accountTransactionsModalOpen, setAccountTransactionsModalOpen] = useState(false)
	const [accountTransactionsPartner, setAccountTransactionsPartner] = useState<any | null>(null)
	const [accountTransactionsLoading, setAccountTransactionsLoading] = useState(false)
	const [accountTransactionsError, setAccountTransactionsError] = useState("")
	const [accountTransactions, setAccountTransactions] = useState<any[]>([])
	const [accountTransactionsUserInfo, setAccountTransactionsUserInfo] = useState<any | null>(null)
	const [accountTransactionsCount, setAccountTransactionsCount] = useState(0)
	const [accountTransactionsCurrentPage, setAccountTransactionsCurrentPage] = useState(1)
	const [accountTransactionsNext, setAccountTransactionsNext] = useState<string | null>(null)
	const [accountTransactionsPrevious, setAccountTransactionsPrevious] = useState<string | null>(null)

	// Centralized URL update function
	const updateUrl = useCallback((newParams: Record<string, string | number | null>) => {
		const params = new URLSearchParams(searchParams.toString())
		Object.entries(newParams).forEach(([key, value]) => {
			if (value === null || value === "" || value === "all" || (key === "page" && value === 1)) {
				params.delete(key)
			} else {
				params.set(key, value.toString())
			}
		})
		router.replace(`${pathname}?${params.toString()}`, { scroll: false })
	}, [searchParams, pathname, router])

	// Custom state setters that also update the URL
	const handlePageChange = (page: number) => {
		setCurrentPage(page)
		updateUrl({ page })
	}

	const handleSearchChange = (value: string) => {
		setSearchTerm(value)
		setCurrentPage(1)
		updateUrl({ search: value, page: 1 })
	}

	const handleStatusChange = (value: string) => {
		setStatusFilter(value)
		setCurrentPage(1)
		updateUrl({ status: value, page: 1 })
	}

	const handleMomoChange = (value: string) => {
		setMomoFilter(value)
		setCurrentPage(1)
		updateUrl({ momo: value, page: 1 })
	}

	const handleMobcashChange = (value: string) => {
		setMobcashFilter(value)
		setCurrentPage(1)
		updateUrl({ mobcash: value, page: 1 })
	}

	const handleBulkChange = (value: string) => {
		setBulkFilter(value)
		setCurrentPage(1)
		updateUrl({ bulk: value, page: 1 })
	}

	const handleDateChange = (start: string | null, end: string | null) => {
		setStartDate(start)
		setEndDate(end)
		setCurrentPage(1)
		updateUrl({ start_date: start, end_date: end, page: 1 })
	}

	const handleSortChange = (field: "display_name" | "email" | "created_at") => {
		const newDir = sortField === field ? (sortDirection === "desc" ? "asc" : "desc") : "desc"
		setSortField(field)
		setSortDirection(newDir)
		setCurrentPage(1)
		updateUrl({ sort_field: field, sort_dir: newDir, page: 1 })
	}

	// Fetch partners from API (authenticated)
	const fetchPartners = useCallback(async () => {
		setLoading(true)
		setError("")
		try {
			const params = new URLSearchParams({
				page: currentPage.toString(),
				page_size: itemsPerPage.toString(),
			})
			if (searchTerm.trim() !== "") {
				params.append("search", searchTerm)
			}
			if (statusFilter !== "all") {
				params.append("is_active", statusFilter === "active" ? "true" : "false")
			}
			if (startDate) {
				params.append("created_at__gte", startDate)
			}
			if (endDate) {
				params.append("created_at__lte", endDate)
			}
			if (momoFilter !== "all") {
				params.append("can_process_momo", momoFilter === "yes" ? "true" : "false")
			}
			if (mobcashFilter !== "all") {
				params.append("can_process_mobcash", mobcashFilter === "yes" ? "true" : "false")
			}
			if (bulkFilter !== "all") {
				params.append("can_process_bulk_payment", bulkFilter === "yes" ? "true" : "false")
			}
			const orderingParam = sortField
				? `&ordering=${(sortDirection === "asc" ? "+" : "-")}${sortField}`
				: ""
			const endpoint = `auth/admin/users/partners/?${params.toString()}${orderingParam}`
			const data = await apiFetch(endpoint)
			setPartners(data.partners || [])
			setTotalCount(data.pagination?.total_count || 0)
			setTotalPages(data.pagination?.total_pages || 1)
		} catch (err: any) {
			const errorMessage = extractErrorMessages(err)
			setError(errorMessage)
			setPartners([])
			setTotalCount(0)
			setTotalPages(1)
			toast({ title: t("partners.failedToLoad"), description: errorMessage, variant: "destructive" })
		} finally {
			setLoading(false)
		}
	}, [searchTerm, currentPage, itemsPerPage, baseUrl, statusFilter, sortField, sortDirection, startDate, endDate, momoFilter, mobcashFilter, bulkFilter, t, toast, apiFetch])

	useEffect(() => {
		fetchPartners()
	}, [fetchPartners])

	const startIndex = (currentPage - 1) * itemsPerPage

	const handleSort = (field: "display_name" | "email" | "created_at") => {
		handleSortChange(field)
	}

	// Fetch partner details (authenticated)
	const handleOpenDetail = async (uid: string) => {
		setDetailModalOpen(true)
		setDetailLoading(true)
		setDetailError("")
		setDetailPartner(null)
		try {
			const endpoint = `auth/admin/users/partners/${uid}/`
			const data = await apiFetch(endpoint)
			setDetailPartner(data)
		} catch (err: any) {
			setDetailError(extractErrorMessages(err))
			toast({ title: t("partners.detailFailed"), description: extractErrorMessages(err), variant: "destructive" })
		} finally {
			setDetailLoading(false)
		}
	}

	// Fetch partner transfers (authenticated)
	const handleOpenTransfers = async (partner: any) => {
		setTransferModalOpen(true)
		setTransferLoading(true)
		setTransferError("")
		setTransferPartner(partner)
		setPartnerTransfers([])
		try {
			const endpoint = `payments/betting/admin/partner-transfers/by_partner/?partner_uid=${partner.uid}`
			const data = await apiFetch(endpoint)
			setPartnerTransfers(data.results || [])
		} catch (err: any) {
			setTransferError(extractErrorMessages(err))
			toast({ title: "Erreur", description: extractErrorMessages(err), variant: "destructive" })
		} finally {
			setTransferLoading(false)
		}
	}

	// Fetch account transactions
	const handleOpenAccountTransactions = async (partner: any, page: number = 1, useNextUrl: string | null = null, usePrevUrl: string | null = null) => {
		if (page === 1) {
			setAccountTransactionsModalOpen(true)
			setAccountTransactionsPartner(partner)
			setAccountTransactionsCurrentPage(1)
		}

		setAccountTransactionsLoading(true)
		setAccountTransactionsError("")
		setAccountTransactions([])

		try {
			let endpoint: string
			if (useNextUrl) {
				endpoint = useNextUrl
			} else if (usePrevUrl) {
				endpoint = usePrevUrl
			} else {
				// Build endpoint with page parameter
				const params = new URLSearchParams({ page: page.toString() })
				endpoint = `payments/account-transactions/${partner.uid}/?${params.toString()}`
			}

			const data = await apiFetch(endpoint, {
				showSuccessToast: false // Disable automatic toast for GET request
			})
			setAccountTransactions(data.results || [])
			setAccountTransactionsUserInfo(data.user_info || null)
			setAccountTransactionsCount(data.count || 0)
			setAccountTransactionsNext(data.next || null)
			setAccountTransactionsPrevious(data.previous || null)
			setAccountTransactionsCurrentPage(page)
		} catch (err: any) {
			setAccountTransactionsError(extractErrorMessages(err))
			toast({ title: "Erreur", description: extractErrorMessages(err), variant: "destructive" })
		} finally {
			setAccountTransactionsLoading(false)
		}
	}

	// Fetch betting commission config for partner
	const handleOpenBettingCommission = async (partner: any) => {
		setBettingCommissionModalOpen(true)
		setBettingCommissionLoading(true)
		setBettingCommissionError("")
		setBettingCommissionPartner(partner)
		setBettingCommissionConfig(null)
		setBettingCommissionStats(null)
		setPartnerAccountInfo(null)

		try {
			// Get partner commission config
			const configEndpoint = `payments/betting/admin/commission-configs/get_partner_config/?partner_uid=${partner.uid}`
			const configData = await apiFetch(configEndpoint)

			if (configData.success && configData.has_config) {
				setBettingCommissionConfig(configData.config)
				setPartnerAccountInfo(configData.account)
				setBettingCommissionForm({
					deposit_commission_rate: configData.config.deposit_commission_rate,
					withdrawal_commission_rate: configData.config.withdrawal_commission_rate,
				})
			} else {
				setBettingCommissionForm({
					deposit_commission_rate: "2.00",
					withdrawal_commission_rate: "3.00",
				})
			}

			// Store account info even if no config exists
			if (configData.success && configData.account) {
				setPartnerAccountInfo(configData.account)
			}

			// Get partner-specific stats
			const statsEndpoint = `payments/betting/admin/commissions/partner_commission_stats/?partner_uid=${partner.uid}`
			const statsData = await apiFetch(statsEndpoint)
			setBettingCommissionStats(statsData)
		} catch (err: any) {
			setBettingCommissionError(extractErrorMessages(err))
			toast({ title: "Erreur", description: extractErrorMessages(err), variant: "destructive" })
		} finally {
			setBettingCommissionLoading(false)
		}
	}

	// Save betting commission config
	const handleSaveBettingCommission = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!bettingCommissionPartner) return

		setBettingCommissionLoading(true)
		setBettingCommissionError("")

		try {
			const payload = {
				partner: bettingCommissionPartner.uid,
				deposit_commission_rate: bettingCommissionForm.deposit_commission_rate,
				withdrawal_commission_rate: bettingCommissionForm.withdrawal_commission_rate,
			}

			let endpoint, method
			if (bettingCommissionConfig) {
				// Update existing config
				endpoint = `payments/betting/admin/commission-configs/${bettingCommissionConfig.uid}/`
				method = "PATCH"
			} else {
				// Create new config
				endpoint = `payments/betting/admin/commission-configs/`
				method = "POST"
			}

			const data = await apiFetch(endpoint, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
				successMessage: "Configuration des commissions de paris sauvegardée"
			})

			setBettingCommissionConfig(data)
		} catch (err: any) {
			setBettingCommissionError(extractErrorMessages(err))
			toast({ title: "Erreur", description: extractErrorMessages(err), variant: "destructive" })
		} finally {
			setBettingCommissionLoading(false)
		}
	}

	// Pay betting commission
	const handlePayBettingCommission = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!bettingCommissionPartner) return

		setBettingCommissionPaymentLoading(true)
		setBettingCommissionPaymentError("")

		try {
			const payload = {
				partner_uid: bettingCommissionPartner.uid,
				transaction_ids: null,
				admin_notes: bettingCommissionPaymentForm.admin_notes,
				amount: bettingCommissionPaymentForm.amount ? parseFloat(bettingCommissionPaymentForm.amount) : null,
			}

			const endpoint = `payments/betting/admin/commissions/pay_commissions/`
			const data = await apiFetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
				successMessage: "Commission de paris payée avec succès"
			})

			setBettingCommissionPaymentModalOpen(false)
			setBettingCommissionPaymentForm({ admin_notes: "", amount: "" })

			// Refresh partner-specific stats
			const statsEndpoint = `payments/betting/admin/commissions/partner_commission_stats/?partner_uid=${bettingCommissionPartner.uid}`
			const statsData = await apiFetch(statsEndpoint)
			setBettingCommissionStats(statsData)
		} catch (err: any) {
			setBettingCommissionPaymentError(extractErrorMessages(err))
			toast({ title: "Erreur", description: extractErrorMessages(err), variant: "destructive" })
		} finally {
			setBettingCommissionPaymentLoading(false)
		}
	}

	// Grant partner permission
	const handleOpenGrantPermission = async (partner: any) => {
		setGrantPermissionModalOpen(true)
		setGrantPermissionPartner(partner)
		setGrantPermissionForm({
			uid: partner.uid,
			permission_type: "ussd_transaction",
			notes: "",
		})
		setGrantPermissionError("")
	}

	// Save grant permission
	const handleGrantPermission = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!grantPermissionPartner) return

		setGrantPermissionLoading(true)
		setGrantPermissionError("")

		try {
			const payload = {
				partner_uid: grantPermissionForm.uid,
				permission_type: grantPermissionForm.permission_type,
				notes: grantPermissionForm.notes,
			}

			const endpoint = `auth/admin/users/partners/${grantPermissionForm.uid}/grant_permission/`
			const data = await apiFetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
				successMessage: "Permission accordée avec succès"
			})

			setGrantPermissionModalOpen(false)
			setGrantPermissionForm({ uid: "", permission_type: "ussd_transaction", notes: "" })

			// Refresh partners list
			await fetchPartners()
		} catch (err: any) {
			setGrantPermissionError(extractErrorMessages(err))
			toast({ title: "Erreur", description: extractErrorMessages(err), variant: "destructive" })
		} finally {
			setGrantPermissionLoading(false)
		}
	}

	// Calculate summary stats
	const activePartners = partners.filter(p => p.is_active).length
	const totalCommission = partners.reduce((sum, partner) => sum + (parseFloat(partner.total_commission) || 0), 0)

	return (
		<div className="min-h-screen bg-whiten dark:bg-boxdark-2">
			<div className="w-full">

				{/* Page Header */}
				<div className="mb-4 sm:mb-6">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<h1 className="text-2xl sm:text-3xl lg:text-base font-bold sm:text-lg sm:text-2xl bg-gradient-to-r from-primary to-meta-3 bg-clip-text text-transparent">
								{t("partners.title") || "Partner Management"}
							</h1>
							<p className="text-body dark:text-bodydark mt-2 text-sm sm:text-base lg:text-lg">
								Gérer les comptes partenaires et le suivi des commissions
							</p>
						</div>
						<div className="flex items-center space-x-2 sm:gap-2 sm:gap-4">
							<div className="bg-white dark:bg-boxdark rounded-lg px-3 sm:px-4 py-2 shadow-sm">
								<div className="flex items-center space-x-2">
									<Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
									<span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-bodydark">
										{totalCount} partenaires
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Summary Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
					<Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
						<CardContent className="p-4 sm:p-3 sm:p-4 md:p-6">
							<div className="flex flex-wrap items-center gap-2 sm:gap-3">
								<div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900 rounded-lg">
									<UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-meta-3 dark:text-green-300" />
								</div>
								<div>
									<p className="text-xs sm:text-sm font-medium text-body dark:text-bodydark2">Partenaires actifs</p>
									<p className="text-xl sm:text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
										{activePartners}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
						<CardContent className="p-4 sm:p-3 sm:p-4 md:p-6">
							<div className="flex flex-wrap items-center gap-2 sm:gap-3">
								<div className="p-2 sm:p-3 bg-meta-2 dark:bg-orange-900 rounded-lg">
									<Copy className="h-5 w-5 sm:h-6 sm:w-6 text-primary dark:text-secondary" />
								</div>
								<div>
									<p className="text-xs sm:text-sm font-medium text-body dark:text-bodydark2">Commission totale</p>
									<p className="text-xl sm:text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
										XOF {totalCommission.toFixed(2)}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Filters and Search */}
				<Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
					<CardContent className="p-4 sm:p-3 sm:p-4 md:p-6">
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
							{/* Search */}
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-bodydark2" />
								<Input
									placeholder="Rechercher des partenaires..."
									value={searchTerm}
									onChange={(e) => handleSearchChange(e.target.value)}
									className="pl-10 bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
								/>
							</div>

							{/* Status Filter */}
							<Select value={statusFilter} onValueChange={handleStatusChange}>
								<SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
									<SelectValue placeholder="Filtrer par statut" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Tous les partenaires</SelectItem>
									<SelectItem value="active">Actif</SelectItem>
									<SelectItem value="inactive">Inactif</SelectItem>
								</SelectContent>
							</Select>

							{/* Sort */}
							<Select
								value={sortField || ""}
								onValueChange={(value) => handleSortChange(value as "display_name" | "email" | "created_at")}
							>
								<SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
									<SelectValue placeholder="Trier par" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="display_name">Nom</SelectItem>
									<SelectItem value="email">E-mail</SelectItem>
									<SelectItem value="created_at">Date</SelectItem>
								</SelectContent>
							</Select>

							{/* Date Range Filter */}
							<DateRangeFilter
								startDate={startDate}
								endDate={endDate}
								onStartDateChange={(start) => handleDateChange(start, endDate)}
								onEndDateChange={(end) => handleDateChange(startDate, end)}
								onClear={() => handleDateChange(null, null)}
								placeholder="Filtrer par date"
								className="col-span-1"
							/>

							{/* MoMo Filter */}
							<Select value={momoFilter} onValueChange={handleMomoChange}>
								<SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
									<SelectValue placeholder="MoMo" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">MoMo: Tous</SelectItem>
									<SelectItem value="yes">MoMo: Oui</SelectItem>
									<SelectItem value="no">MoMo: Non</SelectItem>
								</SelectContent>
							</Select>
							
							{/* Mobcash Filter */}
							<Select value={mobcashFilter} onValueChange={handleMobcashChange}>
								<SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
									<SelectValue placeholder="Mobcash" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Mobcash: Tous</SelectItem>
									<SelectItem value="yes">Mobcash: Oui</SelectItem>
									<SelectItem value="no">Mobcash: Non</SelectItem>
								</SelectContent>
							</Select>
							
							{/* Bulk Filter */}
							<Select value={bulkFilter} onValueChange={handleBulkChange}>
								<SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
									<SelectValue placeholder="Paiement en masse" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Masse: Tous</SelectItem>
									<SelectItem value="yes">Masse: Oui</SelectItem>
									<SelectItem value="no">Masse: Non</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>

				{/* Partners Table */}
				<Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
					<CardHeader className="border-b border-gray-100 dark:border-strokedark">
						<CardTitle className="flex items-center space-x-2">
							<div className="p-2 bg-meta-2 dark:bg-orange-900 rounded-lg">
								<Users className="h-5 w-5 text-primary dark:text-secondary" />
							</div>
							<span>Liste des partenaires</span>
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						{loading ? (
							<div className="flex items-center justify-center py-6 sm:py-10">
								<div className="flex flex-col items-center space-y-4">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
									<span className="text-body dark:text-bodydark">Chargement des partenaires...</span>
								</div>
							</div>
						) : error ? (
							<div className="p-3 sm:p-4 md:p-6 text-center">
								<ErrorDisplay error={error} onRetry={() => {/* retry function */ }} />
							</div>
						) : (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="bg-gray-50 dark:bg-boxdark-2/50">
											<TableHead className="font-semibold text-xs sm:text-sm">Partenaire</TableHead>
											<TableHead className="font-semibold text-xs sm:text-sm">E-mail</TableHead>
											<TableHead className="font-semibold text-xs sm:text-sm">Statut</TableHead>
											<TableHead className="font-semibold text-xs sm:text-sm">USSD</TableHead>
											<TableHead className="font-semibold text-xs sm:text-sm">Commission</TableHead>
											<TableHead className="font-semibold text-xs sm:text-sm">Solde Compte</TableHead>
											<TableHead className="font-semibold text-xs sm:text-sm">Rejoint</TableHead>
											<TableHead className="font-semibold text-xs sm:text-sm">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{partners.map((partner) => (
											<TableRow key={partner.uid} className="hover:bg-gray-50 dark:hover:bg-boxdark-2/50">
												<TableCell data-label="Partenaire">
													<div className="flex items-center space-x-2 sm:space-x-3">
														<div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-meta-3 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
															{partner.display_name?.charAt(0)?.toUpperCase() || 'P'}
														</div>
														<div>
															<div className="flex items-center space-x-2">
																<span className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">{partner.display_name || 'Partenaire inconnu'}</span>
																<CopyButton value={partner.uid} className="h-4 w-4" iconClassName="h-3 w-3" />
															</div>

															<div className="text-xs sm:text-sm text-body dark:text-bodydark2">
																{partner.phone_number || 'Aucun téléphone'}
															</div>
														</div>
													</div>
												</TableCell>
												<TableCell data-label="E-mail">
													<div className="flex items-center space-x-2">
														<Mail className="h-3 w-3 sm:h-4 sm:w-4 text-bodydark2" />
														<span className="text-xs sm:text-sm text-gray-700 dark:text-bodydark">
															{partner.email || 'Aucun e-mail'}
														</span>
													</div>
												</TableCell>
												<TableCell data-label="Statut">
													<Badge
														className={
															partner.is_active
																? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
																: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
														}
													>
														<div className="flex items-center space-x-1">
															{partner.is_active ? (
																<CheckCircle className="h-3 w-3" />
															) : (
																<XCircle className="h-3 w-3" />
															)}
															<span>{partner.is_active ? 'Actif' : 'Inactif'}</span>
														</div>
													</Badge>
												</TableCell>
												<TableCell data-label="USSD">
													<Badge
														className={
															partner.can_process_ussd_transaction
																? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
																: "bg-gray-100 text-gray-800 dark:bg-boxdark-2/20 dark:text-bodydark"
														}
													>
														<div className="flex items-center space-x-1">
															{partner.can_process_ussd_transaction ? (
																<CheckCircle className="h-3 w-3" />
															) : (
																<XCircle className="h-3 w-3" />
															)}
															<span>{partner.can_process_ussd_transaction ? 'Oui' : 'Non'}</span>
														</div>
													</Badge>
												</TableCell>
												<TableCell data-label="Commission">
													<div className="flex items-center space-x-1">
														<Copy className="h-3 w-3 sm:h-4 sm:w-4 text-bodydark2" />
														<span className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm">
															XOF {parseFloat(partner.total_commission || 0).toFixed(2)}
														</span>
													</div>
												</TableCell>
												<TableCell data-label="Solde Compte">
													<div className="flex items-center space-x-1">
														<Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-bodydark2" />
														<span className="font-medium text-meta-3 dark:text-green-400 text-xs sm:text-sm">
															XOF {parseFloat(partner.account_balance || 0).toFixed(2)}
														</span>
													</div>
												</TableCell>
												<TableCell data-label="Rejoint">
													<div className="flex items-center space-x-2">
														<Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-bodydark2" />
														<div className="flex flex-col">
															<span className="text-sm font-medium text-gray-700 dark:text-bodydark">
																{partner.created_at ? new Date(partner.created_at).toLocaleDateString() : 'Inconnu'}
															</span>
															{partner.created_at && (
																<span className="text-xs text-body dark:text-bodydark2">
																	{new Date(partner.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
																</span>
															)}
														</div>
													</div>
												</TableCell>
												<TableCell data-label="Actions">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant="outline" size="sm" className="h-8 w-8 p-0">
																<span className="sr-only">Ouvrir le menu</span>
																<MoreHorizontal className="h-4 w-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end" className="w-56">
															<DropdownMenuItem asChild>
																<Link href={`/dashboard/partner/commission/${partner.uid}`} className="flex items-center">
																	<DollarSign className="h-4 w-4 mr-2 text-meta-3" />
																	<span>Commission momo</span>
																</Link>
															</DropdownMenuItem>
															<DropdownMenuItem onClick={() => handleOpenBettingCommission(partner)}>
																<TrendingUp className="h-4 w-4 mr-2 text-primary" />
																<span>Commissions Paris</span>
															</DropdownMenuItem>
															<DropdownMenuItem onClick={() => handleOpenTransfers(partner)}>
																<ArrowUpDownIcon className="h-4 w-4 mr-2 text-blue-600" />
																<span>Transferts</span>
															</DropdownMenuItem>
															{/* <DropdownMenuItem onClick={() => handleOpenGrantPermission(partner)}>
																<Shield className="h-4 w-4 mr-2 text-purple-600" />
																<span>Accorder Permission</span>
															</DropdownMenuItem> */}
															{/* <DropdownMenuItem onClick={() => handleOpenBettingCommission(partner)}>
																<Eye className="h-4 w-4 mr-2 text-indigo-600" />
																<span>Voir Commissions</span>
															</DropdownMenuItem> */}
															<DropdownMenuItem onClick={() => {
																setBettingCommissionPartner(partner)
																setBettingCommissionPaymentForm({ admin_notes: "", amount: "" })
																setBettingCommissionPaymentModalOpen(true)
															}}>
																<Wallet className="h-4 w-4 mr-2 text-emerald-600" />
																<span>Payer Commission</span>
															</DropdownMenuItem>
															<DropdownMenuItem onClick={() => handleOpenAccountTransactions(partner)}>
																<History className="h-4 w-4 mr-2 text-indigo-600" />
																<span>Transactions Compte</span>
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="flex flex-wrap items-start justify-between gap-3 sm:items-center mt-6">
						<div className="text-sm text-body dark:text-bodydark2">
							Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, totalCount)} sur {totalCount} résultats
						</div>
						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
								disabled={currentPage === 1}
							>
								<ChevronLeft className="h-4 w-4" />
								Précédent
							</Button>
							<div className="flex items-center space-x-1">
								{(() => {
                  const pages = [];
                  for (let i = 1; i <= totalPages; i++) {
                    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
                      pages.push(i);
                    } else if (pages[pages.length - 1] !== '...') {
                      pages.push('...');
                    }
                  }
                  
                  return pages.map((page, index) => {
                    if (page === '...') {
                      return <span key={`ellipsis-${index}`} className="px-2 text-body text-sm">...</span>;
                    }
                    return (
                      <Button
                        key={`page-${page}`}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page as number)}
                        className={currentPage === page ? "bg-primary hover:bg-primary text-white border-primary" : "border-stroke dark:border-strokedark"}
                      >
                        {page}
                      </Button>
                    );
                  });
                })()}
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
								disabled={currentPage === totalPages}
							>
								Suivant
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				)}

				{/* Empty State */}
				{!loading && !error && partners.length === 0 && (
					<Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mt-6">
						<CardContent className="p-12 text-center">
							<Users className="h-12 w-12 text-bodydark2 mx-auto mb-4" />
							<h3 className="text-sm font-medium sm:text-base text-gray-900 dark:text-gray-100 mb-2">
								Aucun partenaire trouvé
							</h3>
							<p className="text-body dark:text-bodydark2 mb-4">
								{searchTerm ? `Aucun partenaire ne correspond à "${searchTerm}"` : "Aucun partenaire n'a encore été enregistré."}
							</p>
						</CardContent>
					</Card>
				)}

				{/* Detail Modal */}
				<Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle className="flex items-center space-x-2">
								<Users className="h-5 w-5 text-purple-600" />
								<span>Détails du partenaire</span>
							</DialogTitle>
						</DialogHeader>
						{detailLoading ? (
							<div className="flex items-center justify-center py-4 sm:py-6">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
							</div>
						) : detailError ? (
							<ErrorDisplay error={detailError} />
						) : detailPartner ? (
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="text-sm font-medium text-body dark:text-bodydark2">Nom</label>
										<p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
											{detailPartner.display_name || 'Inconnu'}
										</p>
									</div>
									<div>
										<label className="text-sm font-medium text-body dark:text-bodydark2">E-mail</label>
										<p className="text-sm text-gray-900 dark:text-gray-100">
											{detailPartner.email || 'Aucun e-mail'}
										</p>
									</div>
									<div>
										<label className="text-sm font-medium text-body dark:text-bodydark2">Téléphone</label>
										<p className="text-sm text-gray-900 dark:text-gray-100">
											{detailPartner.phone_number || 'Aucun téléphone'}
										</p>
									</div>
									<div>
										<label className="text-sm font-medium text-body dark:text-bodydark2">Statut</label>
										<Badge
											className={
												detailPartner.is_active
													? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
													: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
											}
										>
											{detailPartner.is_active ? 'Actif' : 'Inactif'}
										</Badge>
									</div>
									<div>
										<label className="text-sm font-medium text-body dark:text-bodydark2">Commission totale</label>
										<p className="text-lg font-semibold text-meta-3">
											XOF {parseFloat(detailPartner.total_commission || 0).toFixed(2)}
										</p>
									</div>
									<div>
										<label className="text-sm font-medium text-body dark:text-bodydark2">Rejoint</label>
										<p className="text-sm text-gray-900 dark:text-gray-100">
											{detailPartner.created_at
												? new Date(detailPartner.created_at).toLocaleString()
												: 'Inconnu'
											}
										</p>
									</div>
								</div>
							</div>
						) : null}
					</DialogContent>
				</Dialog>

				{/* Transfer Modal */}
				<Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
					<DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="flex items-center space-x-2">
								<ArrowUpDownIcon className="h-5 w-5 text-blue-600" />
								<span>Transferts de {transferPartner?.display_name || 'Partenaire'}</span>
							</DialogTitle>
						</DialogHeader>
						{transferLoading ? (
							<div className="flex items-center justify-center py-4 sm:py-6">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
							</div>
						) : transferError ? (
							<ErrorDisplay error={transferError} />
						) : (
							<div className="space-y-4">
								{partnerTransfers.length === 0 ? (
									<div className="text-center py-4 sm:py-6">
										<ArrowUpDownIcon className="h-12 w-12 text-bodydark2 mx-auto mb-4" />
										<h3 className="text-sm font-medium sm:text-base text-gray-900 dark:text-gray-100 mb-2">
											Aucun transfert trouvé
										</h3>
										<p className="text-body dark:text-bodydark2">
											Ce partenaire n'a effectué aucun transfert.
										</p>
									</div>
								) : (
									<div className="overflow-x-auto">
										<Table>
											<TableHeader>
												<TableRow className="bg-gray-50 dark:bg-boxdark-2/50">
													<TableHead className="font-semibold">Référence</TableHead>
													<TableHead className="font-semibold">Type</TableHead>
													<TableHead className="font-semibold">Contrepartie</TableHead>
													<TableHead className="font-semibold">Montant</TableHead>
													<TableHead className="font-semibold">Statut</TableHead>
													<TableHead className="font-semibold">Date</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{partnerTransfers.map((transfer) => (
													<TableRow key={transfer.uid} className="hover:bg-gray-50 dark:hover:bg-boxdark-2/50">
														<TableCell data-label="Partenaire">
															<div className="flex items-center space-x-2">
																<Copy className="h-4 w-4 text-bodydark2" />
																<span className="text-sm font-mono text-gray-700 dark:text-bodydark">
																	{transfer.reference}
																</span>
															</div>
														</TableCell>
														<TableCell data-label="E-mail">
															<Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
																{transfer.sender === transferPartner?.id ? 'Envoi' : 'Réception'}
															</Badge>
														</TableCell>
														<TableCell data-label="Statut">
															<div className="flex flex-wrap items-center gap-2 sm:gap-3">
																<div className="w-8 h-8 bg-gradient-to-br from-primary to-meta-3 rounded-full flex items-center justify-center text-white font-semibold text-xs">
																	{(transfer.sender === transferPartner?.id ? transfer.receiver_name : transfer.sender_name)?.charAt(0)?.toUpperCase() || 'U'}
																</div>
																<div>
																	<div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
																		{transfer.sender === transferPartner?.id ? transfer.receiver_name : transfer.sender_name}
																	</div>
																	<div className="text-xs text-body dark:text-bodydark2">
																		{transfer.sender === transferPartner?.id ? transfer.receiver_email : transfer.sender_email}
																	</div>
																</div>
															</div>
														</TableCell>
														<TableCell data-label="USSD">
															<div className="flex items-center space-x-1">
																<DollarSign className="h-4 w-4 text-bodydark2" />
																<span className={`font-medium ${transfer.sender === transferPartner?.id ? 'text-red-600' : 'text-meta-3'}`}>
																	{transfer.sender === transferPartner?.id ? '-' : '+'}XOF {parseFloat(transfer.amount).toFixed(2)}
																</span>
															</div>
														</TableCell>
														<TableCell data-label="Commission">
															{transfer.status === 'completed' ? (
																<Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
																	<div className="flex items-center space-x-1">
																		<CheckCircle className="h-3 w-3" />
																		<span>Terminé</span>
																	</div>
																</Badge>
															) : transfer.status === 'pending' ? (
																<Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
																	<div className="flex items-center space-x-1">
																		<Clock className="h-3 w-3" />
																		<span>En attente</span>
																	</div>
																</Badge>
															) : (
																<Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
																	<div className="flex items-center space-x-1">
																		<XCircle className="h-3 w-3" />
																		<span>Échec</span>
																	</div>
																</Badge>
															)}
														</TableCell>
														<TableCell data-label="Solde Compte">
															<div className="flex items-center space-x-2">
																<Calendar className="h-4 w-4 text-bodydark2" />
																<span className="text-sm text-body dark:text-bodydark2">
																	{transfer.created_at
																		? new Date(transfer.created_at).toLocaleDateString()
																		: 'Inconnu'
																	}
																</span>
															</div>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								)}
							</div>
						)}
					</DialogContent>
				</Dialog>

				{/* Account Transactions Modal */}
				<Dialog open={accountTransactionsModalOpen} onOpenChange={setAccountTransactionsModalOpen}>
					<DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="flex items-center space-x-2">
								<History className="h-5 w-5 text-indigo-600" />
								<span>Transactions de Compte - {accountTransactionsPartner?.display_name || 'Partenaire'}</span>
							</DialogTitle>
						</DialogHeader>
						{accountTransactionsLoading ? (
							<div className="flex items-center justify-center py-4 sm:py-6">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
							</div>
						) : accountTransactionsError ? (
							<ErrorDisplay error={accountTransactionsError} />
						) : (
							<div className="space-y-4">
								{/* User Info Card */}
								{accountTransactionsUserInfo && (
									<Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-700">
										<CardContent className="p-3 sm:p-4 md:p-6">
											<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
												<div>
													<p className="text-sm font-medium text-body dark:text-bodydark2">Nom</p>
													<p className="text-lg font-bold text-indigo-600">{accountTransactionsUserInfo.display_name || 'N/A'}</p>
												</div>
												<div>
													<p className="text-sm font-medium text-body dark:text-bodydark2">Email</p>
													<p className="text-sm text-gray-900 dark:text-gray-100">{accountTransactionsUserInfo.email || 'N/A'}</p>
												</div>
												<div>
													<p className="text-sm font-medium text-body dark:text-bodydark2">Téléphone</p>
													<p className="text-sm text-gray-900 dark:text-gray-100">{accountTransactionsUserInfo.phone || 'N/A'}</p>
												</div>
												<div>
													<p className="text-sm font-medium text-body dark:text-bodydark2">Solde Actuel</p>
													<p className="text-lg font-bold text-meta-3">{parseFloat(accountTransactionsUserInfo.current_balance || 0).toFixed(2)} FCFA</p>
												</div>
											</div>
										</CardContent>
									</Card>
								)}

								{accountTransactions.length === 0 ? (
									<div className="text-center py-4 sm:py-6">
										<History className="h-12 w-12 text-bodydark2 mx-auto mb-4" />
										<h3 className="text-sm font-medium sm:text-base text-gray-900 dark:text-gray-100 mb-2">
											Aucune transaction trouvée
										</h3>
										<p className="text-body dark:text-bodydark2">
											Ce compte n'a effectué aucune transaction.
										</p>
									</div>
								) : (
									<>
										<div className="flex flex-wrap items-start justify-between gap-3 sm:items-center mb-4">
											<p className="text-sm text-body dark:text-bodydark2">
												Total: {accountTransactionsCount} transactions
											</p>
										</div>
										<div className="overflow-x-auto">
											<Table>
												<TableHeader>
													<TableRow className="bg-gray-50 dark:bg-boxdark-2/50">
														<TableHead className="font-semibold">Type</TableHead>
														<TableHead className="font-semibold">Référence</TableHead>
														<TableHead className="font-semibold">Montant</TableHead>
														<TableHead className="font-semibold">Solde Avant</TableHead>
													<TableHead className="font-semibold">Solde Après</TableHead>
													<TableHead className="font-semibold">Description</TableHead>
													<TableHead className="font-semibold">Référence Associée</TableHead>
													<TableHead className="font-semibold">Date</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{accountTransactions.map((transaction) => (
													<TableRow key={transaction.uid} className="hover:bg-gray-50 dark:hover:bg-boxdark-2/50">
														<TableCell data-label="Partenaire">
															<Badge className={transaction.is_credit
																	? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
																	: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
																}>
																	{transaction.type_display}
																</Badge>
															</TableCell>
															<TableCell data-label="E-mail">
																<div className="flex items-center space-x-2">
																	<Copy className="h-4 w-4 text-bodydark2" />
																	<span className="text-sm font-mono text-gray-700 dark:text-bodydark">
																		{transaction.reference}
																	</span>
																</div>
															</TableCell>
															<TableCell data-label="Statut">
																<div className="flex items-center space-x-1">
																	<DollarSign className={`h-4 w-4 ${transaction.is_credit ? 'text-meta-3' : 'text-red-600'}`} />
																	<span className={`font-medium ${transaction.is_credit ? 'text-meta-3' : 'text-red-600'}`}>
																		{transaction.formatted_amount || `${transaction.is_credit ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)} FCFA`}
																	</span>
																</div>
															</TableCell>
															<TableCell data-label="USSD">
																<span className="text-sm text-body dark:text-bodydark2">
																	{parseFloat(transaction.balance_before).toFixed(2)} FCFA
																</span>
															</TableCell>
															<TableCell data-label="Commission">
																<span className="text-sm text-body dark:text-bodydark2">
																	{parseFloat(transaction.balance_after).toFixed(2)} FCFA
																</span>
															</TableCell>
															<TableCell data-label="Solde Compte">
																<span className="text-sm text-gray-700 dark:text-bodydark">
																	{transaction.description}
																</span>
															</TableCell>
															<TableCell data-label="Rejoint">
																{transaction.related_payment_reference ? (
																	<div className="flex items-center space-x-2">
																		<Copy className="h-3 w-3 text-bodydark2" />
																		<span className="text-xs font-mono text-body dark:text-bodydark2">
																			{transaction.related_payment_reference}
																		</span>
																	</div>
																) : (
																	<span className="text-xs text-bodydark2">N/A</span>
																)}
															</TableCell>
															<TableCell data-label="Actions">
																<div className="flex items-center space-x-2">
																	<Calendar className="h-4 w-4 text-bodydark2" />
																	<span className="text-sm text-body dark:text-bodydark2">
																		{transaction.created_at
																			? new Date(transaction.created_at).toLocaleString()
																			: 'Inconnu'
																		}
																	</span>
																</div>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</div>

										{/* Pagination */}
										{(accountTransactionsNext || accountTransactionsPrevious) && (
											<div className="flex flex-wrap items-start justify-between gap-3 sm:items-center pt-4 border-t border-stroke dark:border-strokedark">
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														if (accountTransactionsPrevious) {
															const prevPage = accountTransactionsCurrentPage - 1
															handleOpenAccountTransactions(accountTransactionsPartner!, prevPage, null, accountTransactionsPrevious)
														}
													}}
													disabled={!accountTransactionsPrevious || accountTransactionsLoading}
												>
													<ChevronLeft className="h-4 w-4 mr-1" />
													Précédent
												</Button>
												<div className="text-sm text-body dark:text-bodydark2">
													Page {accountTransactionsCurrentPage} ({accountTransactionsCount} total)
												</div>
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														if (accountTransactionsNext) {
															const nextPage = accountTransactionsCurrentPage + 1
															handleOpenAccountTransactions(accountTransactionsPartner!, nextPage, accountTransactionsNext, null)
														}
													}}
													disabled={!accountTransactionsNext || accountTransactionsLoading}
												>
													Suivant
													<ChevronRight className="h-4 w-4 ml-1" />
												</Button>
											</div>
										)}
									</>
								)}
							</div>
						)}
					</DialogContent>
				</Dialog>

				{/* Betting Commission Modal */}
				<Dialog open={bettingCommissionModalOpen} onOpenChange={setBettingCommissionModalOpen}>
					<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="flex items-center space-x-2">
								<TrendingUp className="h-5 w-5 text-primary" />
								<span>Commissions de Paris - {bettingCommissionPartner?.display_name || 'Partenaire'}</span>
							</DialogTitle>
						</DialogHeader>
						{bettingCommissionLoading ? (
							<div className="flex items-center justify-center py-4 sm:py-6">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
							</div>
						) : bettingCommissionError ? (
							<ErrorDisplay error={bettingCommissionError} />
						) : (
							<div className="space-y-6">
								{/* Partner Balance */}
								{partnerAccountInfo && (
									<Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
										<CardContent className="p-3 sm:p-4 md:p-6">
											<div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
												<div className="flex flex-wrap items-center gap-2 sm:gap-3">
													<div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
														<Wallet className="h-6 w-6 text-meta-3" />
													</div>
													<div>
														<p className="text-sm font-medium text-body dark:text-bodydark2">Solde du Compte</p>
														<p className="text-lg font-bold sm:text-xl text-meta-3">{partnerAccountInfo.formatted_balance}</p>
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								)}

								{/* Global Stats */}
								{bettingCommissionStats && bettingCommissionStats.commissions && (
									<div className="space-y-4">
										{/* First Row - Main Stats */}
										<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
											<Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
												<CardContent className="p-4">
													<div className="flex items-center space-x-2">
														<DollarSign className="h-5 w-5 text-blue-600" />
														<div>
															<p className="text-sm font-medium text-blue-800 dark:text-blue-300">Total Transactions</p>
															<p className="text-lg font-bold text-blue-600">{bettingCommissionStats.commissions.total_transaction_count}</p>
														</div>
													</div>
												</CardContent>
											</Card>
											<Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
												<CardContent className="p-4">
													<div className="flex items-center space-x-2">
														<TrendingUp className="h-5 w-5 text-meta-3" />
														<div>
															<p className="text-sm font-medium text-green-800 dark:text-green-300">Total Gagné</p>
															<p className="text-lg font-bold text-meta-3">XOF {parseFloat(bettingCommissionStats.commissions.total_earned || 0).toFixed(2)}</p>
														</div>
													</div>
												</CardContent>
											</Card>
											<Card className="bg-gray dark:bg-orange-900/20 border-stroke dark:border-orange-700">
												<CardContent className="p-4">
													<div className="flex items-center space-x-2">
														<CheckCircle className="h-5 w-5 text-primary" />
														<div>
															<p className="text-sm font-medium text-orange-800 dark:text-secondary">Commission Payée</p>
															<p className="text-lg font-bold text-primary">XOF {parseFloat(bettingCommissionStats.commissions.total_paid || 0).toFixed(2)}</p>
														</div>
													</div>
												</CardContent>
											</Card>
											<Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
												<CardContent className="p-4">
													<div className="flex items-center space-x-2">
														<Clock className="h-5 w-5 text-red-600" />
														<div>
															<p className="text-sm font-medium text-red-800 dark:text-red-300">Commission Impayée</p>
															<p className="text-lg font-bold text-red-600">XOF {parseFloat(bettingCommissionStats.commissions.total_unpaid || 0).toFixed(2)}</p>
														</div>
													</div>
												</CardContent>
											</Card>
										</div>

										{/* Second Row - Additional Stats */}
										<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
											<Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700">
												<CardContent className="p-4">
													<div className="flex items-center space-x-2">
														<CreditCard className="h-5 w-5 text-purple-600" />
														<div>
															<p className="text-sm font-medium text-purple-800 dark:text-purple-300">Commission Payable</p>
															<p className="text-lg font-bold text-purple-600">XOF {parseFloat(bettingCommissionStats.commissions.payable || 0).toFixed(2)}</p>
														</div>
													</div>
												</CardContent>
											</Card>
											<Card className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700">
												<CardContent className="p-4">
													<div className="flex items-center space-x-2">
														<Users className="h-5 w-5 text-indigo-600" />
														<div>
															<p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Transactions Payables</p>
															<p className="text-lg font-bold text-indigo-600">{bettingCommissionStats.commissions.payable_count}</p>
														</div>
													</div>
												</CardContent>
											</Card>
											<Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700">
												<CardContent className="p-4">
													<div className="flex items-center space-x-2">
														<Calendar className="h-5 w-5 text-emerald-600" />
														<div>
															<p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Commission Mois Actuel</p>
															<p className="text-lg font-bold text-emerald-600">XOF {parseFloat(bettingCommissionStats.commissions.current_month || 0).toFixed(2)}</p>
														</div>
													</div>
												</CardContent>
											</Card>
											<Card className="bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700">
												<CardContent className="p-4">
													<div className="flex items-center space-x-2">
														<TrendingUp className="h-5 w-5 text-teal-600" />
														<div>
															<p className="text-sm font-medium text-teal-800 dark:text-teal-300">Transactions Mois Actuel</p>
															<p className="text-lg font-bold text-teal-600">{bettingCommissionStats.commissions.current_month_count}</p>
														</div>
													</div>
												</CardContent>
											</Card>
										</div>
									</div>
								)}

								{/* Commission Configuration Form */}
								<Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
									<CardHeader>
										<CardTitle className="flex items-center space-x-2">
											<Settings className="h-5 w-5 text-primary" />
											<span>Configuration des Commissions</span>
										</CardTitle>
									</CardHeader>
									<CardContent>
										<form onSubmit={handleSaveBettingCommission} className="space-y-4">
											{bettingCommissionError && (
												<div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
													<ErrorDisplay error={bettingCommissionError} />
												</div>
											)}

											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<Label htmlFor="deposit_commission_rate">Taux de Commission Dépôt (%)</Label>
													<Input
														id="deposit_commission_rate"
														type="number"
														step="0.01"
														min="0"
														max="100"
														value={bettingCommissionForm.deposit_commission_rate}
														onChange={(e) => setBettingCommissionForm(prev => ({ ...prev, deposit_commission_rate: e.target.value }))}
														className="mt-1"
														required
													/>
												</div>
												<div>
													<Label htmlFor="withdrawal_commission_rate">Taux de Commission Retrait (%)</Label>
													<Input
														id="withdrawal_commission_rate"
														type="number"
														step="0.01"
														min="0"
														max="100"
														value={bettingCommissionForm.withdrawal_commission_rate}
														onChange={(e) => setBettingCommissionForm(prev => ({ ...prev, withdrawal_commission_rate: e.target.value }))}
														className="mt-1"
														required
													/>
												</div>
											</div>

											<div className="flex items-center gap-2 sm:gap-4 pt-4 border-t border-stroke dark:border-strokedark">
												<Button
													type="submit"
													disabled={bettingCommissionLoading}
													className="bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white"
												>
													{bettingCommissionLoading ? (
														<>
															<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
															Sauvegarde...
														</>
													) : (
														<>
															<Settings className="h-4 w-4 mr-2" />
															{bettingCommissionConfig ? 'Mettre à jour' : 'Créer'} Configuration
														</>
													)}
												</Button>
												<Button
													type="button"
													variant="outline"
													onClick={() => {
														setBettingCommissionPaymentForm({ admin_notes: "", amount: "" })
														setBettingCommissionPaymentModalOpen(true)
													}}
													disabled={bettingCommissionLoading}
													className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-900/30"
												>
													<CreditCard className="h-4 w-4 mr-2" />
													Payer Commission
												</Button>
											</div>
										</form>
									</CardContent>
								</Card>

								{/* Current Configuration Display */}
								{bettingCommissionConfig && (
									<Card className="bg-gray-50 dark:bg-meta-4 border-0 shadow-lg">
										<CardHeader>
											<CardTitle className="flex items-center space-x-2">
												<CheckCircle className="h-5 w-5 text-meta-3" />
												<span>Configuration Actuelle</span>
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<span className="text-sm font-medium text-body dark:text-bodydark2">Taux de Commission Dépôt:</span>
													<p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
														{bettingCommissionConfig.deposit_commission_rate}%
													</p>
												</div>
												<div>
													<span className="text-sm font-medium text-body dark:text-bodydark2">Taux de Commission Retrait:</span>
													<p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
														{bettingCommissionConfig.withdrawal_commission_rate}%
													</p>
												</div>
												<div>
													<span className="text-sm font-medium text-body dark:text-bodydark2">Mis à jour par:</span>
													<p className="text-sm text-gray-900 dark:text-gray-100">
														{bettingCommissionConfig.updated_by_name}
													</p>
												</div>
												<div>
													<span className="text-sm font-medium text-body dark:text-bodydark2">Dernière mise à jour:</span>
													<p className="text-sm text-gray-900 dark:text-gray-100">
														{bettingCommissionConfig.updated_at
															? new Date(bettingCommissionConfig.updated_at).toLocaleString()
															: 'Non disponible'
														}
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
								)}
							</div>
						)}
					</DialogContent>
				</Dialog>

				{/* Betting Commission Payment Modal */}
				<Dialog open={bettingCommissionPaymentModalOpen} onOpenChange={setBettingCommissionPaymentModalOpen}>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle className="flex items-center space-x-2">
								<CreditCard className="h-5 w-5 text-meta-3" />
								<span>Payer Commission de Paris</span>
							</DialogTitle>
						</DialogHeader>
						<form onSubmit={handlePayBettingCommission} className="space-y-6">
							{bettingCommissionPaymentError && (
								<div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
									<ErrorDisplay error={bettingCommissionPaymentError} />
								</div>
							)}

							<div className="bg-gray dark:bg-orange-900/20 p-4 rounded-lg">
								<h3 className="font-medium text-orange-800 dark:text-secondary mb-2">
									Partennaire: {bettingCommissionPartner?.display_name}
								</h3>
								<p className="text-sm text-orange-700 dark:text-primary">
									Cette action va payer toutes les commissions impayées pour ce partenaire.
								</p>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<Label htmlFor="amount">Montant (Optionnel)</Label>
									<Input
										id="amount"
										type="number"
										step="0.01"
										placeholder="Laisser vide pour tout payer"
										value={bettingCommissionPaymentForm.amount}
										onChange={(e) => setBettingCommissionPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
										className="mt-1"
									/>
									<p className="text-xs text-body mt-1">Si vide, tout le solde impayé sera payé.</p>
								</div>
								<div>
									<Label htmlFor="admin_notes">Notes Administrateur</Label>
									<Textarea
										id="admin_notes"
										placeholder="Ajouter des notes pour ce paiement..."
										value={bettingCommissionPaymentForm.admin_notes}
										onChange={(e) => setBettingCommissionPaymentForm(prev => ({ ...prev, admin_notes: e.target.value }))}
										className="mt-1"
										rows={3}
									/>
								</div>
							</div>

							<div className="flex items-center gap-2 sm:gap-4 pt-6 border-t border-stroke dark:border-strokedark">
								<Button
									type="submit"
									disabled={bettingCommissionPaymentLoading}
									className="bg-gradient-to-r from-meta-3 to-meta-3 hover:from-meta-3 hover:to-green-700 text-white"
								>
									{bettingCommissionPaymentLoading ? (
										<>
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
											Paiement...
										</>
									) : (
										<>
											<CreditCard className="h-4 w-4 mr-2" />
											Payer Commission
										</>
									)}
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => setBettingCommissionPaymentModalOpen(false)}
									disabled={bettingCommissionPaymentLoading}
								>
									Annuler
								</Button>
							</div>
						</form>
					</DialogContent>
				</Dialog>

				{/* Grant Permission Modal */}
				<Dialog open={grantPermissionModalOpen} onOpenChange={setGrantPermissionModalOpen}>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle className="flex items-center space-x-2">
								<Shield className="h-5 w-5 text-purple-600" />
								<span>Accorder Permission au Partenaire</span>
							</DialogTitle>
						</DialogHeader>
						<form onSubmit={handleGrantPermission} className="space-y-6">
							{grantPermissionError && (
								<div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
									<ErrorDisplay error={grantPermissionError} />
								</div>
							)}

							<div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
								<h3 className="font-medium text-purple-800 dark:text-purple-300 mb-2">
									Partennaire: {grantPermissionPartner?.display_name}
								</h3>
								<p className="text-sm text-purple-700 dark:text-purple-400">
									Accorder des permissions supplémentaires à ce partenaire.
								</p>
							</div>

							<div>
								<Label htmlFor="uid">UID du Partenaire</Label>
								<Input
									id="uid"
									type="text"
									value={grantPermissionForm.uid}
									onChange={(e) => setGrantPermissionForm(prev => ({ ...prev, uid: e.target.value }))}
									className="mt-1"
									required
									placeholder="UID du partenaire"
								/>
							</div>

							<div>
								<Label htmlFor="permission_type">Type de Permission</Label>
								<Select
									value={grantPermissionForm.permission_type}
									onValueChange={(value) => setGrantPermissionForm(prev => ({ ...prev, permission_type: value }))}
								>
									<SelectTrigger className="mt-1">
										<SelectValue placeholder="Sélectionner le type de permission" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="ussd_transaction">Transaction USSD</SelectItem>
										<SelectItem value="betting_transaction">Transaction de Paris</SelectItem>
										<SelectItem value="admin_access">Accès Administrateur</SelectItem>
										<SelectItem value="commission_management">Gestion des Commissions</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label htmlFor="notes">Notes</Label>
								<Textarea
									id="notes"
									placeholder="Ajouter des notes pour cette permission..."
									value={grantPermissionForm.notes}
									onChange={(e) => setGrantPermissionForm(prev => ({ ...prev, notes: e.target.value }))}
									className="mt-1"
									rows={3}
								/>
							</div>

							<div className="flex items-center gap-2 sm:gap-4 pt-6 border-t border-stroke dark:border-strokedark">
								<Button
									type="submit"
									disabled={grantPermissionLoading}
									className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
								>
									{grantPermissionLoading ? (
										<>
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
											Accord...
										</>
									) : (
										<>
											<Shield className="h-4 w-4 mr-2" />
											Accorder Permission
										</>
									)}
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => setGrantPermissionModalOpen(false)}
									disabled={grantPermissionLoading}
								>
									Annuler
								</Button>
							</div>
						</form>
					</DialogContent>
				</Dialog>

			</div>
		</div>
	)
}


import { Suspense } from 'react'
import { getApiBaseUrl } from "@/lib/env-config"

export default function PartnerPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <PartnerPageContent />
    </Suspense>
  )
}
