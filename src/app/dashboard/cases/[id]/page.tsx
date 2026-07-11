'use client';

/**
 * Case Detail Page - View and manage a single case
 * Available to: Operator, ACF, Commissioner, Admin
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  Ship,
  MapPin,
  User,
  Phone,
  FileText,
  FileImage,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Eye,
  ExternalLink,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { caseApi, CaseDetail, CaseStatus } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const caseId = params.id as string;

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Disposal dialog
  const [disposeDialogOpen, setDisposeDialogOpen] = useState(false);
  const [disposalReason, setDisposalReason] = useState('');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [disposing, setDisposing] = useState(false);

  // Edit dialog (Admin only)
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    caseNumber: '',
    hearingDate: '',
    hearingTime: '',
    depth: '',
  });
  const [saving, setSaving] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Fetch case data
  useEffect(() => {
    const fetchCase = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await caseApi.getCaseById(caseId);
        if (response.data.success && response.data.data) {
          setCaseData(response.data.data);
        } else {
          setError('Case not found');
        }
      } catch (err: any) {
        console.error('Error fetching case:', err);
        setError(err.response?.data?.error || 'Failed to load case');
      } finally {
        setLoading(false);
      }
    };

    fetchCase();
  }, [caseId]);

  // Handle dispose case
  const handleDispose = async () => {
    const expectedAmount = caseData?.penaltyAmount || 0;
    const paid = Number(paidAmount) || 0;

    // If paid amount is less than expected, require reason
    if (paid < expectedAmount && disposalReason.length < 100) {
      toast.error('Please provide a reason (min 100 characters) for less payment.');
      return;
    }

    try {
      setDisposing(true);
      const reason = paid >= expectedAmount
        ? `Full penalty amount paid: Rs. ${paid.toLocaleString('en-IN')}`
        : disposalReason;
      await caseApi.disposeCase(caseId, reason, paid);
      toast.success('The case has been successfully disposed.');
      setDisposeDialogOpen(false);
      setPaidAmount('');
      setDisposalReason('');
      // Refresh case data
      const response = await caseApi.getCaseById(caseId);
      if (response.data.success && response.data.data) {
        setCaseData(response.data.data);
      }
    } catch (err: unknown) {
      console.error('Error disposing case:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to dispose case';
      toast.error(errorMessage);
    } finally {
      setDisposing(false);
    }
  };

  // Handle opening edit dialog - populate form with current data
  const handleOpenEditDialog = () => {
    if (caseData) {
      setEditData({
        caseNumber: caseData.caseNumber || '',
        hearingDate: caseData.hearingDate ? caseData.hearingDate.split('T')[0] : '',
        hearingTime: caseData.hearingTime || '',
        depth: caseData.depth || '',
      });
      setEditDialogOpen(true);
    }
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      await caseApi.updateCase(caseId, {
        caseNumber: editData.caseNumber || undefined,
        hearingDate: editData.hearingDate || undefined,
        hearingTime: editData.hearingTime || undefined,
        depth: editData.depth || undefined,
      } as any);
      toast.success('Case details updated successfully.');
      setEditDialogOpen(false);
      // Refresh case data
      const response = await caseApi.getCaseById(caseId);
      if (response.data.success && response.data.data) {
        setCaseData(response.data.data);
      }
    } catch (err: unknown) {
      console.error('Error updating case:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update case';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: CaseStatus) => {
    const statusConfig: Record<CaseStatus, { label: string; className: string; icon: React.ReactNode }> = {
      reported: { label: 'Reported', className: 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100', icon: <AlertCircle className="h-3 w-3" /> },
      under_investigation: { label: 'Under Investigation', className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', icon: <Clock className="h-3 w-3" /> },
      hearing_scheduled: { label: 'Hearing Scheduled', className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800', icon: <FileText className="h-3 w-3" /> },
      disposed: { label: 'Disposed', className: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-100', icon: <CheckCircle2 className="h-3 w-3" /> },
      appealed: { label: 'Appealed', className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', icon: <XCircle className="h-3 w-3" /> },
    };

    const config = statusConfig[status] || statusConfig.reported;

    return (
      <Badge variant="outline" className={cn("gap-1", config.className)}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  // Only Admin and ACF can dispose cases - Commissioner/RDC can only view
  const canDispose = (user?.role === 'admin' || user?.role === 'acf') && caseData?.status !== 'disposed';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/cases">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Case Details</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Case not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/cases">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {caseData.caseNumber || `Case ${caseData.id.slice(0, 8)}`}
              </h1>
              {getStatusBadge(caseData.status)}
            </div>
            <p className="text-muted-foreground">
              Created {formatDistanceToNow(new Date(caseData.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canDispose && (
            <Dialog open={disposeDialogOpen} onOpenChange={(open) => {
              setDisposeDialogOpen(open);
              if (open && caseData?.penaltyAmount) {
                setPaidAmount(caseData.penaltyAmount.toString());
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Dispose Case
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]" style={{ backgroundColor: '#ffffff' }}>
                <DialogHeader style={{ backgroundColor: '#ffffff' }}>
                  <DialogTitle>Dispose Case</DialogTitle>
                  <DialogDescription>
                    Enter the paid penalty amount. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4" style={{ backgroundColor: '#ffffff' }}>
                  <div className="space-y-2">
                    <Label>Assigned Penalty Amount</Label>
                    <div className="text-lg font-semibold text-primary">
                      Rs. {caseData?.penaltyAmount?.toLocaleString('en-IN') || '0'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paidAmount">Paid Penalty Amount *</Label>
                    <Input
                      id="paidAmount"
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      placeholder="Enter amount paid by vessel owner"
                    />
                  </div>
                  <div
                    className={cn(
                      "space-y-2 overflow-hidden transition-all duration-300 ease-in-out",
                      paidAmount && Number(paidAmount) < (caseData?.penaltyAmount || 0)
                        ? "max-h-[300px] opacity-100"
                        : "max-h-0 opacity-0"
                    )}
                  >
                    <Label htmlFor="disposalReason">
                      Reason for Less Payment * <span className="text-muted-foreground">(min 100 characters)</span>
                    </Label>
                    <Textarea
                      id="disposalReason"
                      value={disposalReason}
                      onChange={(e) => setDisposalReason(e.target.value)}
                      placeholder="Enter reason why less amount was paid..."
                      rows={4}
                    />
                    <p className={cn(
                      "text-xs",
                      disposalReason.length < 100 ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {disposalReason.length}/100 characters
                    </p>
                  </div>
                </div>
                <DialogFooter style={{ backgroundColor: '#ffffff' }}>
                  <Button variant="outline" onClick={() => setDisposeDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDispose}
                    disabled={
                      disposing ||
                      !paidAmount ||
                      (Number(paidAmount) < (caseData?.penaltyAmount || 0) && disposalReason.length < 100)
                    }
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {disposing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Dispose
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Edit Button - Admin Only */}
          {isAdmin && (
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={handleOpenEditDialog}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Details
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]" style={{ backgroundColor: '#ffffff' }}>
                <DialogHeader style={{ backgroundColor: '#ffffff' }}>
                  <DialogTitle>Edit Case Details</DialogTitle>
                  <DialogDescription>
                    Update case number, hearing date/time, and depth (for trawling).
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4" style={{ backgroundColor: '#ffffff' }}>
                  <div className="space-y-2">
                    <Label htmlFor="editCaseNumber">Case Number (केस क्र.)</Label>
                    <Input
                      id="editCaseNumber"
                      value={editData.caseNumber}
                      onChange={(e) => setEditData(prev => ({ ...prev, caseNumber: e.target.value }))}
                      placeholder="MH/FISH/2026/06/XXXXX/2026"
                      className="font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editHearingDate">Hearing Date</Label>
                      <Input
                        id="editHearingDate"
                        type="date"
                        value={editData.hearingDate}
                        onChange={(e) => setEditData(prev => ({ ...prev, hearingDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editHearingTime">Hearing Time</Label>
                      <Input
                        id="editHearingTime"
                        type="time"
                        value={editData.hearingTime}
                        onChange={(e) => setEditData(prev => ({ ...prev, hearingTime: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editDepth">Depth (वाव/Fathoms) - Trawling Only</Label>
                    <Input
                      id="editDepth"
                      value={editData.depth}
                      onChange={(e) => setEditData(prev => ({ ...prev, depth: e.target.value }))}
                      placeholder="e.g., 5, 10, 5-10"
                    />
                    <p className="text-xs text-muted-foreground">
                      Only applicable for trawling violations.
                    </p>
                  </div>
                </div>
                <DialogFooter style={{ backgroundColor: '#ffffff' }}>
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdit} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vessel Information */}
          <Card className="transition-all duration-200 hover:shadow-lg hover:border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship className="h-5 w-5" />
                Vessel Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Vessel Name</p>
                  <p className="font-medium">{caseData.originalVesselName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Registration Number</p>
                  <p className="font-medium">{caseData.originalVesselReg || '-'}</p>
                </div>
                {caseData.vessel && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Violations</p>
                      <Badge variant="secondary">{caseData.vessel.totalViolations} violations</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Offence Occurrence</p>
                      <Badge variant={caseData.offenceOccurrence > 1 ? 'destructive' : 'outline'}>
                        {getOrdinal(caseData.offenceOccurrence)} offence
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Owner Information */}
          <Card className="transition-all duration-200 hover:shadow-lg hover:border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Owner Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Owner Name</p>
                  <p className="font-medium">{caseData.ownerName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Primary Contact</p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {caseData.ownerContact1 || '-'}
                  </p>
                </div>
                {caseData.ownerContact2 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Secondary Contact</p>
                    <p className="font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {caseData.ownerContact2}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="transition-all duration-200 hover:shadow-lg hover:border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Enforcement Area</p>
                  <p className="font-medium">{caseData.enforcementArea?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Flying Location</p>
                  <p className="font-medium">{caseData.flyingLocation?.name || '-'}</p>
                </div>
                {(caseData.latitude || caseData.longitude) && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Coordinates</p>
                    <p className="font-medium flex items-center gap-2">
                      {caseData.latitude}, {caseData.longitude}
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={`https://www.google.com/maps?q=${caseData.latitude},${caseData.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Violation Details */}
          <Card className="transition-all duration-200 hover:shadow-lg hover:border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Violation Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Case Number - Prominent Display */}
              {caseData.caseNumber && (
                <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">Case Number (केस क्र.)</p>
                  <p className="font-bold text-lg font-mono">{caseData.caseNumber}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Violation Type</p>
                  <p className="font-medium">{caseData.violationType?.name || '-'}</p>
                  {caseData.violationType?.code && (
                    <Badge variant="outline" className="mt-1">
                      {caseData.violationType.code}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Observation Date</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(caseData.observationDate), 'dd MMM yyyy')}
                  </p>
                </div>
                {caseData.hearingDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Hearing Date</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(caseData.hearingDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                )}
                {caseData.hearingTime && (
                  <div>
                    <p className="text-sm text-muted-foreground">Hearing Time</p>
                    <p className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {caseData.hearingTime}
                    </p>
                  </div>
                )}
                {caseData.fishingLicenseType && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fishing License Type</p>
                    <p className="font-medium">{caseData.fishingLicenseType.name}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Penalty Amount</p>
                  <p className="font-medium text-lg text-primary">
                    Rs. {caseData.penaltyAmount?.toLocaleString('en-IN') || '0'}
                  </p>
                </div>
                {/* Depth - Only for trawling violations */}
                {caseData.depth && (
                  <div className="col-span-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-600">Depth (वाव/Fathoms)</p>
                    <p className="font-bold text-blue-700">{caseData.depth} वाव</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Evidence Images */}
          {caseData.evidence && caseData.evidence.length > 0 && (
            <Card className="transition-all duration-200 hover:shadow-lg hover:border-primary/30">
              <CardHeader>
                <CardTitle>Evidence Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {caseData.evidence.map((ev, index) => {
                    // Check if URL is a Google Drive link (not a direct image)
                    const isGoogleDriveLink = ev.evidenceUrl.includes('drive.google.com');
                    // Check if URL is a direct image URL (S3, etc.)
                    const isDirectImageUrl = ev.evidenceUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) ||
                      ev.evidenceUrl.includes('s3.') ||
                      ev.evidenceUrl.includes('amazonaws.com');

                    return (
                      <div
                        key={ev.id}
                        className="relative aspect-video rounded-lg border overflow-hidden bg-muted"
                      >
                        {isDirectImageUrl && !isGoogleDriveLink ? (
                          <Image
                            src={ev.evidenceUrl}
                            alt={`Evidence ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                            <FileImage className="h-12 w-12 mb-2" />
                            <p className="text-sm">External Image</p>
                            <p className="text-xs">{isGoogleDriveLink ? 'Google Drive' : 'Click to view'}</p>
                          </div>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute bottom-2 right-2"
                          asChild
                        >
                          <a href={ev.evidenceUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </a>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disposal Information */}
          {caseData.status === 'disposed' && caseData.disposalReason && (
            <Card className="transition-all duration-200 hover:shadow-lg hover:border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Disposal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Disposed At</p>
                    <p className="font-medium">
                      {caseData.disposedAt ? format(new Date(caseData.disposedAt), 'dd MMM yyyy, hh:mm a') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Disposal Reason</p>
                    <p className="mt-1 p-3 bg-muted rounded-lg">{caseData.disposalReason}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Penalty Summary */}
          <Card className="transition-all duration-200 hover:shadow-lg hover:border-primary/30">
            <CardHeader>
              <CardTitle>Penalty Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Penalty Imposed</span>
                  <span className="font-medium">
                    Rs. {caseData.penalty?.penaltyImposed?.toLocaleString('en-IN') || caseData.penaltyAmount?.toLocaleString('en-IN') || '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Penalty Recovered</span>
                  <span className="font-medium text-green-600">
                    Rs. {caseData.penalty?.penaltyRecovered?.toLocaleString('en-IN') || '0'}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">Pending</span>
                  <span className="font-medium text-amber-600">
                    Rs. {((caseData.penalty?.penaltyImposed || caseData.penaltyAmount || 0) - (caseData.penalty?.penaltyRecovered || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notices */}
          <Card className="transition-all duration-200 hover:shadow-lg hover:border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Notices
              </CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.notices && caseData.notices.length > 0 ? (
                <div className="space-y-2">
                  {caseData.notices.map((notice) => (
                    <div key={notice.id} className="flex items-center gap-3 p-3 bg-muted/50 border rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                        <FileText className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{notice.noticeNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(notice.generatedAt), 'dd MMM yyyy, hh:mm a')}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-green-100 text-green-800 border-green-300"
                      >
                        {notice.status === 'sent' ? 'Sent' : notice.status === 'generated' ? 'Generated' : notice.status}
                      </Badge>
                      {notice.documentUrl && (
                        <Button variant="outline" size="sm" className="flex-shrink-0 gap-1.5" asChild>
                          <a href={notice.documentUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3.5 w-3.5" />
                            PDF
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No notices generated yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {(caseData.internalNotes || caseData.remarksAcf) && (
            <Card className="transition-all duration-200 hover:shadow-lg hover:border-primary/30">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {caseData.internalNotes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Internal Notes</p>
                    <p className="text-sm p-2 bg-muted rounded">{caseData.internalNotes}</p>
                  </div>
                )}
                {caseData.remarksAcf && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">ACF Remarks</p>
                    <p className="text-sm p-2 bg-muted rounded">{caseData.remarksAcf}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

    </div>
  );
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
