
"use client"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

import { useState, useEffect , useCallback} from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Copy, DollarSign, TrendingUp, Users, Calendar, Filter, CheckCircle, XCircle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { useApi } from "@/lib/useApi"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangeFilter } from "@/components/ui/date-range-filter"




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

function EarningManagementPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateUrl({ page })
  }

	const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
	const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all")
	const [startDate, setStartDate] = useState<string | null>(null)
	const [endDate, setEndDate] = useState<string | null>(null)
	const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1)
	const [earnings, setEarnings] = useState<any[]>([])
	const [totalCount, setTotalCount] = useState(0)
	const [totalPages, setTotalPages] = useState(1)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")
	const [sortField, setSortField] = useState<"amount" | "created_at" | "status" | null>(null)
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
	const { t } = useLanguage()
	const itemsPerPage = 10
	const baseUrl = getApiBaseUrl()
	const { toast } = useToast()
	const apiFetch = useApi();
	const [detailModalOpen, setDetailModalOpen] = useState(false)
	const [detailEarning, setDetailEarning] = useState<any | null>(null)
	const [detailLoading, setDetailLoading] = useState(false)
	const [detailError, setDetailError] = useState("")

	// Fetch earnings from API
	useEffect(() => {
		const fetchEarnings = async () => {
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
					params.append("status", statusFilter)
				}
				if (startDate) {
					params.append("created_at__gte", startDate)
				}
				if (endDate) {
					params.append("created_at__lte", endDate)
				}
				const orderingParam = sortField
					? `&ordering=${(sortDirection === "asc" ? "+" : "-")}${sortField}`
					: ""
				const endpoint = `payments/admin/commission-payments/?${params.toString()}${orderingParam}`
				const data = await apiFetch(endpoint)
				setEarnings(data.results || [])
				setTotalCount(data.count || 0)
				setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))
			} catch (err: any) {
				const errorMessage = extractErrorMessages(err)
				setError(errorMessage)
				setEarnings([])
				setTotalCount(0)
				setTotalPages(1)
				toast({ title: t("earning.failedToLoad"), description: errorMessage, variant: "destructive" })
			} finally {
				setLoading(false)
			}
		}
		fetchEarnings()
	}, [searchTerm, currentPage, itemsPerPage, baseUrl, statusFilter, sortField, sortDirection, startDate, endDate, t, toast, apiFetch])

	const startIndex = (currentPage - 1) * itemsPerPage

	const handleSort = (field: "amount" | "created_at" | "status") => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc")
		} else {
			setSortField(field)
			setSortDirection("desc")
		}
	}

	// Fetch earning details
	const handleOpenDetail = async (uid: string) => {
		setDetailModalOpen(true)
		setDetailLoading(true)
		setDetailError("")
		setDetailEarning(null)
		try {
			// For demo, just find in earnings
			const found = earnings.find((e) => e.uid === uid)
			setDetailEarning(found)
		} catch (err: any) {
			setDetailError(extractErrorMessages(err))
			toast({ title: t("earning.detailFailed"), description: extractErrorMessages(err), variant: "destructive" })
		} finally {
			setDetailLoading(false)
		}
	}

	// Calculate summary stats
	const totalEarnings = earnings.reduce((sum, earning) => sum + (parseFloat(earning.amount) || 0), 0)
	const pendingEarnings = earnings.filter(e => e.status === 'pending').reduce((sum, earning) => sum + (parseFloat(earning.amount) || 0), 0)
	const completedEarnings = earnings.filter(e => e.status === 'completed').reduce((sum, earning) => sum + (parseFloat(earning.amount) || 0), 0)

	return (
		<div className="min-h-screen bg-whiten dark:bg-boxdark-2">
			<div className="w-full">

				{/* Page Header */}
				<div className="mb-4 sm:mb-6">
					<div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
						<div>
							<h1 className="text-base font-bold sm:text-lg sm:text-2xl bg-gradient-to-r from-primary to-meta-3 bg-clip-text text-transparent">
								<span>{t("earning.title") || "Earning Management"}</span>
							</h1>
							<p className="text-body dark:text-bodydark mt-2 text-lg">
								<span>Surveiller et gérer les paiements de commission</span>
							</p>
						</div>
						<div className="flex items-center gap-2 sm:gap-4">
							<div className="bg-white dark:bg-boxdark rounded-lg px-4 py-2 shadow-sm">
								<div className="flex items-center space-x-2">
									<DollarSign className="h-5 w-5 text-meta-3" />
									<span className="text-sm font-medium text-gray-700 dark:text-bodydark">
										<span>{totalCount} paiements</span>
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Summary Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
					<Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
						<CardContent className="p-3 sm:p-4 md:p-6">
							<div className="flex flex-wrap items-center gap-2 sm:gap-3">
								<div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
									<TrendingUp className="h-6 w-6 text-meta-3 dark:text-green-300" />
								</div>
								<div>
									<p className="text-sm font-medium text-body dark:text-bodydark2"><span>Gains totaux</span></p>
									<p className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
										<span>{totalEarnings.toFixed(2)} FCFA</span>
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
						<CardContent className="p-3 sm:p-4 md:p-6">
							<div className="flex flex-wrap items-center gap-2 sm:gap-3">
								<div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
									<Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
								</div>
								<div>
									<p className="text-sm font-medium text-body dark:text-bodydark2"><span>En attente</span></p>
									<p className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
										<span>{pendingEarnings.toFixed(2)} FCFA</span>
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
						<CardContent className="p-3 sm:p-4 md:p-6">
							<div className="flex flex-wrap items-center gap-2 sm:gap-3">
								<div className="p-3 bg-meta-2 dark:bg-orange-900 rounded-lg">
									<CheckCircle className="h-6 w-6 text-primary dark:text-secondary" />
								</div>
								<div>
									<p className="text-sm font-medium text-body dark:text-bodydark2"><span>Terminé</span></p>
									<p className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
										<span>{completedEarnings.toFixed(2)} FCFA</span>
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Filters and Search */}
				<Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
					<CardContent className="p-3 sm:p-4 md:p-6">
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
							{/* Search */}
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-bodydark2" />
								<Input
									placeholder="Rechercher des gains..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10 bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
								/>
							</div>

							{/* Status Filter */}
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
									<SelectValue placeholder="Filtrer par statut" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Tous les statuts</SelectItem>
									<SelectItem value="pending">En attente</SelectItem>
									<SelectItem value="completed">Terminé</SelectItem>
									<SelectItem value="failed">Échec</SelectItem>
								</SelectContent>
							</Select>

							{/* Sort */}
							<Select
								value={sortField || ""}
								onValueChange={(value) => setSortField(value as "amount" | "created_at" | "status" | null)}
							>
								<SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
									<SelectValue placeholder="Trier par" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="amount">Montant</SelectItem>
									<SelectItem value="created_at">Date</SelectItem>
									<SelectItem value="status">Statut</SelectItem>
								</SelectContent>
							</Select>

							{/* Date Range Filter */}
							<DateRangeFilter
								startDate={startDate}
								endDate={endDate}
								onStartDateChange={setStartDate}
								onEndDateChange={setEndDate}
								onClear={() => {
									setStartDate(null)
									setEndDate(null)
								}}
								placeholder="Filtrer par date"
								className="col-span-1"
							/>
						</div>
					</CardContent>
				</Card>

				{/* Earnings Table */}
				<Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
					<CardHeader className="border-b border-gray-100 dark:border-strokedark">
						<CardTitle className="flex items-center space-x-2">
							<div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
								<DollarSign className="h-5 w-5 text-meta-3 dark:text-green-300" />
							</div>
							<span><span>Liste des gains</span></span>
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						{loading ? (
							<div className="flex items-center justify-center py-6 sm:py-10">
								<div className="flex flex-col items-center space-y-4">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
									<span className="text-body dark:text-bodydark"><span>Chargement des gains...</span></span>
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
											<TableHead className="font-semibold"><span>Utilisateur</span></TableHead>
											<TableHead className="font-semibold"><span>Montant</span></TableHead>
											<TableHead className="font-semibold"><span>Statut</span></TableHead>
											<TableHead className="font-semibold"><span>Date</span></TableHead>
											<TableHead className="font-semibold"><span>Actions</span></TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{earnings.map((earning) => (
											<TableRow key={earning.uid} className="hover:bg-gray-50 dark:hover:bg-boxdark-2/50">
												<TableCell data-label="Utilisateur">
													<div className="flex flex-wrap items-center gap-2 sm:gap-3">
														<div className="w-10 h-10 bg-gradient-to-br from-primary to-meta-3 rounded-full flex items-center justify-center text-white font-semibold">
															{earning.user_name?.charAt(0)?.toUpperCase() || 'U'}
														</div>
														<div>
															<div className="font-medium text-gray-900 dark:text-gray-100">
																<span>{earning.user_name || 'Utilisateur inconnu'}</span>
															</div>
															<div className="text-sm text-body dark:text-bodydark2">
																<span>{earning.user_id || earning.uid}</span>
															</div>
														</div>
													</div>
												</TableCell>
												<TableCell data-label="Montant">
													<div className="flex items-center space-x-1">
														{/* <DollarSign className="h-4 w-4 text-bodydark2" /> */}
														<span className="font-medium text-gray-900 dark:text-gray-100">
															<span>{parseFloat(earning.amount).toFixed(2)} FCFA</span>
														</span>
													</div>
												</TableCell>
												<TableCell data-label="Statut">
													<Badge
														className={
															earning.status === 'completed'
																? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
																: earning.status === 'pending'
																	? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
																	: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
														}
													>
														<div className="flex items-center space-x-1">
															{earning.status === 'completed' ? (
																<CheckCircle className="h-3 w-3" />
															) : earning.status === 'pending' ? (
																<Clock className="h-3 w-3" />
															) : (
																<XCircle className="h-3 w-3" />
															)}
															<span>{earning.status}</span>
														</div>
													</Badge>
												</TableCell>
												<TableCell data-label="Date">
													<div className="text-sm text-body dark:text-bodydark2">
														<span>{earning.created_at
															? new Date(earning.created_at).toLocaleString()
															: 'Inconnu'
														}</span>
													</div>
												</TableCell>
												<TableCell data-label="Actions">
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleOpenDetail(earning.uid)}
													>
														<span>Voir les détails</span>
													</Button>
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
							<span>Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, totalCount)} sur {totalCount} résultats</span>
						</div>
						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
								disabled={currentPage === 1}
							>
								<ChevronLeft className="h-4 w-4" />
								<span>Précédent</span>
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
								<span>Suivant</span>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				)}

				{/* Empty State */}
				{!loading && !error && earnings.length === 0 && (
					<Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mt-6">
						<CardContent className="p-12 text-center">
							<DollarSign className="h-12 w-12 text-bodydark2 mx-auto mb-4" />
							<h3 className="text-sm font-medium sm:text-base text-gray-900 dark:text-gray-100 mb-2">
								<span>Aucun gain trouvé</span>
							</h3>
							<p className="text-body dark:text-bodydark2 mb-4">
								<span>{searchTerm ? `Aucun gain ne correspond à "${searchTerm}"` : "Aucun gain n'a encore été enregistré."}</span>
							</p>
						</CardContent>
					</Card>
				)}

				{/* Detail Modal */}
				<Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle className="flex items-center space-x-2">
								<DollarSign className="h-5 w-5 text-meta-3" />
								<span><span>Détails du gain</span></span>
							</DialogTitle>
						</DialogHeader>
						{detailLoading ? (
							<div className="flex items-center justify-center py-4 sm:py-6">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
							</div>
						) : detailError ? (
							<ErrorDisplay error={detailError} />
						) : detailEarning ? (
							<div className="space-y-6">
								{/* Basic Information */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="text-sm font-medium text-body dark:text-bodydark2">UID</label>
										<div className="flex items-center space-x-2 bg-gray-100 dark:bg-meta-4 p-2 rounded">
											<p className="text-sm font-mono text-gray-900 dark:text-gray-100 flex-1">
												{detailEarning.uid || 'Non disponible'}
											</p>
											{detailEarning.uid && (
												<Button
													variant="ghost"
													size="sm"
													className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
													onClick={() => {
														navigator.clipboard.writeText(detailEarning.uid);
														toast({
															title: "Copié",
															description: "UID copié dans le presse-papiers",
														});
													}}
												>
													<Copy className="h-3 w-3" />
												</Button>
											)}
										</div>
									</div>
									<div>
										<label className="text-sm font-medium text-body dark:text-bodydark2">Référence</label>
										<div className="flex items-center space-x-2 bg-gray-100 dark:bg-meta-4 p-2 rounded">
											<p className="text-sm font-mono text-gray-900 dark:text-gray-100 flex-1">
												{detailEarning.reference || 'Non disponible'}
											</p>
											{detailEarning.reference && (
												<Button
													variant="ghost"
													size="sm"
													className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
													onClick={() => {
														navigator.clipboard.writeText(detailEarning.reference);
														toast({
															title: "Copié",
															description: "Référence copiée dans le presse-papiers",
														});
													}}
												>
													<Copy className="h-3 w-3" />
												</Button>
											)}
										</div>
									</div>
								</div>

								{/* Amount Information */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="text-sm font-medium text-body dark:text-bodydark2">Montant</label>
										<p className="text-lg font-semibold text-meta-3">
											{detailEarning.formatted_amount || `${parseFloat(detailEarning.amount || 0).toFixed(2)} FCFA`}
										</p>
									</div>
									<div>
										<label className="text-sm font-medium text-body dark:text-bodydark2">Montant brut</label>
										<p className="text-sm text-gray-900 dark:text-gray-100">
											{detailEarning.amount || 'Non disponible'}
										</p>
									</div>
								</div>

								{/* Period Information */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="text-sm font-medium text-body dark:text-bodydark2">Début de période</label>
										<p className="text-sm text-gray-900 dark:text-gray-100">
											{detailEarning.period_start
												? new Date(detailEarning.period_start).toLocaleString()
												: 'Non disponible'
											}
										</p>
									</div>
									<div>
										<label className="text-sm font-medium text-body dark:text-bodydark2">Fin de période</label>
										<p className="text-sm text-gray-900 dark:text-gray-100">
											{detailEarning.period_end
												? new Date(detailEarning.period_end).toLocaleString()
												: 'Non disponible'
											}
										</p>
									</div>
								</div>

								{/* User Information */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="text-sm font-medium text-body dark:text-bodydark2">Nom d'utilisateur</label>
										<p className="text-sm text-gray-900 dark:text-gray-100">
											{detailEarning.user_name || 'Non disponible'}
										</p>
									</div>
									<div>
										<label className="text-sm font-medium text-body dark:text-bodydark2">Payé par</label>
										<p className="text-sm text-gray-900 dark:text-gray-100">
											{detailEarning.paid_by_name || 'Non disponible'}
										</p>
									</div>
								</div>

								{/* Transaction Count */}
								<div>
									<label className="text-sm font-medium text-body dark:text-bodydark2">Nombre de transactions</label>
									<p className="text-sm text-gray-900 dark:text-gray-100">
										{detailEarning.transactions_count || 0}
									</p>
								</div>

								{/* Admin Notes */}
								{detailEarning.admin_notes && (
									<div>
										<label className="text-sm font-medium text-body dark:text-bodydark2">Notes d'administrateur</label>
										<p className="text-sm text-gray-900 dark:text-gray-100 bg-blue-50 dark:bg-blue-900/20 p-3 rounded border">
											{detailEarning.admin_notes}
										</p>
									</div>
								)}

								{/* Timestamps */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="text-sm font-medium text-body dark:text-bodydark2">Créé le</label>
										<p className="text-sm text-gray-900 dark:text-gray-100">
											{detailEarning.created_at
												? new Date(detailEarning.created_at).toLocaleString()
												: 'Non disponible'
											}
										</p>
									</div>
									<div>
										<label className="text-sm font-medium text-body dark:text-bodydark2">Statut</label>
										<Badge
											className={
												detailEarning.status === 'completed'
													? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
													: detailEarning.status === 'pending'
														? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
														: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
											}
										>
											{detailEarning.status || 'Inconnu'}
										</Badge>
									</div>
								</div>
							</div>
						) : null}
					</DialogContent>
				</Dialog>

			</div>
		</div>
	)
}


import { Suspense } from 'react'
import { getApiBaseUrl } from "@/lib/env-config"

export default function EarningManagementPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <EarningManagementPageContent />
    </Suspense>
  )
}
