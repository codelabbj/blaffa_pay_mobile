"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Copy, DollarSign, Users, Clock, CheckCircle, XCircle, Loader2, Eye, AlertTriangle, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { useApi } from "@/lib/useApi"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DateRangeFilter } from "@/components/ui/date-range-filter"
import { getApiBaseUrl } from "@/lib/env-config"

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

export default function TopupPage() {
	const [searchTerm, setSearchTerm] = useState("")
	const [statusFilter, setStatusFilter] = useState("all")
	const [startDate, setStartDate] = useState<string | null>(null)
	const [endDate, setEndDate] = useState<string | null>(null)
	const [currentPage, setCurrentPage] = useState(1)
	const [topups, setTopups] = useState<any[]>([])
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
	const [detailTopup, setDetailTopup] = useState<any | null>(null)
	const [detailLoading, setDetailLoading] = useState(false)
	const [detailError, setDetailError] = useState("")

	// Approve/Reject modal state
	const [actionModalOpen, setActionModalOpen] = useState(false);
	const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
	const [actionTopup, setActionTopup] = useState<any | null>(null);
	const [adminNotes, setAdminNotes] = useState("");
	const [rejectionReason, setRejectionReason] = useState("");
	const [confirmModalOpen, setConfirmModalOpen] = useState(false);
	const [pendingAction, setPendingAction] = useState(false);
	const [disabledTopups, setDisabledTopups] = useState<{ [uid: string]: "approved" | "rejected" | undefined }>({});
	const [proofImageModalOpen, setProofImageModalOpen] = useState(false);
	const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string>("");

	// Calculate summary stats
	const pendingCount = topups.filter(t => (t.status_display || t.status) === 'pending' || (t.status_display || t.status) === 'en attente').length;
	const approvedCount = topups.filter(t => (t.status_display || t.status) === 'approved' || (t.status_display || t.status) === 'approuvé' || (t.status_display || t.status) === 'approuvée').length;
	const rejectedCount = topups.filter(t => (t.status_display || t.status) === 'rejected' || (t.status_display || t.status) === 'rejeté' || (t.status_display || t.status) === 'rejetée').length;
	const totalAmount = topups.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

	// Fetch topups from API
	useEffect(() => {
		const fetchTopups = async () => {
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
				const endpoint = `payments/recharge-requests/?${params.toString()}${orderingParam}`
				const data = await apiFetch(endpoint)
				setTopups(data.results || [])
				setTotalCount(data.count || 0)
				setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))
			} catch (err: any) {
				const errorMessage = extractErrorMessages(err)
				setError(errorMessage)
				setTopups([])
				setTotalCount(0)
				setTotalPages(1)
				toast({ title: t("topup.failedToLoad"), description: errorMessage, variant: "destructive" })
			} finally {
				setLoading(false)
			}
		}
		fetchTopups()
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

	// Fetch topup details
	const handleOpenDetail = async (uid: string) => {
		setDetailModalOpen(true)
		setDetailLoading(true)
		setDetailError("")
		setDetailTopup(null)
		try {
			// For demo, just find in topups
			const found = topups.find((t) => t.uid === uid)
			setDetailTopup(found)
		} catch (err: any) {
			setDetailError(extractErrorMessages(err))
			toast({ title: t("topup.detailFailed"), description: extractErrorMessages(err), variant: "destructive" })
		} finally {
			setDetailLoading(false)
		}
	}

	const handleCloseDetail = () => {
		setDetailModalOpen(false)
		setDetailTopup(null)
		setDetailError("")
	}

	const getStatusBadge = (statusDisplay: string) => {
		const statusMap: { [key: string]: { color: string; icon: any } } = {
			'pending': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300', icon: Clock },
			'en attente': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300', icon: Clock },
			'approved': { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300', icon: CheckCircle },
			'approuvé': { color: 'bg-green-100 text-green-500 dark:bg-green-900/20 dark:text-green-300', icon: CheckCircle },
			'approuvée': { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300', icon: CheckCircle },
			'rejected': { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300', icon: XCircle },
			'rejeté': { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300', icon: XCircle },
			'rejetée': { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300', icon: XCircle },
			'completed': { color: 'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300', icon: CheckCircle },
			'terminé': { color: 'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300', icon: CheckCircle },
			'terminée': { color: 'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300', icon: CheckCircle },
			'expired': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300', icon: XCircle },
			'expiré': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300', icon: XCircle },
			'expirée': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300', icon: XCircle },
			'proof_submitted': { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300', icon: AlertTriangle },
			'preuve soumise': { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300', icon: AlertTriangle }
		};

		const statusInfo = statusMap[statusDisplay.toLowerCase()] || statusMap['pending'];
		const IconComponent = statusInfo.icon;

		return (
			<Badge className={statusInfo.color}>
				<div className="flex items-center space-x-1">
					<IconComponent className="h-3 w-3" />
					<span className="capitalize"><span>{statusDisplay}</span></span>
				</div>
			</Badge>
		);
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-whiten dark:bg-boxdark-2">
				<div className="w-full">
					<div className="flex items-center justify-center py-6 sm:py-10">
						<div className="flex flex-col items-center space-y-4">
							<Loader2 className="h-8 w-8 animate-spin text-primary" />
							<span className="text-body dark:text-bodydark"><span>Loading topup requests...</span></span>
						</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-whiten dark:bg-boxdark-2">
			<div className="w-full">

				{/* Page Header */}
				<div className="mb-4 sm:mb-6">
					<div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
						<div>
							<h1 className="text-base font-bold sm:text-lg sm:text-2xl bg-gradient-to-r from-primary to-meta-3 bg-clip-text text-transparent">
								<span>{t("topup.title") || "Top Up Requests"}</span>
							</h1>
							<p className="text-body dark:text-bodydark mt-2 text-lg">
								<span>Manage and review topup requests from users</span>
							</p>
						</div>
					</div>
				</div>

				{/* Summary Cards */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
					<Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
						<CardContent className="p-3 sm:p-4 md:p-6">
							<div className="flex flex-wrap items-center gap-2 sm:gap-3">
								{/* <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
									<DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-300" />
								</div> */}
								<div>
									<p className="text-sm font-medium text-body dark:text-bodydark2"><span>Total Amount</span></p>
									<p className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
										<span>{totalAmount.toFixed(2)} FCFA</span>
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
									<p className="text-sm font-medium text-body dark:text-bodydark2"><span>Pending</span></p>
									<p className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
										<span>{pendingCount}</span>
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
						<CardContent className="p-3 sm:p-4 md:p-6">
							<div className="flex flex-wrap items-center gap-2 sm:gap-3">
								<div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
									<CheckCircle className="h-6 w-6 text-meta-3 dark:text-green-300" />
								</div>
								<div>
									<p className="text-sm font-medium text-body dark:text-bodydark2"><span>Approved</span></p>
									<p className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
										<span>{approvedCount}</span>
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
						<CardContent className="p-3 sm:p-4 md:p-6">
							<div className="flex flex-wrap items-center gap-2 sm:gap-3">
								<div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
									<XCircle className="h-6 w-6 text-red-600 dark:text-red-300" />
								</div>
								<div>
									<p className="text-sm font-medium text-body dark:text-bodydark2"><span>Rejected</span></p>
									<p className="text-lg font-bold sm:text-xl text-gray-900 dark:text-gray-100">
										<span>{rejectedCount}</span>
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{error && (
					<Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
						<CardContent className="p-3 sm:p-4 md:p-6">
							<ErrorDisplay
								error={error}
								onRetry={() => {
									setCurrentPage(1)
									setError("")
								}}
								variant="full"
								showDismiss={false}
							/>
						</CardContent>
					</Card>
				)}

				{/* Main Content */}
				<Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
					<CardHeader className="border-b border-gray-100 dark:border-strokedark">
						<CardTitle className="flex items-center space-x-2">
							<div className="p-2 bg-meta-2 dark:bg-orange-900 rounded-lg">
								<Users className="h-5 w-5 text-primary dark:text-secondary" />
							</div>
							<span><span>Topup Requests</span></span>
						</CardTitle>
					</CardHeader>
					<CardContent className="p-3 sm:p-4 md:p-6">
						{/* Search & Filter */}
						<div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
							<div className="relative flex-1">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-bodydark2 h-4 w-4" />
								<Input
									placeholder={t("topup.search") || "Search"}
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10 bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
								/>
							</div>
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="w-full sm:w-48 bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
									<SelectValue placeholder={t("topup.allStatuses") || "All Statuses"} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("topup.allStatuses") || "All Statuses"}</SelectItem>
									<SelectItem value="pending">{t("topup.pending") || "Pending"}</SelectItem>
									<SelectItem value="approved">{t("topup.approved") || "Approved"}</SelectItem>
									<SelectItem value="rejected">{t("topup.rejected") || "Rejected"}</SelectItem>
									<SelectItem value="expired">{t("topup.expired") || "Expired"}</SelectItem>
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
								className="w-full sm:w-auto"
							/>
						</div>

						{/* Table */}
						<div className="rounded-md border border-stroke dark:border-strokedark">
							<Table>
								<TableHeader>
									<TableRow className="bg-gray-50 dark:bg-meta-4">
										<TableHead className="font-semibold"><span>{t("topup.uid") || "UID"}</span></TableHead>
										<TableHead>
											<Button variant="ghost" onClick={() => handleSort("amount")} className="h-auto p-0 font-semibold hover:bg-transparent">
												<span>{t("topup.amount") || "Amount"}</span>
												<ArrowUpDown className="ml-2 h-4 w-4" />
											</Button>
										</TableHead>
										<TableHead><span>{t("topup.formattedAmount") || "Formatted Amount"}</span></TableHead>
										<TableHead>
											<Button variant="ghost" onClick={() => handleSort("status")} className="h-auto p-0 font-semibold hover:bg-transparent">
												<span>{t("topup.status") || "Status"}</span>
												<ArrowUpDown className="ml-2 h-4 w-4" />
											</Button>
										</TableHead>
										<TableHead><span>{t("topup.userName") || "User Name"}</span></TableHead>
										<TableHead><span>{t("topup.userEmail") || "User Email"}</span></TableHead>
										<TableHead><span>{t("topup.reference") || "Reference"}</span></TableHead>
										<TableHead>
											<Button variant="ghost" onClick={() => handleSort("created_at")} className="h-auto p-0 font-semibold hover:bg-transparent">
												<span>{t("topup.createdAt") || "Created At"}</span>
												<ArrowUpDown className="ml-2 h-4 w-4" />
											</Button>
										</TableHead>
										<TableHead><span>{t("topup.details") || "Details"}</span></TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{topups.map((topup) => (
										<TableRow key={topup.uid} className="hover:bg-gray-50 dark:hover:bg-gray-700">
											<TableCell className="font-mono text-sm"><span>{topup.uid}</span></TableCell>
											<TableCell className="font-semibold"><span>{topup.amount} FCFA</span></TableCell>
											<TableCell><span>{topup.formatted_amount}</span></TableCell>
											<TableCell>
												{getStatusBadge(topup.status_display || topup.status)}
											</TableCell>
											<TableCell className="font-medium"><span>{topup.user_name}</span></TableCell>
											<TableCell className="text-body dark:text-bodydark2"><span>{topup.user_email}</span></TableCell>
											<TableCell className="font-mono text-sm"><span>{topup.reference}</span></TableCell>
											<TableCell className="text-body dark:text-bodydark2">
												<div className="flex flex-col">
													<span className="text-sm font-medium">
														<span>{topup.created_at ? new Date(topup.created_at).toLocaleDateString() : "-"}</span>
													</span>
													{topup.created_at && (
														<span className="text-xs text-body dark:text-bodydark2">
															<span>{new Date(topup.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
														</span>
													)}
												</div>
											</TableCell>
											<TableCell>
												<div className="flex gap-2 items-center">
													<Button
														size="sm"
														variant="outline"
														onClick={() => handleOpenDetail(topup.uid)}
														className="flex items-center space-x-1"
													>
														<Eye className="h-3 w-3" />
														<span>{t("topup.details") || "Details"}</span>
													</Button>
													{/* Approve Button */}
													<Button
														size="sm"
														variant="default"
														className="bg-meta-3 hover:bg-green-700 text-white"
														disabled={
															!!disabledTopups[topup.uid]
															|| ((topup.status_display || topup.status)?.toLowerCase() !== "pending" && (topup.status_display || topup.status)?.toLowerCase() !== "en attente" && (topup.status_display || topup.status)?.toLowerCase() !== "proof_submitted" && (topup.status_display || topup.status)?.toLowerCase() !== "preuve soumise")
															|| !!topup.is_expired
															// || (topup.expires_at && new Date(topup.expires_at) < new Date())
														}
														onClick={() => {
															setActionType("approve");
															setActionTopup(topup);
															setAdminNotes("");
															setActionModalOpen(true);
														}}
													>
														<span>{disabledTopups[topup.uid] === "approved" ? t("topup.approved") || "Approved" : t("topup.approve") || "Approve"}</span>
													</Button>
													{/* Reject Button */}
													<Button
														size="sm"
														variant="destructive"
														disabled={
															!!disabledTopups[topup.uid]
															|| ((topup.status_display || topup.status)?.toLowerCase() !== "pending" && (topup.status_display || topup.status)?.toLowerCase() !== "en attente" && (topup.status_display || topup.status)?.toLowerCase() !== "proof_submitted" && (topup.status_display || topup.status)?.toLowerCase() !== "preuve soumise")
															|| !!topup.is_expired
															// || (topup.expires_at && new Date(topup.expires_at) < new Date())
														}
														onClick={() => {
															setActionType("reject");
															setActionTopup(topup);
															setAdminNotes("");
															setRejectionReason("");
															setActionModalOpen(true);
														}}
													>
														<span>{disabledTopups[topup.uid] === "rejected" ? t("topup.rejected") || "Rejected" : t("topup.reject") || "Reject"}</span>
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>

						{/* Pagination */}
						<div className="flex flex-wrap items-start justify-between gap-3 sm:items-center mt-6">
							<div className="text-sm text-body dark:text-bodydark2">
								<span>{`${t("topup.showingResults") || "Showing"}: ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, totalCount)} / ${totalCount}`}</span>
							</div>
							<div className="flex items-center space-x-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
									disabled={currentPage === 1}
									className="flex items-center space-x-1"
								>
									<ChevronLeft className="h-4 w-4" />
									<span>{t("common.previous")}</span>
								</Button>
								<div className="text-sm text-body dark:text-bodydark2 px-4">
									<span>{`${t("topup.pageOf") || "Page"}: ${currentPage}/${totalPages}`}</span>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
									disabled={currentPage === totalPages}
									className="flex items-center space-x-1"
								>
									<span>{t("common.next")}</span>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Topup Details Modal */}
				<Dialog open={detailModalOpen} onOpenChange={(open) => { if (!open) handleCloseDetail() }}>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle className="flex items-center space-x-2">
								<Eye className="h-5 w-5" />
								<span><span>{t("topup.details") || "Top Up Details"}</span></span>
							</DialogTitle>
						</DialogHeader>
						{detailLoading ? (
							<div className="flex items-center justify-center py-4 sm:py-6">
								<Loader2 className="h-6 w-6 animate-spin text-primary" />
								<span>Loading...</span>
							</div>
						) : detailError ? (
							<ErrorDisplay
								error={detailError}
								variant="inline"
								showRetry={false}
								className="mb-4"
							/>
						) : detailTopup ? (
							<div className="space-y-4">
								<div className="flex items-center gap-2">
									<b><span>{t("topup.uid") || "UID"}</span>:</b> <span>{detailTopup.uid}</span>
									<Button
										variant="ghost"
										size="icon"
										className="h-5 w-5"
										onClick={() => {
											navigator.clipboard.writeText(detailTopup.uid)
											toast({ title: t("topup.copiedUid") || "UID copied!" })
										}}
										aria-label={t("topup.copyUid") || "Copy UID"}
									>
										<Copy className="h-4 w-4" />
									</Button>
								</div>
								<div><b><span>{t("topup.formattedAmount") || "Formatted Amount"}</span>:</b> <span>{detailTopup.formatted_amount}</span></div>
								<div><b><span>{t("topup.status") || "Status"}</span>:</b> <span>{detailTopup.status_display || detailTopup.status}</span></div>
								<div><b><span>{t("topup.userName") || "User Name"}</span>:</b> <span>{detailTopup.user_name}</span></div>
								<div><b><span>{t("topup.userEmail") || "User Email"}</span>:</b> <span>{detailTopup.user_email}</span></div>
								<div><b><span>{t("topup.reference") || "Reference"}</span>:</b> <span>{detailTopup.reference}</span></div>
								<div><b><span>{t("topup.createdAt") || "Created At"}</span>:</b> <span>{detailTopup.created_at ? detailTopup.created_at.split("T")[0] : "-"}</span></div>
								<div><b><span>{t("topup.expiresAt") || "Expires At"}</span>:</b> <span>{detailTopup.expires_at ? detailTopup.expires_at.split("T")[0] : "-"}</span></div>
								<div className="flex items-center gap-2">
									<b><span>{t("topup.proofImage") || "Proof Image"}</span>:</b>
									{detailTopup.proof_image ? (
										<Button
											size="sm"
											variant="outline"
											onClick={() => {
												setProofImageUrl(detailTopup.proof_image);
												setProofImageModalOpen(true);
											}}
											className="flex items-center space-x-1"
										>
											<Eye className="h-3 w-3" />
											<span>{t("topup.viewProof") || "View Image"}</span>
										</Button>
									) : (
										<span className="text-body"><span>{t("topup.noProofImage") || "No image"}</span></span>
									)}
								</div>
								<div><b><span>{t("topup.proofDescription") || "Proof Description"}</span>:</b> <span>{detailTopup.proof_description}</span></div>
								<div><b><span>{t("topup.isExpired") || "Expired"}</span>:</b> <span>{detailTopup.is_expired ? "Yes" : "No"}</span></div>
								<div><b><span>{t("topup.timeRemaining") || "Time Remaining"}</span>:</b> <span>{detailTopup.time_remaining ? `${detailTopup.time_remaining} seconds` : "-"}</span></div>
								<div><b><span>{t("topup.reviewedBy") || "Reviewed By"}</span>:</b> <span>{detailTopup.reviewed_by_name}</span></div>
								<div><b><span>{t("topup.reviewedAt") || "Reviewed At"}</span>:</b> <span>{detailTopup.reviewed_at ? detailTopup.reviewed_at.split("T")[0] : "-"}</span></div>
								<div><b><span>{t("topup.processedAt") || "Processed At"}</span>:</b> <span>{detailTopup.processed_at ? detailTopup.processed_at.split("T")[0] : "-"}</span></div>
								<div><b><span>{t("topup.adminNotes") || "Notes d'administrateur"}</span>:</b> <span>{detailTopup.admin_notes}</span></div>
								<div><b><span>{t("topup.rejectionReason") || "Raison du rejet"}</span>:</b> <span>{detailTopup.rejection_reason}</span></div>
							</div>
						) : null}
						<DialogClose asChild>
							<Button className="mt-4 w-full">Fermer</Button>
						</DialogClose>
					</DialogContent>
				</Dialog>

				{/* Proof Image Modal */}
				<Dialog open={proofImageModalOpen} onOpenChange={setProofImageModalOpen}>
					<DialogContent className="flex flex-col items-center justify-center">
						<DialogHeader>
							<DialogTitle className="flex items-center space-x-2">
								<Eye className="h-5 w-5" />
								<span>{t("topup.proofImage") || "Image de preuve"}</span>
							</DialogTitle>
						</DialogHeader>
						{proofImageUrl && (
							<img
								src={proofImageUrl}
								alt={t("topup.proofImageAlt") || "Proof"}
								className="max-w-full max-h-[70vh] rounded border"
								style={{ objectFit: "contain" }}
							/>
						)}
						<DialogClose asChild>
							<Button className="mt-4 w-full">Fermer</Button>
						</DialogClose>
					</DialogContent>
				</Dialog>

				{/* Approve/Reject Modal */}
				<Dialog open={actionModalOpen} onOpenChange={(open) => {
					setActionModalOpen(open);
					if (!open) {
						setActionError("");
					}
				}}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle className="flex items-center space-x-2">
								{actionType === "approve" ? (
									<CheckCircle className="h-5 w-5 text-meta-3" />
								) : (
									<XCircle className="h-5 w-5 text-red-600" />
								)}
								<span>
									{actionType === "approve"
										? t("topup.approveTitle") || "Approuver la demande"
										: t("topup.rejectTitle") || "Rejeter la demande"}
								</span>
							</DialogTitle>
						</DialogHeader>
						{actionError && (
							<div className="mb-4">
								<ErrorDisplay error={actionError} variant="inline" showRetry={false} showDismiss={true} onDismiss={() => setActionError("")} />
							</div>
						)}
						{actionType === "approve" ? (
							<div className="space-y-4">
								<div>
									<Label htmlFor="adminNotes" className="text-sm font-medium text-gray-700 dark:text-bodydark">
										{t("topup.adminNotes") || "Notes d'administrateur"}
									</Label>
									<Input
										id="adminNotes"
										placeholder={t("topup.adminNotes") || "Notes d'administrateur"}
										value={adminNotes}
										onChange={e => setAdminNotes(e.target.value)}
										className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
									/>
								</div>
							</div>
						) : (
							<div className="space-y-4">
								<div>
									<Label htmlFor="rejectionReason" className="text-sm font-medium text-gray-700 dark:text-bodydark">
										{t("topup.rejectionReason") || "Raison du rejet"}
									</Label>
									<Input
										id="rejectionReason"
										placeholder={t("topup.rejectionReason") || "Raison du rejet"}
										value={rejectionReason}
										onChange={e => setRejectionReason(e.target.value)}
										className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark"
									/>
								</div>
							</div>
						)}
						<DialogFooter className="flex gap-2">
							<Button
								variant="outline"
								onClick={() => setActionModalOpen(false)}
							>
								{t("common.cancel") || "Annuler"}
							</Button>
							<Button
								onClick={async () => {
									setPendingAction(true);
									setActionError("");
									try {
										const endpoint = `payments/recharge-requests/${actionTopup.uid}/${actionType}/`;
										const payload =
											actionType === "approve"
												? { admin_notes: adminNotes }
												: { rejection_reason: rejectionReason };
										await apiFetch(endpoint, {
											method: "POST",
											body: JSON.stringify(payload),
											headers: { "Content-Type": "application/json" },
											successMessage:
												actionType === "approve"
													? t("topup.approvedSuccessfully") || "Request approved"
													: t("topup.rejectedSuccessfully") || "Request rejected",
										});
										setDisabledTopups(prev => ({
											...prev,
											[actionTopup.uid]: actionType === "approve" ? "approved" : "rejected",
										}));
										setActionModalOpen(false);
										setAdminNotes("");
										setRejectionReason("");
									} catch (err: any) {
										const errorMessage = extractErrorMessages(err);
										setActionError(errorMessage);
										console.error('Topup action error:', err);
										toast({
											title: t("topup.failed"),
											description: errorMessage,
											variant: "destructive",
										});
									} finally {
										setPendingAction(false);
									}
								}}
								disabled={
									pendingAction
									|| (actionType === "approve" && !adminNotes)
									|| (actionType === "reject" && !rejectionReason)
									|| !!actionTopup?.is_expired
									// || (actionTopup?.expires_at && new Date(actionTopup.expires_at) < new Date())
								}
								className={
									actionType === "approve"
										? "bg-meta-3 hover:bg-green-700 text-white"
										: "bg-red-600 hover:bg-red-700 text-white"
								}
							>
								{pendingAction ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Traitement...
									</>
								) : (
									actionType === "approve"
										? t("topup.confirmApprove") || "Confirmer l'approbation"
										: t("topup.confirmReject") || "Confirmer le rejet"
								)}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	)
}
