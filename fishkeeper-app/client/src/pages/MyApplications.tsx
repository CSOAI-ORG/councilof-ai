/**
 * My Applications Page
 * View job application history with status tracking and employer responses
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  Building2,
  FileText,
  MessageSquare,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { formatDistanceToNow } from 'date-fns';

export default function MyApplications() {
  const { data: applications, isLoading } = trpc.jobs.getMyApplications.useQuery();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: {
        icon: Clock,
        label: 'Submitted',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      },
      reviewing: {
        icon: Eye,
        label: 'Reviewing',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
      },
      shortlisted: {
        icon: CheckCircle2,
        label: 'Shortlisted',
        className: 'bg-purple-100 text-purple-800 border-purple-200',
      },
      accepted: {
        icon: CheckCircle2,
        label: 'Accepted',
        className: 'bg-green-100 text-green-800 border-green-200',
      },
      rejected: {
        icon: XCircle,
        label: 'Rejected',
        className: 'bg-red-100 text-red-800 border-red-200',
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={`${config.className} border`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatPayRate = (rate: number, max?: number | null, currency: string = 'USD') => {
    const formatted = (rate / 100).toFixed(0);
    const maxFormatted = max ? (max / 100).toFixed(0) : null;
    return maxFormatted
      ? `$${formatted}-${maxFormatted}/${currency === 'USD' ? 'hr' : 'hr'}`
      : `$${formatted}/${currency === 'USD' ? 'hr' : 'hr'}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center text-gray-600">
            Loading applications...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-600 mt-1">Track your job application status and employer responses</p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't applied to any jobs yet. Browse available positions and start applying!
            </p>
            <Button asChild>
              <a href="/jobs">Browse Jobs</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group applications by status
  const groupedApplications = {
    pending: applications.filter((app) => app.status === 'submitted'),
    reviewed: applications.filter((app) => app.status === 'reviewing' || app.status === 'shortlisted'),
    accepted: applications.filter((app) => app.status === 'accepted'),
    rejected: applications.filter((app) => app.status === 'rejected'),
  };

  const stats = [
    {
      label: 'Total Applications',
      value: applications.length,
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Pending',
      value: groupedApplications.pending.length,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      label: 'Reviewed',
      value: groupedApplications.reviewed.length,
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Accepted',
      value: groupedApplications.accepted.length,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
        <p className="text-gray-600 mt-1">Track your job application status and employer responses</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {applications.map((application) => (
          <Card key={application.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-xl">{application.jobTitle}</CardTitle>
                    {getStatusBadge(application.status || 'submitted')}
                  </div>
                  <CardDescription className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {application.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {application.location} • {application.locationType}
                    </span>
                    {application.payRate && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {formatPayRate(application.payRate, application.maxPayRate, application.currency || 'USD')}
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Timeline */}
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Applied {formatDistanceToNow(new Date(application.appliedAt), { addSuffix: true })}
                  </span>
                </div>
                {(application as any).statusUpdatedAt && application.status !== 'submitted' && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      Status updated {formatDistanceToNow(new Date((application as any).statusUpdatedAt), { addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>

              {/* Cover Letter */}
              {(application as any).coverLetter && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Your Cover Letter</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">{(application as any).coverLetter}</p>
                </div>
              )}

              {/* Resume */}
              {(application as any).resumeUrl && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <a
                    href={(application as any).resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    View Resume
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {/* Employer Response */}
              {(application as any).employerResponse && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Employer Response</span>
                  </div>
                  <p className="text-sm text-blue-800">{(application as any).employerResponse}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`/jobs?id=${application.jobId}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Job Posting
                  </a>
                </Button>
                {application.status === 'accepted' && (
                  <Badge className="bg-green-600 text-white">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Congratulations!
                  </Badge>
                )}
                {application.status === 'rejected' && (
                  <Badge variant="outline" className="border-gray-300 text-gray-600">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Keep applying
                  </Badge>
                )}
                {application.status === 'shortlisted' && (
                  <Badge className="bg-blue-600 text-white">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Shortlisted!
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
