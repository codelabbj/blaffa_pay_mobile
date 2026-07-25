"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, ChevronLeft, ChevronRight, MoreHorizontal, ArrowUpDown, Users, Filter, Eye, CheckCircle, XCircle, Clock, Shield, Mail, Phone, UserCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { useApi } from "@/lib/useApi"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { Copy } from "lucide-react"
import { DateRangeFilter } from "@/components/ui/date-range-filter"
import { CopyButton } from "@/components/ui/copy-button"





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

function UsersPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all")
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1)
  const [users, setUsers] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sortField, setSortField] = useState<"display_name" | "email" | "created_at" | null>((searchParams.get("sort_field") as any) || null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">((searchParams.get("sort_dir") as any) || "desc")
  const [startDate, setStartDate] = useState<string | null>(searchParams.get("start_date"))
  const [endDate, setEndDate] = useState<string | null>(searchParams.get("end_date"))
  const { t } = useLanguage()
  const itemsPerPage = 10
  const baseUrl = getApiBaseUrl()
  const [viewType, setViewType] = useState("all")
  const { toast } = useToast()
  const [activatingUid, setActivatingUid] = useState<string | null>(null)
  const [deactivatingUid, setDeactivatingUid] = useState<string | null>(null)
  const [selectedUids, setSelectedUids] = useState<string[]>([])
  const allSelected = users.length > 0 && users.every((u) => selectedUids.includes(u.uid))
  const someSelected = users.some((u) => selectedUids.includes(u.uid))
  const apiFetch = useApi();
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailUser, setDetailUser] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState("")

  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [verifyingPartner, setVerifyingPartner] = useState(false);
  const [verifyingUssd, setVerifyingUssd] = useState(false);
  const [verifyingMomo, setVerifyingMomo] = useState(false);
  const [verifyingMobcash, setVerifyingMobcash] = useState(false);
  const [verifyingBulkPayment, setVerifyingBulkPayment] = useState(false);

  const [confirmEmailToggle, setConfirmEmailToggle] = useState<null | boolean>(null);
  const [confirmPhoneToggle, setConfirmPhoneToggle] = useState<null | boolean>(null);
  const [confirmPartnerToggle, setConfirmPartnerToggle] = useState<null | boolean>(null);
  const [confirmUssdToggle, setConfirmUssdToggle] = useState<null | boolean>(null);
  const [confirmMomoToggle, setConfirmMomoToggle] = useState<null | boolean>(null);
  const [confirmMobcashToggle, setConfirmMobcashToggle] = useState<null | boolean>(null);
  const [confirmBulkPaymentToggle, setConfirmBulkPaymentToggle] = useState<null | boolean>(null);

  const [confirmActionUser, setConfirmActionUser] = useState<any | null>(null);
  const [confirmActionType, setConfirmActionType] = useState<"activate" | "deactivate" | null>(null);

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

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let endpoint = "";
      if (searchTerm.trim() !== "" || statusFilter !== "all" || sortField) {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          page_size: itemsPerPage.toString(),
        });
        if (searchTerm.trim() !== "") {
          params.append("search", searchTerm);
        }
        if (statusFilter !== "all") {
          params.append("status", statusFilter);
        }
        if (startDate) {
          params.append("created_at__gte", startDate);
        }
        if (endDate) {
          params.append("created_at__lte", endDate);
        }
        const orderingParam = sortField
          ? `&ordering=${(sortDirection === "asc" ? "+" : "-")}${(sortField === "display_name" ? "display_name" : sortField)}`
          : "";
        endpoint =
          viewType === "pending"
            ? `auth/admin/users/pending/?${params.toString()}${orderingParam}`
            : `auth/admin/users/?${params.toString()}${orderingParam}`;
      } else {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          page_size: itemsPerPage.toString(),
        });
        endpoint =
          viewType === "pending"
            ? `auth/admin/users/pending/?${params.toString()}`
            : `auth/admin/users/?${params.toString()}`;
      }
      console.log("User API endpoint:", endpoint);
      const data = await apiFetch(endpoint);
      console.log("API response data:", data);

      // Handle the actual API response structure
      const rawUsers = data.users || data.results || [];
      const users = rawUsers.map((u: any) => ({
        ...u,
        can_process_momo: u.can_process_momo ?? true,
        can_process_mobcash: u.can_process_mobcash ?? true,
        can_process_bulk_payment: u.can_process_bulk_payment ?? true,
      }));
      const totalCount = data.pagination?.total_count || data.count || 0;
      const totalPages = data.pagination?.total_pages || Math.ceil(totalCount / itemsPerPage);

      setUsers(users);
      setTotalCount(totalCount);
      setTotalPages(totalPages);
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || "Échec du chargement des utilisateurs";
      setError(errorMessage);
      setUsers([]);
      toast({
        title: "Échec du chargement des utilisateurs",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Users fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, currentPage, sortField, sortDirection, viewType, startDate, endDate, apiFetch, baseUrl, itemsPerPage, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users // Filtering is now handled by the API
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedUsers = filteredUsers // Already paginated by API

  const handleSort = (field: "display_name" | "email" | "created_at") => {
    handleSortChange(field)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      pending: "outline",
    } as const

    return <Badge variant={variants[status as keyof typeof variants]}>{t(`users.${status}`)}</Badge>
  }

  // Activate user handler
  const handleActivate = async (user: any) => {
    if (!user.uid) return
    setActivatingUid(user.uid)
    try {
      const data = await apiFetch(`auth/admin/users/${user.uid}/activate/`, {
        method: "PATCH",
        successMessage: "Utilisateur activé avec succès"
      })
      setUsers((prev) => prev.map((u) => (u.uid === user.uid ? { ...u, ...data.user } : u)))
    } catch (err: any) {
      toast({ title: "Échec de l'activation", description: extractErrorMessages(err) || "Impossible d'activer l'utilisateur", variant: "destructive" })
    } finally {
      setActivatingUid(null)
    }
  }

  // Deactivate user handler
  const handleDeactivate = async (user: any) => {
    if (!user.uid) return
    setDeactivatingUid(user.uid)
    try {
      const data = await apiFetch(`auth/admin/users/${user.uid}/deactivate/`, {
        method: "PATCH",
        successMessage: "Utilisateur désactivé avec succès"
      })
      setUsers((prev) => prev.map((u) => (u.uid === user.uid ? { ...u, ...data.user } : u)))
    } catch (err: any) {
      toast({ title: "Échec de la désactivation", description: extractErrorMessages(err) || "Impossible de désactiver l'utilisateur", variant: "destructive" })
    } finally {
      setDeactivatingUid(null)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUids(Array.from(new Set([...selectedUids, ...users.map((u) => u.uid)])))
    } else {
      setSelectedUids(selectedUids.filter((uid) => !users.map((u) => u.uid).includes(uid)))
    }
  }

  const handleSelectRow = (uid: string, checked: boolean) => {
    setSelectedUids((prev) => checked ? [...prev, uid] : prev.filter((id) => id !== uid))
  }

  // Bulk action handler
  const handleBulkAction = async (action: "activate" | "deactivate" | "delete") => {
    if (selectedUids.length === 0) return
    setLoading(true)
    try {
      const data = await apiFetch(`auth/admin/users/bulk-action/`, {
        method: "POST",
        body: JSON.stringify({ action, user_ids: selectedUids }),
        successMessage: "Action en lot terminée"
      })
      setUsers((prev) => prev.map((u) => selectedUids.includes(u.uid) ? { ...u, ...data.user } : u))
      setSelectedUids([])
      await fetchUsers()
    } catch (err: any) {
      toast({ title: "Échec de l'action en lot", description: extractErrorMessages(err) || "Impossible d'effectuer l'action en lot", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Fetch user details
  const handleOpenDetail = async (uid: string) => {
    setDetailModalOpen(true)
    setDetailLoading(true)
    setDetailError("")
    setDetailUser(null)
    try {
      const data = await apiFetch(`auth/admin/users/${uid}/`)
      setDetailUser({
        ...data,
        can_process_momo: data.can_process_momo ?? true,
        can_process_mobcash: data.can_process_mobcash ?? true,
        can_process_bulk_payment: data.can_process_bulk_payment ?? true,
      })
    } catch (err: any) {
      setDetailError(extractErrorMessages(err))
      toast({ title: "Échec du chargement des détails", description: extractErrorMessages(err), variant: "destructive" })
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCloseDetail = () => {
    setDetailModalOpen(false)
    setDetailUser(null)
    setDetailError("")
  }

  // Add handler for verifying email
  const handleVerifyEmail = async () => {
    if (!detailUser?.uid) return;
    setVerifyingEmail(true);
    try {
      const data = await apiFetch(`auth/admin/users/${detailUser.uid}/update/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_verified: true }),
        successMessage: "Email vérifié avec succès"
      });
      setDetailUser((prev: any) => prev ? { ...prev, email_verified: true } : prev);
    } catch (err: any) {
      toast({ title: "Échec de la vérification", description: extractErrorMessages(err), variant: "destructive" });
    } finally {
      setVerifyingEmail(false);
    }
  };

  // Add handler for verifying phone
  const handleVerifyPhone = async () => {
    if (!detailUser?.uid) return;
    setVerifyingPhone(true);
    try {
      const data = await apiFetch(`auth/admin/users/${detailUser.uid}/update/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_verified: true }),
        successMessage: "Téléphone vérifié avec succès"
      });
      setDetailUser((prev: any) => prev ? { ...prev, phone_verified: true } : prev);
    } catch (err: any) {
      toast({ title: "Échec de la vérification", description: extractErrorMessages(err), variant: "destructive" });
    } finally {
      setVerifyingPhone(false);
    }
  };

  // Update handleVerifyEmail to handle both verify and unverify
  const handleToggleEmailVerified = async (verify: boolean) => {
    if (!detailUser?.uid) return;
    setVerifyingEmail(true);
    try {
      const data = await apiFetch(`auth/admin/users/${detailUser.uid}/update/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_verified: verify }),
        successMessage: verify ? "Email vérifié avec succès" : "Email non vérifié avec succès"
      });
      setDetailUser((prev: any) => prev ? { ...prev, email_verified: verify } : prev);
    } catch (err: any) {
      toast({ title: "Échec de la vérification", description: extractErrorMessages(err), variant: "destructive" });
    } finally {
      setVerifyingEmail(false);
    }
  };

  // Update handleVerifyPhone to handle both verify and unverify
  const handleTogglePhoneVerified = async (verify: boolean) => {
    if (!detailUser?.uid) return;
    setVerifyingPhone(true);
    try {
      const data = await apiFetch(`auth/admin/users/${detailUser.uid}/update/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_verified: verify }),
        successMessage: verify ? "Téléphone vérifié avec succès" : "Téléphone non vérifié avec succès"
      });
      setDetailUser((prev: any) => prev ? { ...prev, phone_verified: verify } : prev);
    } catch (err: any) {
      toast({ title: "Échec de la vérification", description: extractErrorMessages(err), variant: "destructive" });
    } finally {
      setVerifyingPhone(false);
    }
  };

  // Add handler for toggling is_partner
  const handleTogglePartner = async (isPartner: boolean) => {
    if (!detailUser?.uid) return;
    setVerifyingPartner(true);
    try {
      const data = await apiFetch(`auth/admin/users/${detailUser.uid}/update/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_partner: isPartner }),
        successMessage: isPartner ? "Statut partenaire activé avec succès" : "Statut partenaire désactivé avec succès"
      });
      setDetailUser((prev: any) => prev ? { ...prev, is_partner: isPartner } : prev);
    } catch (err: any) {
      toast({ title: "Échec de la modification du statut partenaire", description: extractErrorMessages(err), variant: "destructive" });
    } finally {
      setVerifyingPartner(false);
    }
  };

  // Add handler for toggling can_process_ussd_transaction
  const handleToggleUssd = async (canProcessUssd: boolean) => {
    if (!detailUser?.uid) return;
    setVerifyingUssd(true);
    try {
      const data = await apiFetch(`auth/admin/users/${detailUser.uid}/update/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ can_process_ussd_transaction: canProcessUssd }),
        successMessage: canProcessUssd ? t("users.ussdAuthorized") || "Transactions USSD autorisées avec succès" : t("users.ussdForbidden") || "Transactions USSD interdites avec succès"
      });
      setDetailUser((prev: any) => prev ? { ...prev, can_process_ussd_transaction: canProcessUssd } : prev);
    } catch (err: any) {
      toast({ title: t("users.ussdUpdateFailed") || "Échec de la modification du statut USSD", description: extractErrorMessages(err), variant: "destructive" });
    } finally {
      setVerifyingUssd(false);
    }
  };

  // Add handler for toggling can_process_momo
  const handleToggleMomo = async (canProcessMomo: boolean) => {
    if (!detailUser?.uid) return;
    setVerifyingMomo(true);
    try {
      const data = await apiFetch(`auth/admin/users/${detailUser.uid}/update/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ can_process_momo: canProcessMomo }),
        successMessage: canProcessMomo ? t("users.momoAuthorized") || "MoMo autorisé avec succès" : t("users.momoForbidden") || "MoMo interdit avec succès"
      });
      setDetailUser((prev: any) => prev ? { ...prev, can_process_momo: canProcessMomo } : prev);
    } catch (err: any) {
      toast({ title: t("users.momoUpdateFailed") || "Échec de la modification MoMo", description: extractErrorMessages(err), variant: "destructive" });
    } finally {
      setVerifyingMomo(false);
    }
  };

  // Add handler for toggling can_process_mobcash
  const handleToggleMobcash = async (canProcessMobcash: boolean) => {
    if (!detailUser?.uid) return;
    setVerifyingMobcash(true);
    try {
      const data = await apiFetch(`auth/admin/users/${detailUser.uid}/update/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ can_process_mobcash: canProcessMobcash }),
        successMessage: canProcessMobcash ? t("users.mobcashAuthorized") || "Mobcash autorisé avec succès" : t("users.mobcashForbidden") || "Mobcash interdit avec succès"
      });
      setDetailUser((prev: any) => prev ? { ...prev, can_process_mobcash: canProcessMobcash } : prev);
    } catch (err: any) {
      toast({ title: t("users.mobcashUpdateFailed") || "Échec de la modification Mobcash", description: extractErrorMessages(err), variant: "destructive" });
    } finally {
      setVerifyingMobcash(false);
    }
  };

  // Add handler for toggling can_process_bulk_payment
  const handleToggleBulkPayment = async (canProcessBulkPayment: boolean) => {
    if (!detailUser?.uid) return;
    setVerifyingBulkPayment(true);
    try {
      const data = await apiFetch(`auth/admin/users/${detailUser.uid}/update/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ can_process_bulk_payment: canProcessBulkPayment }),
        successMessage: canProcessBulkPayment ? t("users.bulkAuthorized") || "Paiement en masse autorisé avec succès" : t("users.bulkForbidden") || "Paiement en masse interdit avec succès"
      });
      setDetailUser((prev: any) => prev ? { ...prev, can_process_bulk_payment: canProcessBulkPayment } : prev);
    } catch (err: any) {
      toast({ title: t("users.bulkUpdateFailed") || "Échec de la modification Paiement en masse", description: extractErrorMessages(err), variant: "destructive" });
    } finally {
      setVerifyingBulkPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-whiten dark:bg-boxdark-2">
      <div className="w-full">

        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
            <div>
              <h1 className="text-base font-bold sm:text-lg sm:text-2xl bg-gradient-to-r from-primary to-meta-3 bg-clip-text text-transparent">
                <span>{t("users.title") || "Utilisateurs"}</span>
              </h1>
              <p className="text-body dark:text-bodydark mt-2 text-lg">
                Gérer et surveiller les comptes utilisateurs
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="bg-white dark:bg-boxdark rounded-lg px-4 py-2 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-gray-700 dark:text-bodydark">
                    <span>{totalCount}</span> <span>utilisateurs</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-bodydark2" />
                <Input
                  placeholder="Rechercher des utilisateurs..."
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
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                </SelectContent>
              </Select>

              {/* View Type */}
              <Select value={viewType} onValueChange={setViewType}>
                <SelectTrigger className="bg-gray-50 dark:bg-meta-4 border-stroke dark:border-strokedark">
                  <SelectValue placeholder="Type de vue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les utilisateurs</SelectItem>
                  <SelectItem value="pending">Utilisateurs en attente</SelectItem>
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
              />

              {/* Bulk Actions */}
              {someSelected && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {/* handle bulk activate */ }}
                    className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Activer la sélection</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {/* handle bulk deactivate */ }}
                    className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    <span>Désactiver la sélection</span>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <CardHeader className="border-b border-gray-100 dark:border-strokedark">
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <span><span>Liste des utilisateurs</span></span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-6 sm:py-10">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-body dark:text-bodydark"><span>Chargement des utilisateurs...</span></span>
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
                      <TableHead className="w-12">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUids(users.map(u => u.uid));
                            } else {
                              setSelectedUids([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead className="font-semibold"><span>Utilisateur</span></TableHead>
                      <TableHead className="font-semibold"><span>Email</span></TableHead>
                      <TableHead className="font-semibold"><span>Statut</span></TableHead>
                      <TableHead className="font-semibold"><span>Vérification</span></TableHead>
                      <TableHead className="font-semibold"><span>Créé le</span></TableHead>
                      <TableHead className="font-semibold text-right"><span>Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.uid} className="hover:bg-gray-50 dark:hover:bg-boxdark-2/50">
                        <TableCell>
                          <Checkbox
                            checked={selectedUids.includes(user.uid)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedUids([...selectedUids, user.uid]);
                              } else {
                                setSelectedUids(selectedUids.filter(id => id !== user.uid));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell data-label="Utilisateur">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {user.display_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                <span>{user.display_name || 'Sans nom'}</span>
                              </div>
                              <div className="text-sm text-body dark:text-bodydark2">
                                <span>ID:</span> <span>{user.uid}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-label="Email">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            <span>{user.email}</span>
                          </div>
                          <div className="text-xs text-body font-mono mt-1 flex items-center space-x-1">
                            <span>ID:</span> <span>{user.uid}</span>
                            <CopyButton value={user.uid} className="h-4 w-4" iconClassName="h-3 w-3" />
                          </div>
                        </TableCell>
                        <TableCell data-label="Statut">
                          <Badge
                            className={
                              user.is_active
                                ? "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300"
                                : "bg-red-200 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                            }
                          >
                            <span>{user.is_active ? 'Actif' : 'Inactif'}</span>
                          </Badge>
                        </TableCell>
                        <TableCell data-label="Vérification">
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant="outline"
                              className={
                                user.email_verified
                                  ? "border-green-200 text-green-700 dark:border-green-700 dark:text-green-300"
                                  : "border-red-200 text-red-700 dark:border-red-700 dark:text-red-300"
                              }
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              <span>{user.email_verified ? 'Vérifié' : 'Non vérifié'}</span>
                            </Badge>
                            <Badge
                              variant="outline"
                              className={
                                user.phone_verified
                                  ? "border-green-200 text-green-700 dark:border-green-700 dark:text-green-300"
                                  : "border-red-200 text-red-700 dark:border-red-700 dark:text-red-300"
                              }
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              <span>{user.phone_verified ? 'Vérifié' : 'Non vérifié'}</span>
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell data-label="Créé le">
                          <div className="text-sm text-body dark:text-bodydark2">
                            <span>{user.created_at}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right" data-label="Actions">
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              onClick={() => handleOpenDetail(user.uid)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-stroke bg-white px-2.5 py-1.5 text-xs font-medium text-body shadow-sm hover:border-primary hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-bodydark"
                            >
                              <Eye className="h-3.5 w-3.5 flex-shrink-0" />
                              Détails
                            </button>
                            <button
                              onClick={() => {
                                setConfirmActionUser(user);
                                setConfirmActionType(user.is_active ? "deactivate" : "activate");
                              }}
                              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-opacity-90 ${user.is_active ? "bg-danger" : "bg-meta-3"}`}
                            >
                              {user.is_active ? (
                                <><XCircle className="h-3.5 w-3.5 flex-shrink-0" />Désactiver</>
                              ) : (
                                <><CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />Activer</>
                              )}
                            </button>
                          </div>
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
              <span>Affichage de</span> <span>{((currentPage - 1) * itemsPerPage) + 1}</span> <span>à</span> <span>{Math.min(currentPage * itemsPerPage, totalCount)}</span> <span>sur</span> <span>{totalCount}</span> <span>résultats</span>
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

        {/* User Details Modal */}
        <Dialog open={detailModalOpen} onOpenChange={(open) => { if (!open) handleCloseDetail() }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle><span>Détails de l'utilisateur</span></DialogTitle>
            </DialogHeader>
            {detailLoading ? (
              <div className="p-4 text-center"><span>Chargement...</span></div>
            ) : detailError ? (
              <ErrorDisplay
                error={detailError}
                variant="inline"
                showRetry={false}
                className="mb-4"
              />
            ) : detailUser ? (
              <div className="space-y-2">
                <div><b>UID:</b> <span>{detailUser.uid}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => {
                      navigator.clipboard.writeText(detailUser.uid);
                      toast({ title: t("common.uidCopied") || "UID copié!" });
                    }}
                    aria-label="Copier l'UID"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div><b>Nom:</b> <span>{detailUser.display_name || `${detailUser.first_name || ""} ${detailUser.last_name || ""}`}</span></div>
                <div><b>Email:</b> <span>{detailUser.email}</span></div>
                <div><b>Téléphone:</b> <span>{detailUser.phone}</span></div>
                <div><b>Statut:</b> <span>{detailUser.is_active ? 'Actif' : 'Inactif'}</span></div>
                <div><b>Email vérifié:</b> <span>{detailUser.email_verified ? 'Oui' : 'Non'}</span>
                  <Switch
                    checked={detailUser.email_verified}
                    disabled={detailLoading || verifyingEmail}
                    onCheckedChange={() => setConfirmEmailToggle(!detailUser.email_verified)}
                    className="ml-2"
                  />
                </div>
                <div><b>Téléphone vérifié:</b> <span>{detailUser.phone_verified ? 'Oui' : 'Non'}</span>
                  <Switch
                    checked={detailUser.phone_verified}
                    disabled={detailLoading || verifyingPhone}
                    onCheckedChange={() => setConfirmPhoneToggle(!detailUser.phone_verified)}
                    className="ml-2"
                  />
                </div>
                <div><b>Méthode de contact:</b> <span>{detailUser.contact_method}</span></div>
                <div><b>Partenaire:</b> <span>{detailUser.is_partner ? 'Oui' : 'Non'}</span>
                  <Switch
                    checked={detailUser.is_partner}
                    disabled={detailLoading || verifyingPartner}
                    onCheckedChange={() => setConfirmPartnerToggle(!detailUser.is_partner)}
                    className="ml-2"
                  />
                </div>
                <div><b>Transactions USSD:</b> <span>{detailUser.can_process_ussd_transaction ? 'Autorisé' : 'Non autorisé'}</span>
                  <Switch
                    checked={detailUser.can_process_ussd_transaction}
                    disabled={detailLoading || verifyingUssd}
                    onCheckedChange={() => setConfirmUssdToggle(!detailUser.can_process_ussd_transaction)}
                    className="ml-2"
                  />
                </div>
                <div><b>{t("users.momo") || "MoMo"}:</b> <span>{detailUser.can_process_momo ? t("users.authorized") || 'Autorisé' : t("users.notAuthorized") || 'Non autorisé'}</span>
                  <Switch
                    checked={detailUser.can_process_momo}
                    disabled={detailLoading || verifyingMomo}
                    onCheckedChange={() => setConfirmMomoToggle(!detailUser.can_process_momo)}
                    className="ml-2"
                  />
                </div>
                <div><b>{t("users.mobcash") || "Mobcash"}:</b> <span>{detailUser.can_process_mobcash ? t("users.authorized") || 'Autorisé' : t("users.notAuthorized") || 'Non autorisé'}</span>
                  <Switch
                    checked={detailUser.can_process_mobcash}
                    disabled={detailLoading || verifyingMobcash}
                    onCheckedChange={() => setConfirmMobcashToggle(!detailUser.can_process_mobcash)}
                    className="ml-2"
                  />
                </div>
                <div><b>{t("users.bulkPayment") || "Paiement en masse"}:</b> <span>{detailUser.can_process_bulk_payment ? t("users.authorized") || 'Autorisé' : t("users.notAuthorized") || 'Non autorisé'}</span>
                  <Switch
                    checked={detailUser.can_process_bulk_payment}
                    disabled={detailLoading || verifyingBulkPayment}
                    onCheckedChange={() => setConfirmBulkPaymentToggle(!detailUser.can_process_bulk_payment)}
                    className="ml-2"
                  />
                </div>
                <div><b>Créé le:</b> <span>{detailUser.created_at ? detailUser.created_at.split("T")[0] : "-"}</span></div>
                <div><b>Dernière connexion:</b> <span>{detailUser.last_login_at ? detailUser.last_login_at.split("T")[0] : "-"}</span></div>
              </div>
            ) : null}
            <DialogClose asChild>
              <Button className="mt-4 w-full"><span>Fermer</span></Button>
            </DialogClose>
          </DialogContent>
        </Dialog>

        {/* Email Verification Confirmation Modal */}
        <Dialog open={confirmEmailToggle !== null} onOpenChange={(open) => { if (!open) setConfirmEmailToggle(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmEmailToggle ? t("users.verifyEmail") || "Vérifier l'email" : t("users.unverifyEmail") || "Ne pas vérifier l'email"}</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-center">
              {confirmEmailToggle
                ? t("users.confirmVerifyEmail") || "Êtes-vous sûr de vouloir vérifier l'email de cet utilisateur ?"
                : t("users.confirmUnverifyEmail") || "Êtes-vous sûr de vouloir ne pas vérifier l'email de cet utilisateur ?"}
            </div>
            <DialogFooter>
              <Button
                className="w-full"
                onClick={async () => {
                  await handleToggleEmailVerified(!!confirmEmailToggle);
                  setConfirmEmailToggle(null);
                }}
                disabled={verifyingEmail}
              >
                {verifyingEmail ? "Vérification..." : "OK"}
              </Button>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => setConfirmEmailToggle(null)}
                disabled={verifyingEmail}
              >
                Annuler
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Phone Verification Confirmation Modal */}
        <Dialog open={confirmPhoneToggle !== null} onOpenChange={(open) => { if (!open) setConfirmPhoneToggle(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmPhoneToggle ? t("users.verifyPhone") || "Vérifier le téléphone" : t("users.unverifyPhone") || "Ne pas vérifier le téléphone"}</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-center">
              {confirmPhoneToggle
                ? t("users.confirmVerifyPhone") || "Êtes-vous sûr de vouloir vérifier le téléphone de cet utilisateur ?"
                : t("users.confirmUnverifyPhone") || "Êtes-vous sûr de vouloir ne pas vérifier le téléphone de cet utilisateur ?"}
            </div>
            <DialogFooter>
              <Button
                className="w-full"
                onClick={async () => {
                  await handleTogglePhoneVerified(!!confirmPhoneToggle);
                  setConfirmPhoneToggle(null);
                }}
                disabled={verifyingPhone}
              >
                {verifyingPhone ? "Vérification..." : "OK"}
              </Button>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => setConfirmPhoneToggle(null)}
                disabled={verifyingPhone}
              >
                Annuler
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Partner Toggle Confirmation Modal */}
        <Dialog open={confirmPartnerToggle !== null} onOpenChange={(open) => { if (!open) setConfirmPartnerToggle(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmPartnerToggle ? t("register.isPartner") || "Activer le statut partenaire" : t("users.disablePartner") || "Désactiver le statut partenaire"}</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-center">
              {confirmPartnerToggle
                ? t("users.confirmTogglePartner") || "Êtes-vous sûr de vouloir activer le statut partenaire ?"
                : t("users.confirmDisablePartner") || "Êtes-vous sûr de vouloir désactiver le statut partenaire ?"}
            </div>
            <DialogFooter>
              <Button
                className="w-full"
                onClick={async () => {
                  await handleTogglePartner(!!confirmPartnerToggle);
                  setConfirmPartnerToggle(null);
                }}
                disabled={verifyingPartner}
              >
                {verifyingPartner ? "Vérification..." : "OK"}
              </Button>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => setConfirmPartnerToggle(null)}
                disabled={verifyingPartner}
              >
                Annuler
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* USSD Toggle Confirmation Modal */}
        <Dialog open={confirmUssdToggle !== null} onOpenChange={(open) => { if (!open) setConfirmUssdToggle(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmUssdToggle ? t("users.authorizeUssd") || "Autoriser les transactions USSD" : t("users.forbidUssd") || "Interdire les transactions USSD"}</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-center">
              {confirmUssdToggle
                ? t("users.confirmAuthorizeUssd") || "Êtes-vous sûr de vouloir autoriser les transactions USSD pour cet utilisateur ?"
                : t("users.confirmForbidUssd") || "Êtes-vous sûr de vouloir interdire les transactions USSD pour cet utilisateur ?"}
            </div>
            <DialogFooter>
              <Button
                className="w-full"
                onClick={async () => {
                  await handleToggleUssd(!!confirmUssdToggle);
                  setConfirmUssdToggle(null);
                }}
                disabled={verifyingUssd}
              >
                {verifyingUssd ? "Modification..." : "OK"}
              </Button>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => setConfirmUssdToggle(null)}
              >
                Annuler
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MoMo Toggle Confirmation Modal */}
        <Dialog open={confirmMomoToggle !== null} onOpenChange={(open) => { if (!open) setConfirmMomoToggle(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmMomoToggle ? t("users.authorizeMomo") || "Autoriser MoMo" : t("users.forbidMomo") || "Interdire MoMo"}</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-center">
              {confirmMomoToggle
                ? t("users.confirmAuthorizeMomo") || "Êtes-vous sûr de vouloir autoriser MoMo pour cet utilisateur ?"
                : t("users.confirmForbidMomo") || "Êtes-vous sûr de vouloir interdire MoMo pour cet utilisateur ?"}
            </div>
            <DialogFooter>
              <Button
                className="w-full"
                onClick={async () => {
                  await handleToggleMomo(!!confirmMomoToggle);
                  setConfirmMomoToggle(null);
                }}
                disabled={verifyingMomo}
              >
                {verifyingMomo ? "Modification..." : "OK"}
              </Button>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => setConfirmMomoToggle(null)}
              >
                Annuler
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Mobcash Toggle Confirmation Modal */}
        <Dialog open={confirmMobcashToggle !== null} onOpenChange={(open) => { if (!open) setConfirmMobcashToggle(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmMobcashToggle ? t("users.authorizeMobcash") || "Autoriser Mobcash" : t("users.forbidMobcash") || "Interdire Mobcash"}</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-center">
              {confirmMobcashToggle
                ? t("users.confirmAuthorizeMobcash") || "Êtes-vous sûr de vouloir autoriser Mobcash pour cet utilisateur ?"
                : t("users.confirmForbidMobcash") || "Êtes-vous sûr de vouloir interdire Mobcash pour cet utilisateur ?"}
            </div>
            <DialogFooter>
              <Button
                className="w-full"
                onClick={async () => {
                  await handleToggleMobcash(!!confirmMobcashToggle);
                  setConfirmMobcashToggle(null);
                }}
                disabled={verifyingMobcash}
              >
                {verifyingMobcash ? "Modification..." : "OK"}
              </Button>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => setConfirmMobcashToggle(null)}
              >
                Annuler
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Payment Toggle Confirmation Modal */}
        <Dialog open={confirmBulkPaymentToggle !== null} onOpenChange={(open) => { if (!open) setConfirmBulkPaymentToggle(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmBulkPaymentToggle ? t("users.authorizeBulk") || "Autoriser Paiement en masse" : t("users.forbidBulk") || "Interdire Paiement en masse"}</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-center">
              {confirmBulkPaymentToggle
                ? t("users.confirmAuthorizeBulk") || "Êtes-vous sûr de vouloir autoriser le paiement en masse pour cet utilisateur ?"
                : t("users.confirmForbidBulk") || "Êtes-vous sûr de vouloir interdire le paiement en masse pour cet utilisateur ?"}
            </div>
            <DialogFooter>
              <Button
                className="w-full"
                onClick={async () => {
                  await handleToggleBulkPayment(!!confirmBulkPaymentToggle);
                  setConfirmBulkPaymentToggle(null);
                }}
                disabled={verifyingBulkPayment}
              >
                {verifyingBulkPayment ? "Modification..." : "OK"}
              </Button>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => setConfirmBulkPaymentToggle(null)}
              >
                Annuler
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Activate/Deactivate Confirmation Modal */}
        <Dialog open={!!confirmActionType} onOpenChange={(open) => { if (!open) { setConfirmActionType(null); setConfirmActionUser(null); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {confirmActionType === "activate"
                  ? "Activer l'utilisateur"
                  : "Désactiver l'utilisateur"}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 text-center">
              {confirmActionType === "activate"
                ? "Êtes-vous sûr de vouloir activer cet utilisateur ?"
                : "Êtes-vous sûr de vouloir désactiver cet utilisateur ?"}
            </div>
            <DialogFooter>
              <Button
                className="w-full"
                onClick={async () => {
                  if (confirmActionUser) {
                    if (confirmActionType === "activate") {
                      await handleActivate(confirmActionUser);
                    } else {
                      await handleDeactivate(confirmActionUser);
                    }
                  }
                  setConfirmActionType(null);
                  setConfirmActionUser(null);
                }}
                disabled={activatingUid === confirmActionUser?.uid || deactivatingUid === confirmActionUser?.uid}
              >
                {confirmActionType === "activate"
                  ? "Activer"
                  : "Désactiver"}
              </Button>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => {
                  setConfirmActionType(null);
                  setConfirmActionUser(null);
                }}
                disabled={activatingUid === confirmActionUser?.uid || deactivatingUid === confirmActionUser?.uid}
              >
                Annuler
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div >
  )
}


import { Suspense } from 'react'
import { getApiBaseUrl } from "@/lib/env-config"

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <UsersPageContent />
    </Suspense>
  )
}
