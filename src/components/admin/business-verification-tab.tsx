'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Avatar,
  Box,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  X as CancelIcon,
  Eye as VisibilityIcon,
  MapPin as LocationOnIcon,
  Building as BusinessIcon,
  Phone as PhoneIcon,
  Globe as WebIcon,
  Calendar as CalendarIcon,
  Users as UsersIcon,
  Search as SearchIcon,
  FileText as FileTextIcon,
  Download as DownloadIcon,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Define interfaces for better type safety
interface Business {
  id: string;
  name: string;
  description?: string;
  sector?: string;
  location?: string;
  county?: string;
  town?: string;
  contactEmail?: string;
  contactPhone?: string;
  companyEmail?: string;
  whatsappNumber?: string;
  website?: string;
  physicalAddress?: string;
  coordinates?: string;
  logoUrl?: string;
  typeOfBusiness?: string;
  businessUserOrganisation?: string;
  companySize?: string;
  numberOfEmployees?: string;
  yearEstablished?: string;
  kenyanNationalId?: string;
  registrationNumber?: string;
  licenceNumber?: string;
  kraPin?: string;
  taxId?: string;
  exportLicense?: string;
  exportVolumePast3Years?: string;
  currentExportMarkets?: string;
  productionCapacityPast3?: string;
  companyStory?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  owner?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
  };
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
  updatedAt?: string;
  registrationCertificateUrl?: string;
  pinCertificateUrl?: string;
  incorporationCertificateUrl?: string;
  industry?: string;
  productHsCode?: string;
  serviceOffering?: string;
  products?: any[];
  certifications?: any[];
}

export function BusinessVerificationTab() {
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState<Business | null>(null);
  const [detailsTabValue, setDetailsTabValue] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getBusinesses();
      const businessesData = response.businesses as Business[];
      setAllBusinesses(businessesData);
    } catch (error) {

      setAllBusinesses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter businesses based on search and status filter
  const filteredBusinesses = useMemo(() => {
    let result = [...allBusinesses];
    
    // Filter by verification status
    if (statusFilter !== 'ALL') {
      result = result.filter(b => b.verificationStatus === statusFilter);
    }
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(b =>
        b.name?.toLowerCase().includes(search) ||
        b.owner?.firstName?.toLowerCase().includes(search) ||
        b.owner?.lastName?.toLowerCase().includes(search) ||
        b.contactEmail?.toLowerCase().includes(search) ||
        b.sector?.toLowerCase().includes(search) ||
        b.location?.toLowerCase().includes(search)
      );
    }
    
    return result;
  }, [allBusinesses, searchTerm, statusFilter]);

  const handleVerification = async (businessId: string, businessName: string, status: 'VERIFIED' | 'REJECTED', reason?: string) => {
    try {
      setIsVerifying(businessId);
      await apiClient.verifyBusiness(businessId, status);
      
      toast({
        title: `Business ${status.toLowerCase()}`,
        description: `${businessName} has been ${status.toLowerCase()}${reason ? `: ${reason}` : '.'}`,
      });

      // Refresh the list
      await fetchBusinesses();
    } catch (error) {

      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update business verification status.',
      });
    } finally {
      setIsVerifying(null);
      setShowRejectDialog(null);
      setRejectionReason('');
    }
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' => {
    switch (status) {
      case 'VERIFIED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'warning';
    }
  };

  // Rejection Reason Dialog
  const RejectionReasonDialog = () => {
    if (!showRejectDialog) return null;

    return (
      <Dialog 
        open={!!showRejectDialog} 
        onClose={() => {
          setShowRejectDialog(null);
          setRejectionReason('');
        }}
        maxWidth="sm" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': { m: { xs: 2, sm: 3 }, maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' }, zIndex: 9999 },
          '& .MuiBackdrop-root': { zIndex: 9998 },
        }}
      >
        <DialogTitle>Reject Business Verification</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Please provide a reason for rejecting {showRejectDialog.name}&apos;s verification application.
            This will be shared with the business owner.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter the reason for rejection..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setShowRejectDialog(null);
              setRejectionReason('');
            }}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (!rejectionReason.trim()) {
                toast({
                  variant: 'destructive',
                  title: 'Reason Required',
                  description: 'Please provide a reason for rejection.',
                });
                return;
              }
              handleVerification(showRejectDialog.id, showRejectDialog.name, 'REJECTED', rejectionReason);
            }}
            disabled={isVerifying === showRejectDialog.id}
          >
            {isVerifying === showRejectDialog.id ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const BusinessDetailsDialog = ({ business, open, onClose }: { business: Business; open: boolean; onClose: () => void }) => {
    if (!business) return null;

    // Safely parse coordinates
    let coordinates = null;
    if (business.coordinates) {
      try {
        if (typeof business.coordinates === 'string') {
          coordinates = JSON.parse(business.coordinates);
        } else if (typeof business.coordinates === 'object') {
          coordinates = business.coordinates;
        }
      } catch (e) {
        // Invalid coordinates, leave as null
      }
    }

    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
        sx={{
          '& .MuiDialog-paper': { m: { xs: 2, sm: 3 }, maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' }, zIndex: 9999 },
          '& .MuiBackdrop-root': { zIndex: 9998 },
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar src={business.logoUrl} alt={business.name} sx={{ width: 48, height: 48 }}>
              <BusinessIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">{business.name}</Typography>
              <Typography variant="caption" color="textSecondary">
                {business.sector} • {business.location}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Tabs value={detailsTabValue} onChange={(_, v) => setDetailsTabValue(v)} sx={{ mb: 2 }}>
            <Tab label="Details" />
            <Tab label="Documents" />
            <Tab label="History" />
          </Tabs>

          {detailsTabValue === 0 && (
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Basic Information</Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">Business Name</Typography>
                      <Typography variant="body2">{business.name}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                      <Typography variant="body2">{business.description || 'No description provided'}</Typography>
                    </Box>
                    {business.companyStory && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Company Story</Typography>
                        <Typography variant="body2">{business.companyStory}</Typography>
                      </Box>
                    )}
                    <Box display="flex" gap={4} flexWrap="wrap">
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Sector</Typography>
                        <Typography variant="body2">{business.sector}</Typography>
                      </Box>
                      {business.typeOfBusiness && (
                        <Box>
                          <Typography variant="subtitle2" color="textSecondary">Type of Business</Typography>
                          <Typography variant="body2">{business.typeOfBusiness}</Typography>
                        </Box>
                      )}
                      {business.businessUserOrganisation && (
                        <Box>
                          <Typography variant="subtitle2" color="textSecondary">Organization</Typography>
                          <Typography variant="body2">{business.businessUserOrganisation}</Typography>
                        </Box>
                      )}
                      {business.industry && (
                        <Box>
                          <Typography variant="subtitle2" color="textSecondary">Industry</Typography>
                          <Typography variant="body2">{business.industry}</Typography>
                        </Box>
                      )}
                    </Box>
                    {business.productHsCode && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Product HS Code</Typography>
                        <Typography variant="body2">{business.productHsCode}</Typography>
                      </Box>
                    )}
                    {business.serviceOffering && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Service Offering</Typography>
                        <Typography variant="body2">{business.serviceOffering}</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Location Information */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Location Information</Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    {business.physicalAddress && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Physical Address</Typography>
                        <Typography variant="body2">{business.physicalAddress}</Typography>
                      </Box>
                    )}
                    <Box display="flex" gap={4} flexWrap="wrap">
                      {business.town && (
                        <Box>
                          <Typography variant="subtitle2" color="textSecondary">Town</Typography>
                          <Typography variant="body2">{business.town}</Typography>
                        </Box>
                      )}
                      {business.county && (
                        <Box>
                          <Typography variant="subtitle2" color="textSecondary">County</Typography>
                          <Typography variant="body2">{business.county}</Typography>
                        </Box>
                      )}
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Location</Typography>
                        <Typography variant="body2">{business.location}</Typography>
                      </Box>
                    </Box>
                    {coordinates && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">GPS Coordinates</Typography>
                        <Typography variant="body2">
                          Lat: {coordinates.lat.toFixed(6)}, Lng: {coordinates.lng.toFixed(6)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Contact Information</Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">Contact Email</Typography>
                      <Typography variant="body2">{business.contactEmail || 'Not provided'}</Typography>
                    </Box>
                    {business.companyEmail && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Company Email</Typography>
                        <Typography variant="body2">{business.companyEmail}</Typography>
                      </Box>
                    )}
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">Contact Phone</Typography>
                      <Typography variant="body2">{business.contactPhone || 'Not provided'}</Typography>
                    </Box>
                    {business.whatsappNumber && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">WhatsApp Number</Typography>
                        <Typography variant="body2">{business.whatsappNumber}</Typography>
                      </Box>
                    )}
                    {business.website && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Website</Typography>
                        <Typography variant="body2">
                          <a href={business.website} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                            {business.website}
                          </a>
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Company Details */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Company Details</Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    {business.yearEstablished && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Year Established</Typography>
                        <Typography variant="body2">{business.yearEstablished}</Typography>
                      </Box>
                    )}
                    {business.numberOfEmployees && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Number of Employees</Typography>
                        <Typography variant="body2">{business.numberOfEmployees}</Typography>
                      </Box>
                    )}
                    {business.companySize && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Company Size</Typography>
                        <Typography variant="body2">{business.companySize}</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Registration & Compliance */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Registration & Compliance</Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    {business.kenyanNationalId && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Kenyan National ID</Typography>
                        <Typography variant="body2">{business.kenyanNationalId}</Typography>
                      </Box>
                    )}
                    {business.registrationNumber && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Registration Number</Typography>
                        <Typography variant="body2">{business.registrationNumber}</Typography>
                      </Box>
                    )}
                    {business.kraPin && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">KRA PIN</Typography>
                        <Typography variant="body2">{business.kraPin}</Typography>
                      </Box>
                    )}
                    {business.taxId && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Tax ID</Typography>
                        <Typography variant="body2">{business.taxId}</Typography>
                      </Box>
                    )}
                    {business.licenceNumber && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Licence Number</Typography>
                        <Typography variant="body2">{business.licenceNumber}</Typography>
                      </Box>
                    )}
                    {business.exportLicense && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Export License</Typography>
                        <Typography variant="body2">{business.exportLicense}</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Export Information */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Export Information</Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    {business.currentExportMarkets && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Current Export Markets</Typography>
                        <Typography variant="body2">{business.currentExportMarkets}</Typography>
                      </Box>
                    )}
                    {business.exportVolumePast3Years && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Export Volume (Past 3 Years)</Typography>
                        <Typography variant="body2">{business.exportVolumePast3Years}</Typography>
                      </Box>
                    )}
                    {business.productionCapacityPast3 && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Production Capacity (Past 3 Years)</Typography>
                        <Typography variant="body2">{business.productionCapacityPast3}</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Social Media */}
            {(business.twitterUrl || business.instagramUrl) && (
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Social Media</Typography>
                    <Box display="flex" flexDirection="column" gap={2}>
                      {business.twitterUrl && (
                        <Box>
                          <Typography variant="subtitle2" color="textSecondary">Twitter</Typography>
                          <Typography variant="body2">
                            <a href={business.twitterUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                              {business.twitterUrl}
                            </a>
                          </Typography>
                        </Box>
                      )}
                      {business.instagramUrl && (
                        <Box>
                          <Typography variant="subtitle2" color="textSecondary">Instagram</Typography>
                          <Typography variant="body2">
                            <a href={business.instagramUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                              {business.instagramUrl}
                            </a>
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Owner Information */}
            <Grid item xs={12} md={business.twitterUrl || business.instagramUrl ? 6 : 12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Owner Information</Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">Name</Typography>
                      <Typography variant="body2">
                        {business.owner?.firstName} {business.owner?.lastName}
                      </Typography>
                    </Box>
                    {business.owner?.email && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Email</Typography>
                        <Typography variant="body2">{business.owner.email}</Typography>
                      </Box>
                    )}
                    {business.owner?.phoneNumber && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Phone</Typography>
                        <Typography variant="body2">{business.owner.phoneNumber}</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Products & Certifications Summary */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Products & Certifications</Typography>
                  <Box display="flex" gap={4}>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">Total Products</Typography>
                      <Typography variant="body2">{business.products?.length || 0}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">Total Certifications</Typography>
                      <Typography variant="body2">{business.certifications?.length || 0}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          )}

          {detailsTabValue === 1 && (
            <Grid container spacing={2}>
              {business.registrationCertificateUrl && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <FileTextIcon className="text-blue-500" />
                        <Typography variant="subtitle2">Registration Certificate</Typography>
                      </Box>
                      <Button 
                        size="small" 
                        startIcon={<DownloadIcon />}
                        href={business.registrationCertificateUrl}
                        target="_blank"
                        sx={{ mt: 1 }}
                      >
                        View/Download
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              {business.pinCertificateUrl && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <FileTextIcon className="text-blue-500" />
                        <Typography variant="subtitle2">PIN Certificate</Typography>
                      </Box>
                      <Button 
                        size="small" 
                        startIcon={<DownloadIcon />}
                        href={business.pinCertificateUrl}
                        target="_blank"
                        sx={{ mt: 1 }}
                      >
                        View/Download
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              {business.incorporationCertificateUrl && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <FileTextIcon className="text-blue-500" />
                        <Typography variant="subtitle2">Kenya Certificate of Incorporation</Typography>
                      </Box>
                      <Button 
                        size="small" 
                        startIcon={<DownloadIcon />}
                        href={business.incorporationCertificateUrl}
                        target="_blank"
                        sx={{ mt: 1 }}
                      >
                        View/Download
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              {!business.registrationCertificateUrl && !business.pinCertificateUrl && !business.incorporationCertificateUrl && (
                <Grid item xs={12}>
                  <Box textAlign="center" py={4}>
                    <FileTextIcon size={48} style={{ color: '#ccc', marginBottom: 16 }} />
                    <Typography variant="body2" color="textSecondary">
                      No documents uploaded yet
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}

          {detailsTabValue === 2 && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Verification Timeline</Typography>
                <Box sx={{ mt: 2 }}>
                  <Box display="flex" alignItems="flex-start" gap={2} mb={3}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'warning.main' }} />
                      <Box sx={{ width: 2, flexGrow: 1, bgcolor: 'grey.300' }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Verification Pending</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Submitted on {new Date(business.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="flex-start" gap={2}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'grey.300' }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Awaiting Admin Review</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Your application is in the queue
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
          <Button
            color="error"
            startIcon={<CancelIcon size={16} />}
            onClick={() => {
              setShowRejectDialog(business);
              onClose();
            }}
            disabled={isVerifying === business.id}
          >
            Reject
          </Button>
          <Button
            color="success"
            variant="contained"
            startIcon={<CheckCircleIcon size={16} />}
            onClick={() => handleVerification(business.id, business.name, 'VERIFIED')}
            disabled={isVerifying === business.id}
          >
            {isVerifying === business.id ? 'Verifying...' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Business Verification ({filteredBusinesses.length} businesses)
        </Typography>
        <Button variant="outlined" onClick={fetchBusinesses} disabled={isLoading}>
          Refresh
        </Button>
      </Box>
      
      {/* Search and Filter Controls */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search by name, email, sector..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ minWidth: 250 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon size={20} />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="VERIFIED">Verified</MenuItem>
            <MenuItem value="REJECTED">Rejected</MenuItem>
            <MenuItem value="ALL">All Status</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Business</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Sector</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBusinesses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Box py={4}>
                    <BusinessIcon size={48} style={{ color: '#ccc', marginBottom: 16 }} />
                    <Typography variant="body2" color="textSecondary">
                      No businesses found matching your criteria
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredBusinesses.map((business) => (
                <TableRow key={business.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar src={business.logoUrl} alt={business.name}>
                        {business.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">{business.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          Created {new Date(business.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {business.owner?.firstName} {business.owner?.lastName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {business.contactEmail}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationOnIcon size={16} />
                      <Typography variant="body2">{business.location}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{business.sector}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={business.verificationStatus} 
                      color={getStatusColor(business.verificationStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon size={16} />}
                        onClick={() => {
                          setSelectedBusiness(business);
                          setDetailsTabValue(0);
                        }}
                      >
                        View
                      </Button>
                      {business.verificationStatus === 'PENDING' && (
                        <>
                          <Button
                            size="small"
                            color="success"
                            startIcon={<CheckCircleIcon size={16} />}
                            onClick={() => handleVerification(business.id, business.name, 'VERIFIED')}
                            disabled={isVerifying === business.id}
                          >
                            {isVerifying === business.id ? '...' : 'Approve'}
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<CancelIcon size={16} />}
                            onClick={() => setShowRejectDialog(business)}
                            disabled={isVerifying === business.id}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedBusiness && (
        <BusinessDetailsDialog
          business={selectedBusiness}
          open={!!selectedBusiness}
          onClose={() => setSelectedBusiness(null)}
        />
      )}

      <RejectionReasonDialog />
    </Box>
  );
}
