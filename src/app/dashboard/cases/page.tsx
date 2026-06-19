'use client';

/**
 * Cases List Page - View and manage violation cases
 * Available to: Operator, ACF, Commissioner, Admin
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { caseApi, CaseListItem, CaseStats, CaseStatus, ViolationType } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

export default function CasesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [stats, setStats] = useState<CaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CaseStatus | 'all'>('all');
  const [violationTypeId, setViolationTypeId] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<{ id: string; caseNumber: string } | null>(null);
  const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);

  const limit = 20;

  // Fetch cases
  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: Record<string, string | number> = {
          page,
          limit,
        };

        if (search) params.search = search;
        if (status !== 'all') params.status = status;
        if (violationTypeId !== 'all') params.violationTypeId = violationTypeId;
        if (timeFilter !== 'all') params.timeFilter = timeFilter;

        const response = await caseApi.getCases(params);

        if (response.data.success && response.data.data) {
          setCases(response.data.data.cases);
          setTotalPages(response.data.data.totalPages);
          setTotal(response.data.data.total);
        }
      } catch (err) {
        console.error('Error fetching cases:', err);
        setError('Failed to load cases');
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [page, search, status, violationTypeId, timeFilter]);

  // Fetch stats and violation types
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await caseApi.getStats();
        if (response.data.success && response.data.data) {
          setStats(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    const fetchViolationTypes = async () => {
      try {
        const response = await caseApi.getViolationTypes();
        if (response.data.success && response.data.data) {
          setViolationTypes(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching violation types:', err);
      }
    };

    fetchStats();
    fetchViolationTypes();
  }, []);

  const getStatusBadge = (status: CaseStatus) => {
    const statusConfig: Record<CaseStatus, { label: string; className: string; icon: React.ReactNode }> = {
      reported: { label: 'Reported', className: 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100', icon: <AlertCircle className="h-3 w-3" /> },
      under_investigation: { label: 'Under Investigation', className: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100', icon: <Clock className="h-3 w-3" /> },
      hearing_scheduled: { label: 'Hearing Scheduled', className: 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-100', icon: <FileText className="h-3 w-3" /> },
      disposed: { label: 'Disposed', className: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-100', icon: <CheckCircle2 className="h-3 w-3" /> },
      appealed: { label: 'Appealed', className: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-100', icon: <XCircle className="h-3 w-3" /> },
    };

    const config = statusConfig[status] || statusConfig.reported;

    return (
      <Badge variant="outline" className={`gap-1 ${config.className}`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const canCreateCase = user?.role === 'admin' || user?.role === 'operator';

  const handleDownloadPdf = async (caseId: string, caseNumber: string) => {
    try {
      setDownloadingId(caseId);
      const response = await caseApi.generateCasePdf(caseId);

      if (response.data.success && response.data.data?.pdfUrl) {
        // Open PDF in new tab or download
        window.open(response.data.data.pdfUrl, '_blank');
        toast.success(`PDF for case ${caseNumber} downloaded successfully`);
      } else {
        toast.error('Failed to generate PDF');
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
      toast.error('Failed to download PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const openDeleteDialog = (caseId: string, caseNumber: string) => {
    setCaseToDelete({ id: caseId, caseNumber });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!caseToDelete) return;

    try {
      setDeletingId(caseToDelete.id);
      const response = await caseApi.deleteCase(caseToDelete.id);

      if (response.data.success) {
        toast.success(`Case ${caseToDelete.caseNumber} deleted successfully`);
        // Remove the deleted case from the list
        setCases((prev) => prev.filter((c) => c.id !== caseToDelete.id));
        setTotal((prev) => prev - 1);
        // Update stats
        if (stats) {
          setStats({
            ...stats,
            totalCases: stats.totalCases - 1,
          });
        }
        setDeleteDialogOpen(false);
        setCaseToDelete(null);
      } else {
        toast.error(response.data.error || 'Failed to delete case');
      }
    } catch (err) {
      console.error('Error deleting case:', err);
      toast.error('Failed to delete case');
    } finally {
      setDeletingId(null);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cases</h1>
          <p className="text-muted-foreground">
            Manage fishing violation cases
          </p>
        </div>
        {canCreateCase && (
          <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
            <Link href="/dashboard/cases/new">
              <Plus className="h-4 w-4 mr-2" />
              New Case
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.totalCases}</div>
              <p className="text-xs text-muted-foreground">Total Cases</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-amber-600">{stats.pendingCases}</div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{stats.disposedCases}</div>
              <p className="text-xs text-muted-foreground">Disposed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by case number, vessel, owner..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as CaseStatus | 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="reported">Reported</SelectItem>
                <SelectItem value="under_investigation">Under Investigation</SelectItem>
                <SelectItem value="hearing_scheduled">Hearing Scheduled</SelectItem>
                <SelectItem value="disposed">Disposed</SelectItem>
                <SelectItem value="appealed">Appealed</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={violationTypeId}
              onValueChange={(value) => {
                setViolationTypeId(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Violation Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Violations</SelectItem>
                {violationTypes.map((vt) => (
                  <SelectItem key={vt.id} value={vt.id}>{vt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={timeFilter}
              onValueChange={(value) => {
                setTimeFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-destructive">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          ) : cases.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No cases found</h3>
              <p className="text-muted-foreground mb-4">
                {search || status !== 'all' || violationTypeId !== 'all' || timeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first case to get started'}
              </p>
              {canCreateCase && (
                <Button asChild>
                  <Link href="/dashboard/cases/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Case
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vessel</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Violation</TableHead>
                  <TableHead>Penalty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((caseItem) => (
                  <TableRow key={caseItem.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {caseItem.caseNumber || caseItem.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(caseItem.observationDate), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {caseItem.originalVesselName || caseItem.vessel?.name || '-'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {caseItem.originalVesselReg || caseItem.vessel?.registrationNumber || '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {caseItem.ownerName || '-'}
                    </TableCell>
                    <TableCell>
                      {caseItem.violationType?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {caseItem.penaltyAmount
                        ? `Rs. ${caseItem.penaltyAmount.toLocaleString('en-IN')}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(caseItem.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPdf(caseItem.id, caseItem.caseNumber || caseItem.id.slice(0, 8))}
                          disabled={downloadingId === caseItem.id}
                          title="Download PDF"
                        >
                          {downloadingId === caseItem.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/cases/${caseItem.id}`)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(caseItem.id, caseItem.caseNumber || caseItem.id.slice(0, 8))}
                            title="Delete Case"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} cases
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-red-600 text-xl font-semibold">
              Delete Case
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2 text-left">
              Are you sure you want to delete case{' '}
              <span className="font-semibold text-gray-900">{caseToDelete?.caseNumber}</span>?
              <br /><br />
              This action cannot be undone and will permanently remove the case along with all associated evidence and records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-row justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setCaseToDelete(null);
              }}
              disabled={deletingId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deletingId !== null}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingId !== null ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Case'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
