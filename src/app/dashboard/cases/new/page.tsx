'use client';

/**
 * New Case Form - Create a new violation case
 * Available to: Operator, Admin
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Upload,
  X,
  Calculator,
  AlertCircle,
  Loader2,
  Ship,
  MapPin,
  User,
  Phone,
  FileText,
  Check,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { caseApi, VesselSuggestion, ViolationType, FishingLicenseType, PenaltyCalculation } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CasePreviewDialog } from '@/components/case/CasePreviewDialog';

interface FormData {
  // Case number (auto-generated but editable)
  caseNumber: string;

  // Vessel info
  vesselId: string | null;
  originalVesselName: string;
  originalVesselReg: string;

  // Owner info
  ownerName: string;
  ownerEmail: string;
  ownerContact1: string;
  ownerContact2: string;
  ownerAddress: string;
  ownerTaluka: string;
  ownerDistrict: string;

  // Location
  districtId: string;
  flyingLocationId: string;
  latitude: string;
  longitude: string;

  // Violation details
  violationTypeId: string;
  fishingLicenseTypeId: string;
  observationDate: string;
  hearingDate: string;
  hearingTime: string;
  description: string;

  // Trawling specific
  depth: string; // Depth in fathoms (वाव) - only for trawling violations

  // Act/Section (कलम)
  actKalam: string;

  // Images
  images: File[];
}

interface District {
  id: string;
  name: string;
  code: string;
}

interface FlyingLocation {
  id: string;
  name: string;
}

export default function NewCasePage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Generate default case number
  const generateDefaultCaseNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
    return `MH/FISH/${year}/${month}/${random}/${year}`;
  };

  // Form data
  const [formData, setFormData] = useState<FormData>({
    caseNumber: generateDefaultCaseNumber(),
    vesselId: null,
    originalVesselName: '',
    originalVesselReg: '',
    ownerName: '',
    ownerEmail: '',
    ownerContact1: '',
    ownerContact2: '',
    ownerAddress: '',
    ownerTaluka: '',
    ownerDistrict: '',
    districtId: '',
    flyingLocationId: '',
    latitude: '',
    longitude: '',
    violationTypeId: '',
    fishingLicenseTypeId: '',
    observationDate: new Date().toISOString().split('T')[0],
    hearingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    hearingTime: '11:00',
    description: '',
    depth: '',
    actKalam: '',
    images: [],
  });

  // Dropdown data
  const [districts, setDistricts] = useState<District[]>([]);
  const [flyingLocations, setFlyingLocations] = useState<FlyingLocation[]>([]);
  const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
  const [licenseTypes, setLicenseTypes] = useState<FishingLicenseType[]>([]);

  // Vessel search - inline suggestions
  const [vesselSuggestions, setVesselSuggestions] = useState<VesselSuggestion[]>([]);
  const [searchingVessels, setSearchingVessels] = useState(false);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showRegSuggestions, setShowRegSuggestions] = useState(false);

  // Penalty calculation - editable
  const [penaltyInfo, setPenaltyInfo] = useState<PenaltyCalculation | null>(null);
  const [calculatingPenalty, setCalculatingPenalty] = useState(false);
  const [editablePenalty, setEditablePenalty] = useState({
    processingFee: 20000,
    violationPenalty: 0,
    occurrence: 1,
  });

  // Image previews
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Preview dialog
  const [showPreview, setShowPreview] = useState(false);

  // ACF Certificate status for digital signing
  const [certificateStatus, setCertificateStatus] = useState<{
    hasCertificate: boolean;
    acfName?: string;
    error?: string;
  } | null>(null);
  const [checkingCertificate, setCheckingCertificate] = useState(false);

  // Form validation - check if all mandatory fields are filled
  const isFormValid =
    formData.originalVesselName.trim() !== '' &&
    formData.originalVesselReg.trim() !== '' &&
    formData.ownerName.trim() !== '' &&
    formData.ownerContact1.trim() !== '' &&
    formData.districtId !== '' &&
    formData.flyingLocationId !== '' &&
    formData.violationTypeId !== '';

  // Get preview data with display names
  const getPreviewData = () => {
    const district = districts.find((d) => d.id === formData.districtId);
    const flyingLocation = flyingLocations.find((l) => l.id === formData.flyingLocationId);
    const violationType = violationTypes.find((v) => v.id === formData.violationTypeId);
    const licenseType = licenseTypes.find((l) => l.id === formData.fishingLicenseTypeId);

    return {
      caseNumber: formData.caseNumber,
      vesselName: formData.originalVesselName,
      registrationNumber: formData.originalVesselReg,
      ownerName: formData.ownerName,
      ownerAddress: formData.ownerAddress,
      ownerTaluka: formData.ownerTaluka,
      ownerDistrict: formData.ownerDistrict,
      districtName: district?.name || '',
      flyingLocationName: flyingLocation?.name || '',
      latitude: formData.latitude,
      longitude: formData.longitude,
      violationTypeName: violationType?.name || '',
      fishingLicenseTypeName: licenseType?.name || '',
      observationDate: formData.observationDate,
      depth: formData.depth,
      actKalam: formData.actKalam,
      hearingDate: formData.hearingDate,
      hearingTime: formData.hearingTime,
      processingFee: editablePenalty.processingFee,
      violationPenalty: editablePenalty.violationPenalty,
      totalPenalty: editablePenalty.processingFee + editablePenalty.violationPenalty,
      occurrence: editablePenalty.occurrence,
      images: imagePreviews, // Pass base64 image previews
    };
  };

  // Fetch dropdown data on mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        setLoading(true);

        const [districtsRes, violationsRes, licensesRes] = await Promise.all([
          caseApi.getDistricts(),
          caseApi.getViolationTypes(),
          caseApi.getLicenseTypes(),
        ]);

        if (districtsRes.data.success && districtsRes.data.data) {
          setDistricts(districtsRes.data.data);
        }
        if (violationsRes.data.success && violationsRes.data.data) {
          setViolationTypes(violationsRes.data.data);
        }
        if (licensesRes.data.success && licensesRes.data.data) {
          setLicenseTypes(licensesRes.data.data);
        }
      } catch (err) {
        console.error('Error fetching dropdown data:', err);
        toast.error('Failed to load form data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchDropdownData();
  }, []);

  // Fetch flying locations when district changes
  useEffect(() => {
    const fetchFlyingLocations = async () => {
      if (!formData.districtId) {
        setFlyingLocations([]);
        return;
      }

      try {
        const response = await caseApi.getFlyingLocations(formData.districtId);
        if (response.data.success && response.data.data) {
          setFlyingLocations(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching flying locations:', err);
      }
    };

    fetchFlyingLocations();
  }, [formData.districtId]);

  // Check ACF certificate status when district changes
  useEffect(() => {
    const checkCertificateStatus = async () => {
      if (!formData.districtId) {
        setCertificateStatus(null);
        return;
      }

      try {
        setCheckingCertificate(true);
        const response = await caseApi.checkCertificateStatus(formData.districtId);
        if (response.data.success && response.data.data) {
          setCertificateStatus(response.data.data);
        }
      } catch (err) {
        console.error('Error checking certificate status:', err);
        setCertificateStatus(null);
      } finally {
        setCheckingCertificate(false);
      }
    };

    checkCertificateStatus();
  }, [formData.districtId]);

  // Search vessels with debounce based on name or registration
  useEffect(() => {
    const searchVessels = async () => {
      const query = formData.originalVesselName || formData.originalVesselReg;
      if (query.length < 2) {
        setVesselSuggestions([]);
        return;
      }

      try {
        setSearchingVessels(true);
        const response = await caseApi.searchVessels(query, 5);
        if (response.data.success && response.data.data) {
          setVesselSuggestions(response.data.data);
        }
      } catch (err) {
        console.error('Error searching vessels:', err);
      } finally {
        setSearchingVessels(false);
      }
    };

    const debounce = setTimeout(searchVessels, 300);
    return () => clearTimeout(debounce);
  }, [formData.originalVesselName, formData.originalVesselReg]);

  // Calculate penalty when violation type or vessel changes
  useEffect(() => {
    const fetchPenalty = async () => {
      if (!formData.violationTypeId) {
        setPenaltyInfo(null);
        setEditablePenalty({
          processingFee: 20000,
          violationPenalty: 0,
          occurrence: 1,
        });
        return;
      }

      try {
        setCalculatingPenalty(true);
        const response = await caseApi.calculatePenalty(
          formData.violationTypeId,
          formData.vesselId || undefined
        );
        if (response.data.success && response.data.data) {
          const data = response.data.data;
          setPenaltyInfo(data);
          // Use baseAmount and violationPenalty from API
          setEditablePenalty({
            processingFee: data.baseAmount,
            violationPenalty: data.violationPenalty,
            occurrence: data.occurrence,
          });
        }
      } catch (err) {
        console.error('Error calculating penalty:', err);
      } finally {
        setCalculatingPenalty(false);
      }
    };

    fetchPenalty();
  }, [formData.violationTypeId, formData.vesselId]);

  // Re-fetch penalty when occurrence is manually changed
  const handleOccurrenceChange = async (newOccurrence: number) => {
    setEditablePenalty(prev => ({ ...prev, occurrence: newOccurrence }));

    if (!formData.violationTypeId) return;

    try {
      setCalculatingPenalty(true);

      // Run API call and minimum delay in parallel
      const [response] = await Promise.all([
        caseApi.calculatePenalty(
          formData.violationTypeId,
          formData.vesselId || undefined,
          newOccurrence
        ),
        new Promise(resolve => setTimeout(resolve, 800)) // Minimum 800ms loader
      ]);

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setPenaltyInfo(data);
        // Update penalty values but keep the user's occurrence
        setEditablePenalty({
          processingFee: data.baseAmount,
          violationPenalty: data.violationPenalty,
          occurrence: newOccurrence,
        });
      }
    } catch (err) {
      console.error('Error calculating penalty:', err);
    } finally {
      setCalculatingPenalty(false);
    }
  };

  // Handle vessel selection from suggestions
  const handleSelectVessel = (vessel: VesselSuggestion) => {
    setFormData((prev) => ({
      ...prev,
      vesselId: vessel.id,
      originalVesselName: vessel.name || '',
      originalVesselReg: vessel.registrationNumber || '',
      ownerName: vessel.ownerName || prev.ownerName,
      ownerContact1: vessel.ownerContact || prev.ownerContact1,
    }));
    setVesselSuggestions([]);
    setShowNameSuggestions(false);
    setShowRegSuggestions(false);
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + formData.images.length > 2) {
      toast.error('You can only upload up to 2 images.');
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file.`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 10MB.`);
        return false;
      }
      return true;
    });

    // Create previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...validFiles],
    }));
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle preview - validates and shows preview dialog
  const handlePreview = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    if (!formData.originalVesselName || !formData.originalVesselReg) {
      toast.error('Please enter vessel name and registration number.');
      return;
    }

    if (!formData.ownerName || !formData.ownerContact1) {
      toast.error('Please enter owner name and at least one contact number.');
      return;
    }

    if (!formData.districtId || !formData.flyingLocationId) {
      toast.error('Please select district and flying location.');
      return;
    }

    if (!formData.violationTypeId) {
      toast.error('Please select a violation type.');
      return;
    }

    // Show preview dialog
    setShowPreview(true);
  };

  // Handle actual submission after preview confirmation
  const handleConfirmSubmit = async () => {
    try {
      setSubmitting(true);

      // Upload images first if any
      const evidenceUrls: string[] = [];
      const S3_BUCKET = 'dof-schnell-drone-tech-dashboard';
      const S3_REGION = 'ap-south-1';

      for (const imageFile of formData.images) {
        const uploadResponse = await caseApi.getUploadUrl(imageFile.type);
        if (uploadResponse.data.success && uploadResponse.data.data) {
          // Upload to S3
          await fetch(uploadResponse.data.data.uploadUrl, {
            method: 'PUT',
            body: imageFile,
            headers: {
              'Content-Type': imageFile.type,
            },
          });
          // Convert key to full S3 URL
          const fullUrl = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${uploadResponse.data.data.key}`;
          evidenceUrls.push(fullUrl);
        }
      }

      // Create case
      const caseData = {
        caseNumber: formData.caseNumber,
        vesselId: formData.vesselId,
        vesselName: formData.originalVesselName,
        registrationNumber: formData.originalVesselReg,
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail || undefined,
        ownerContact1: formData.ownerContact1,
        ownerContact2: formData.ownerContact2 || undefined,
        ownerAddress: formData.ownerAddress || undefined,
        ownerTaluka: formData.ownerTaluka || undefined,
        ownerDistrict: formData.ownerDistrict || undefined,
        enforcementAreaId: formData.districtId,
        flyingLocationId: formData.flyingLocationId,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        violationTypeId: formData.violationTypeId,
        fishingLicenseTypeId: formData.fishingLicenseTypeId || undefined,
        depth: formData.depth || undefined,
        actKalam: formData.actKalam || undefined,
        observationDate: formData.observationDate,
        hearingDate: formData.hearingDate,
        hearingTime: formData.hearingTime,
        description: formData.description || undefined,
        evidenceUrls: evidenceUrls.length > 0 ? evidenceUrls : undefined,
        // Penalty details
        penaltyAmount: editablePenalty.processingFee + editablePenalty.violationPenalty,
        offenceOccurrence: editablePenalty.occurrence,
      };

      const response = await caseApi.createCase(caseData);

      if (response.data.success && response.data.data) {
        const caseId = response.data.data.id;
        const caseNumber = response.data.data.caseNumber || '';

        // Generate PDF with the case data and images, and send notification emails
        try {
          const pdfResponse = await caseApi.generateCasePdf(caseId, true); // sendEmails = true
          const emailsSent = pdfResponse.data.data?.emailsSent || 0;
          if (emailsSent > 0) {
            toast.success(`Case ${caseNumber} created. PDF generated and ${emailsSent} notification email(s) sent.`);
          } else {
            toast.success(`Case ${caseNumber} created and PDF generated successfully.`);
          }
        } catch (pdfError) {
          console.error('Error generating PDF:', pdfError);
          toast.success(`Case ${caseNumber} created successfully. PDF generation pending.`);
        }

        router.push('/dashboard/cases');
      } else {
        throw new Error(response.data.error || 'Failed to create case');
      }
    } catch (err: unknown) {
      console.error('Error creating case:', err);
      // Extract error message from axios error response or Error object
      let errorMessage = 'Failed to create case';
      if (err && typeof err === 'object') {
        const axiosError = err as { response?: { data?: { error?: string } }; message?: string };
        if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
      }
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/cases">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Case</h1>
          <p className="text-muted-foreground">
            Create a new fishing violation case
          </p>
        </div>
      </div>

      <form onSubmit={handlePreview}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vessel Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ship className="h-5 w-5" />
                  Vessel Information
                </CardTitle>
                <CardDescription>
                  Type to search existing vessels or enter new details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Vessel Name with inline suggestions */}
                  <div className="space-y-2 relative">
                    <Label htmlFor="vesselName">Vessel Name *</Label>
                    <Input
                      id="vesselName"
                      value={formData.originalVesselName}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, originalVesselName: e.target.value, vesselId: null }));
                        setShowNameSuggestions(true);
                      }}
                      onFocus={() => setShowNameSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowNameSuggestions(false), 200)}
                      placeholder="Enter vessel name"
                      autoComplete="off"
                      required
                    />
                    {/* Suggestions dropdown */}
                    {showNameSuggestions && vesselSuggestions.length > 0 && (
                      <div
                        className="absolute z-50 w-full mt-1 border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
                        style={{ backgroundColor: '#ffffff' }}
                      >
                        {searchingVessels && (
                          <div className="flex items-center justify-center p-3" style={{ backgroundColor: '#ffffff' }}>
                            <Loader2 className="h-4 w-4 animate-spin mr-2 text-gray-600" />
                            <span className="text-sm text-gray-600">Searching...</span>
                          </div>
                        )}
                        {vesselSuggestions.map((vessel) => (
                          <div
                            key={vessel.id}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-200 last:border-b-0"
                            style={{ backgroundColor: '#ffffff' }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectVessel(vessel);
                            }}
                          >
                            <div className="font-medium text-sm" style={{ color: '#111827' }}>{vessel.name}</div>
                            <div className="text-xs" style={{ color: '#6b7280' }}>
                              {vessel.registrationNumber}
                              {vessel.ownerName && ` • ${vessel.ownerName}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Registration Number with inline suggestions */}
                  <div className="space-y-2 relative">
                    <Label htmlFor="vesselReg">Registration Number *</Label>
                    <Input
                      id="vesselReg"
                      value={formData.originalVesselReg}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, originalVesselReg: e.target.value, vesselId: null }));
                        setShowRegSuggestions(true);
                      }}
                      onFocus={() => setShowRegSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowRegSuggestions(false), 200)}
                      placeholder="e.g., MH-TN-1234"
                      autoComplete="off"
                      required
                    />
                    {/* Suggestions dropdown */}
                    {showRegSuggestions && vesselSuggestions.length > 0 && (
                      <div
                        className="absolute z-50 w-full mt-1 border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
                        style={{ backgroundColor: '#ffffff' }}
                      >
                        {searchingVessels && (
                          <div className="flex items-center justify-center p-3" style={{ backgroundColor: '#ffffff' }}>
                            <Loader2 className="h-4 w-4 animate-spin mr-2 text-gray-600" />
                            <span className="text-sm text-gray-600">Searching...</span>
                          </div>
                        )}
                        {vesselSuggestions.map((vessel) => (
                          <div
                            key={vessel.id}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-200 last:border-b-0"
                            style={{ backgroundColor: '#ffffff' }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectVessel(vessel);
                            }}
                          >
                            <div className="font-medium text-sm" style={{ color: '#111827' }}>{vessel.registrationNumber}</div>
                            <div className="text-xs" style={{ color: '#6b7280' }}>
                              {vessel.name}
                              {vessel.ownerName && ` • ${vessel.ownerName}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Show linked vessel info */}
                {formData.vesselId && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700">Linked to existing vessel record</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData((prev) => ({ ...prev, vesselId: null }))}
                      className="ml-auto h-6 text-xs"
                    >
                      Unlink
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Owner Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Owner Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Owner Name *</Label>
                    <Input
                      id="ownerName"
                      value={formData.ownerName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, ownerName: e.target.value }))
                      }
                      placeholder="Enter owner name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerEmail">Owner Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="ownerEmail"
                        type="email"
                        value={formData.ownerEmail}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, ownerEmail: e.target.value }))
                        }
                        placeholder="owner@example.com"
                        className="pl-9"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">PDF notice will be sent to this email</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerContact1">Primary Contact *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="ownerContact1"
                        value={formData.ownerContact1}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, ownerContact1: e.target.value }))
                        }
                        placeholder="10-digit mobile number"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerContact2">Secondary Contact</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="ownerContact2"
                        value={formData.ownerContact2}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, ownerContact2: e.target.value }))
                        }
                        placeholder="10-digit mobile number"
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Address Fields */}
                <div className="space-y-2">
                  <Label htmlFor="ownerAddress">Address Line 1</Label>
                  <Input
                    id="ownerAddress"
                    value={formData.ownerAddress}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, ownerAddress: e.target.value }))
                    }
                    placeholder="Enter address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerTaluka">Taluka</Label>
                    <Input
                      id="ownerTaluka"
                      value={formData.ownerTaluka}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, ownerTaluka: e.target.value }))
                      }
                      placeholder="Enter taluka"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerDistrict">District</Label>
                    <Input
                      id="ownerDistrict"
                      value={formData.ownerDistrict}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, ownerDistrict: e.target.value }))
                      }
                      placeholder="Enter district"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="district">District *</Label>
                    <Select
                      value={formData.districtId}
                      onValueChange={(value) => {
                        setFormData((prev) => ({
                          ...prev,
                          districtId: value,
                          flyingLocationId: '',
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district.id} value={district.id}>
                            {district.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flyingLocation">Flying Location *</Label>
                    <Select
                      value={formData.flyingLocationId}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, flyingLocationId: value }))
                      }
                      disabled={!formData.districtId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {flyingLocations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Certificate Warning */}
                {formData.districtId && certificateStatus && !certificateStatus.hasCertificate && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800">Digital Signature Not Available</p>
                      <p className="text-amber-700 mt-0.5">
                        {certificateStatus.error || `ACF ${certificateStatus.acfName || 'for this district'} has not uploaded a digital signature certificate. The generated PDF will not be digitally signed.`}
                      </p>
                    </div>
                  </div>
                )}

                {checkingCertificate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Checking digital signature availability...</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, latitude: e.target.value }))
                      }
                      placeholder="e.g., 19.0760"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, longitude: e.target.value }))
                      }
                      placeholder="e.g., 72.8777"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Violation Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Violation Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Case Number - Editable */}
                <div className="space-y-2">
                  <Label htmlFor="caseNumber">Case Number (केस क्र.)</Label>
                  <Input
                    id="caseNumber"
                    type="text"
                    value={formData.caseNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, caseNumber: e.target.value }))
                    }
                    placeholder="MH/FISH/2026/06/XXXXX/2026"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-generated case number. You can edit if needed.
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="violationType">Violation Type *</Label>
                    <Select
                      value={formData.violationTypeId}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, violationTypeId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select violation type" />
                      </SelectTrigger>
                      <SelectContent>
                        {violationTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseType">Fishing License Type</Label>
                    <Select
                      value={formData.fishingLicenseTypeId}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, fishingLicenseTypeId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select license type" />
                      </SelectTrigger>
                      <SelectContent>
                        {licenseTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Depth field - only shown for trawling violations */}
                {violationTypes.find((v) => v.id === formData.violationTypeId)?.name?.toLowerCase().includes('trawl') && (
                  <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Label htmlFor="depth" className="text-blue-700">Depth (वाव/Fathoms) - Trawling Specific</Label>
                    <Input
                      id="depth"
                      type="text"
                      value={formData.depth}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, depth: e.target.value }))
                      }
                      placeholder="e.g., 5, 10, 5-10"
                      className="bg-white"
                    />
                    <p className="text-xs text-blue-600">
                      Enter the depth in fathoms (वाव) where the trawling was observed.
                    </p>
                  </div>
                )}

                {/* Act/Section (कलम) */}
                <div className="space-y-2">
                  <Label htmlFor="actKalam">Act / Section (कलम)</Label>
                  <Input
                    id="actKalam"
                    type="text"
                    value={formData.actKalam}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, actKalam: e.target.value }))
                    }
                    placeholder="e.g., Maharashtra Marine Fishing Regulation Act, 1981 - Section 7"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the act and section under which the violation occurred.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observationDate">Observation Date *</Label>
                  <Input
                    id="observationDate"
                    type="date"
                    value={formData.observationDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, observationDate: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hearingDate">Hearing Date *</Label>
                  <Input
                    id="hearingDate"
                    type="date"
                    value={formData.hearingDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, hearingDate: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hearingTime">Hearing Time *</Label>
                  <Input
                    id="hearingTime"
                    type="time"
                    value={formData.hearingTime}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, hearingTime: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Additional details about the violation..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Evidence Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Evidence Images
                </CardTitle>
                <CardDescription>
                  Upload up to 2 images (max 10MB each)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={index}
                      className="relative aspect-video rounded-lg border overflow-hidden"
                    >
                      <Image
                        src={preview}
                        alt={`Evidence ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {formData.images.length < 2 && (
                    <label
                      className={cn(
                        'flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed cursor-pointer',
                        'hover:border-primary hover:bg-accent/50 transition-colors'
                      )}
                    >
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Penalty Summary */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Penalty Calculation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {calculatingPenalty ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : penaltyInfo ? (
                  <>
                    <div className="space-y-4">
                      {/* Processing Fee - Fixed */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Processing Fee (Fixed)</Label>
                        <div className="flex items-center">
                          <span className="text-sm text-muted-foreground mr-2">Rs.</span>
                          <Input
                            type="number"
                            value={editablePenalty.processingFee}
                            onChange={(e) => setEditablePenalty(prev => ({
                              ...prev,
                              processingFee: parseInt(e.target.value) || 0
                            }))}
                            className="h-8 text-right"
                          />
                        </div>
                      </div>

                      {/* Violation Penalty - Editable */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Violation Penalty</Label>
                        <div className="flex items-center">
                          <span className="text-sm text-muted-foreground mr-2">Rs.</span>
                          <Input
                            type="number"
                            value={editablePenalty.violationPenalty}
                            onChange={(e) => setEditablePenalty(prev => ({
                              ...prev,
                              violationPenalty: parseInt(e.target.value) || 0
                            }))}
                            className="h-8 text-right"
                          />
                        </div>
                      </div>

                      {/* Occurrence - Editable */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Offence Occurrence</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            value={editablePenalty.occurrence}
                            onChange={(e) => handleOccurrenceChange(parseInt(e.target.value) || 1)}
                            className="h-8 w-20 text-center"
                            disabled={calculatingPenalty}
                          />
                          {calculatingPenalty ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              ({getOrdinal(editablePenalty.occurrence)} offence)
                            </span>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Total */}
                      <div className="flex justify-between items-center font-medium">
                        <span>Total Penalty</span>
                        <span className="text-xl text-primary">
                          Rs. {(editablePenalty.processingFee + editablePenalty.violationPenalty).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {penaltyInfo.occurrence > 1 && (
                      <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 mt-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">
                            {penaltyInfo.occurrence - 1} prior offence(s) found for this vessel
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Select a violation type to auto-calculate, or enter manually:
                    </p>

                    {/* Processing Fee - Fixed */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Processing Fee (Fixed)</Label>
                      <div className="flex items-center">
                        <span className="text-sm text-muted-foreground mr-2">Rs.</span>
                        <Input
                          type="number"
                          value={editablePenalty.processingFee}
                          onChange={(e) => setEditablePenalty(prev => ({
                            ...prev,
                            processingFee: parseInt(e.target.value) || 0
                          }))}
                          className="h-8 text-right"
                        />
                      </div>
                    </div>

                    {/* Violation Penalty - Editable */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Violation Penalty</Label>
                      <div className="flex items-center">
                        <span className="text-sm text-muted-foreground mr-2">Rs.</span>
                        <Input
                          type="number"
                          value={editablePenalty.violationPenalty}
                          onChange={(e) => setEditablePenalty(prev => ({
                            ...prev,
                            violationPenalty: parseInt(e.target.value) || 0
                          }))}
                          className="h-8 text-right"
                        />
                      </div>
                    </div>

                    {/* Occurrence - Editable */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Offence Occurrence</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          value={editablePenalty.occurrence}
                          onChange={(e) => setEditablePenalty(prev => ({
                            ...prev,
                            occurrence: parseInt(e.target.value) || 1
                          }))}
                          className="h-8 w-20 text-center"
                        />
                        <span className="text-sm text-muted-foreground">
                          ({getOrdinal(editablePenalty.occurrence)} offence)
                        </span>
                      </div>
                    </div>

                    <Separator />

                    {/* Total */}
                    <div className="flex justify-between items-center font-medium">
                      <span>Total Penalty</span>
                      <span className="text-xl text-primary">
                        Rs. {(editablePenalty.processingFee + editablePenalty.violationPenalty).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}

                <Separator />

                <Button
                  type="submit"
                  className={cn(
                    "w-full",
                    isFormValid
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  )}
                  size="lg"
                  disabled={!isFormValid}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Preview Case
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Preview Dialog */}
      <CasePreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        data={getPreviewData()}
        onConfirm={handleConfirmSubmit}
        isSubmitting={submitting}
      />
    </div>
  );
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
