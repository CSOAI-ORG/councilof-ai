/**
 * AI Safety Analyst Job Board
 * Browse and apply to AI safety analyst positions worldwide
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Building2,
  Search,
  Filter,
  TrendingUp,
  Users,
  Globe,
  Upload,
  FileText,
  X,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function Jobs() {
  const [search, setSearch] = useState('');
  const [locationType, setLocationType] = useState<string>('');
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [employmentType, setEmploymentType] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  // Fetch job listings with filters
  const { data: jobsData, isLoading } = trpc.jobs.getJobListings.useQuery({
    search: search || undefined,
    location: locationType || undefined,
    experienceLevel: experienceLevel || undefined,
    employmentType: employmentType || undefined,
    limit: 20,
  });

  // Fetch job stats
  const { data: stats } = trpc.jobs.getJobStats.useQuery();

  // Fetch selected job details
  const { data: jobDetails } = trpc.jobs.getJobDetails.useQuery(
    { id: selectedJob! },
    { enabled: !!selectedJob }
  );

  // Apply to job mutation
  const applyMutation = trpc.jobs.applyToJob.useMutation({
    onSuccess: () => {
      toast.success('Application submitted successfully!');
      setShowApplicationDialog(false);
      setCoverLetter('');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // File upload mutation
  const uploadMutation = trpc.fileUpload.getSignedUrl.useMutation();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, DOC, DOCX, and TXT files are allowed');
      return;
    }

    setResumeFile(file);

    // Upload file
    setUploading(true);
    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result?.toString().split(',')[1];
        if (!base64Data) {
          toast.error('Failed to read file');
          setUploading(false);
          return;
        }

        // Generate key
        const timestamp = Date.now();
        const key = `resumes/${timestamp}-${file.name}`;

        // Upload to server
        const result = await uploadMutation.mutateAsync({
          filename: file.name,
          contentType: file.type,
          purpose: 'resume' as const,
        });

        setResumeUrl(result.fileUrl);
        toast.success('Resume uploaded successfully');
        setUploading(false);
      };
      reader.onerror = () => {
        toast.error('Failed to read file');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload resume');
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setResumeFile(null);
    setResumeUrl('');
  };

  const handleApply = () => {
    if (!selectedJob) return;
    applyMutation.mutate({
      jobId: selectedJob,
      coverLetter: coverLetter || undefined,
      resumeUrl: resumeUrl || undefined,
    });
  };

  const formatPayRate = (rate: number, max?: number | null, currency: string = 'USD') => {
    const formatted = (rate / 100).toFixed(0);
    const maxFormatted = max ? (max / 100).toFixed(0) : null;
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;
    
    if (maxFormatted) {
      return `${symbol}${formatted}-${maxFormatted}/hr`;
    }
    return `${symbol}${formatted}/hr`;
  };

  const getExperienceBadgeColor = (level: string) => {
    switch (level) {
      case 'entry':
        return 'bg-green-100 text-green-800';
      case 'mid':
        return 'bg-blue-100 text-blue-800';
      case 'senior':
        return 'bg-purple-100 text-purple-800';
      case 'lead':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLocationTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'remote':
        return 'bg-emerald-100 text-emerald-800';
      case 'hybrid':
        return 'bg-sky-100 text-sky-800';
      case 'onsite':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Safety Analyst Jobs</h1>
        <p className="text-gray-600 mt-1">
          Find your next opportunity in AI safety and compliance
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
                  <p className="text-sm text-gray-600">Active Positions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Globe className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.topLocations?.filter(l => l === 'Remote').length || stats.totalJobs}</p>
                  <p className="text-sm text-gray-600">Remote Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.averageSalaryFormatted || `$${stats.averageSalary?.toLocaleString() || 0}`}
                  </p>
                  <p className="text-sm text-gray-600">Average Salary</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <CardTitle>Filter Jobs</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={locationType} onValueChange={setLocationType}>
              <SelectTrigger>
                <SelectValue placeholder="Location Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="onsite">On-site</SelectItem>
              </SelectContent>
            </Select>

            <Select value={experienceLevel} onValueChange={setExperienceLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Experience Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="entry">Entry Level</SelectItem>
                <SelectItem value="mid">Mid Level</SelectItem>
                <SelectItem value="senior">Senior</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
              </SelectContent>
            </Select>

            <Select value={employmentType} onValueChange={setEmploymentType}>
              <SelectTrigger>
                <SelectValue placeholder="Employment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="full_time">Full Time</SelectItem>
                <SelectItem value="part_time">Part Time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="freelance">Freelance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(search || locationType || experienceLevel || employmentType) && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearch('');
                setLocationType('');
                setExperienceLevel('');
                setEmploymentType('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Job Listings */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-600">
              Loading jobs...
            </CardContent>
          </Card>
        ) : (jobsData?.items?.length || 0) === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-600">
              No jobs found matching your filters. Try adjusting your search criteria.
            </CardContent>
          </Card>
        ) : (
          jobsData?.items?.map((job) => (
            <Card
              key={job.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedJob(job.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Briefcase className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {job.company}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {formatPayRate(job.payRate || 0, job.payRateMax)}
                          </div>
                        </div>

                        <p className="text-gray-700 mb-3 line-clamp-2">{job.description}</p>

                        <div className="flex flex-wrap gap-2">
                          <Badge className={getLocationTypeBadgeColor(job.locationType)}>
                            {job.locationType}
                          </Badge>
                          <Badge className={getExperienceBadgeColor(job.experienceLevel)}>
                            {job.experienceLevel}
                          </Badge>
                          <Badge variant="outline">{job.employmentType.replace('_', ' ')}</Badge>
                          {job.requiredCertifications && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                              {job.requiredCertifications.split(',')[0]}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <Users className="h-4 w-4" />
                      {job.applicationCount} applicants
                    </div>
                    <Button size="sm">View Details</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Job Details Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {jobDetails && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{jobDetails.title}</DialogTitle>
                <DialogDescription className="text-base">
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {jobDetails.company}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {jobDetails.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {formatPayRate(jobDetails.payRate || 0, jobDetails.payRateMax)}
                    </div>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className={getLocationTypeBadgeColor(jobDetails.locationType)}>
                    {jobDetails.locationType}
                  </Badge>
                  <Badge className={getExperienceBadgeColor(jobDetails.experienceLevel)}>
                    {jobDetails.experienceLevel}
                  </Badge>
                  <Badge variant="outline">{jobDetails.employmentType.replace('_', ' ')}</Badge>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700 whitespace-pre-line">{jobDetails.description}</p>
                </div>

                {(jobDetails as any).responsibilities && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Responsibilities</h4>
                    <p className="text-gray-700 whitespace-pre-line">{(jobDetails as any).responsibilities}</p>
                  </div>
                )}

                {jobDetails.requirements && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
                    <p className="text-gray-700 whitespace-pre-line">{jobDetails.requirements}</p>
                  </div>
                )}

                {jobDetails.requiredCertifications && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Required Certifications</h4>
                    <p className="text-gray-700">{jobDetails.requiredCertifications}</p>
                  </div>
                )}

                {jobDetails.benefits && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Benefits</h4>
                    <p className="text-gray-700 whitespace-pre-line">{jobDetails.benefits}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    className="flex-1"
                    onClick={() => setShowApplicationDialog(true)}
                  >
                    Apply Now
                  </Button>
                  {(jobDetails as any).applicationUrl && (
                    <Button
                      variant="outline"
                      onClick={() => window.open((jobDetails as any).applicationUrl, '_blank')}
                    >
                      External Application
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Application Dialog */}
      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to {jobDetails?.title}</DialogTitle>
            <DialogDescription>
              Submit your application for this position
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Resume (Optional)
              </label>
              {!resumeFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    id="resume-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-1">
                      {uploading ? 'Uploading...' : 'Click to upload resume'}
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, DOCX, or TXT (max 10MB)
                    </p>
                  </label>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {resumeFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(resumeFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Cover Letter (Optional)
              </label>
              <textarea
                className="w-full min-h-[150px] p-3 border rounded-md"
                placeholder="Tell us why you're a great fit for this role..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={handleApply}
                disabled={applyMutation.isPending}
              >
                {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowApplicationDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
