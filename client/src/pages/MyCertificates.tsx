/**
 * My Certificates Page
 * Displays all certificates earned by the user (both Watchdog Analyst and Training Courses)
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  Calendar,
  Download,
  ExternalLink,
  Share2,
  CheckCircle,
  ArrowLeft,
  Copy,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import Certificate from "@/components/Certificate";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function MyCertificates() {
  const [, navigate] = useLocation();
  const [selectedWatchdogCert, setSelectedWatchdogCert] = useState<any>(null);

  // Fetch Watchdog Analyst certificates
  const { data: watchdogCertificates, isLoading: watchdogLoading } = 
    trpc.certification.getMyCertificates.useQuery();

  // Fetch Training Course certificates
  const { data: courseCertificates, isLoading: courseLoading } = 
    trpc.certificates.list.useQuery();

  // Generate certificate mutation for re-downloading
  const generateCertificateMutation = trpc.certificates.generate.useMutation({
    onSuccess: (data) => {
      if (data.success && data.pdfUrl) {
        // Open PDF URL in new tab
        window.open(data.pdfUrl, '_blank');
        toast.success(`Certificate ${data.certificateNumber} downloaded!`);
      }
    },
    onError: (error) => {
      toast.error(`Failed to download certificate: ${error.message}`);
    }
  });

  const handleDownloadCertificate = (courseId: number) => {
    generateCertificateMutation.mutate({ courseId });
  };

  const handleCopyVerificationLink = (certificateId: string) => {
    const url = `${window.location.origin}/verify-certificate/${certificateId}`;
    navigator.clipboard.writeText(url);
    toast.success('Verification link copied to clipboard!');
  };

  const handleShareLinkedIn = (courseName: string, certificateId: string) => {
    const verificationUrl = `${window.location.origin}/verify-certificate/${certificateId}`;
    const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(courseName)}&organizationName=${encodeURIComponent('COAI Dashboard')}&issueYear=${new Date().getFullYear()}&issueMonth=${new Date().getMonth() + 1}&certUrl=${encodeURIComponent(verificationUrl)}`;
    window.open(linkedInUrl, '_blank');
  };

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  const isExpired = (expiryDate: string | Date) => {
    return new Date(expiryDate) < new Date();
  };

  const isExpiringSoon = (expiryDate: string | Date) => {
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry < thirtyDaysFromNow && expiry > new Date();
  };

  const isLoading = watchdogLoading || courseLoading;
  const courseCertList = (courseCertificates as any)?.certificates || courseCertificates || [];
  const hasAnyCertificates = (watchdogCertificates && watchdogCertificates.length > 0) ||
                            (courseCertList.length > 0);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/training")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">My Certificates</h1>
            <p className="text-muted-foreground">
              View and manage all your earned certifications
            </p>
          </div>
        </div>

        {!hasAnyCertificates ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">No Certificates Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Complete training courses or pass the Watchdog Analyst certification exam to earn your first certificate.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate("/courses")}>
                  Browse Courses
                </Button>
                <Button variant="outline" onClick={() => navigate("/certification")}>
                  Take Certification Exam
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Training Course Certificates */}
            {courseCertList.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <h2 className="text-xl font-semibold">Training Course Certificates</h2>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {courseCertList.map((cert: any, idx: number) => (
                    <motion.div
                      key={cert.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card className="h-full hover:shadow-lg transition-all border-2">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30 flex items-center justify-center">
                              <Award className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                            </div>
                            <Badge variant="outline" className="border-green-500 text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          </div>
                          <CardTitle className="text-lg line-clamp-2">
                            {cert.courseName}
                          </CardTitle>
                          <CardDescription className="font-mono text-xs">
                            {cert.certificateId}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Issued: {formatDate(cert.issuedAt)}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {cert.framework}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="w-full"
                              onClick={() => handleDownloadCertificate(cert.courseId)}
                              disabled={generateCertificateMutation.isPending}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              {generateCertificateMutation.isPending ? 'Downloading...' : 'Download PDF'}
                            </Button>
                            
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => handleShareLinkedIn(cert.courseName, cert.certificateId)}
                              >
                                <Share2 className="h-4 w-4 mr-1" />
                                LinkedIn
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => handleCopyVerificationLink(cert.certificateId)}
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                Copy Link
                              </Button>
                            </div>

                            <Link href={`/verify-certificate/${cert.certificateId}`}>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-full"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Verify Certificate
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Watchdog Analyst Certificates */}
            {watchdogCertificates && watchdogCertificates.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <h2 className="text-xl font-semibold">Watchdog Analyst Certifications</h2>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {watchdogCertificates.map((cert, idx) => {
                    const expired = isExpired(cert.expiresAt!);
                    const expiringSoon = isExpiringSoon(cert.expiresAt!);

                    return (
                      <motion.div
                        key={cert.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Card className={cn(
                          "cursor-pointer transition-all hover:shadow-lg border-2",
                          expired && "opacity-60 border-red-200 dark:border-red-800",
                          expiringSoon && "border-amber-200 dark:border-amber-800"
                        )}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-12 h-12 rounded-full flex items-center justify-center",
                                  expired 
                                    ? "bg-red-100 dark:bg-red-900" 
                                    : "bg-amber-100 dark:bg-amber-900"
                                )}>
                                  <Award className={cn(
                                    "h-6 w-6",
                                    expired 
                                      ? "text-red-600 dark:text-red-400" 
                                      : "text-amber-600 dark:text-amber-400"
                                  )} />
                                </div>
                                <div>
                                  <CardTitle className="text-lg">
                                    Watchdog Analyst
                                  </CardTitle>
                                  <CardDescription className="font-mono text-xs">
                                    {cert.certificateNumber}
                                  </CardDescription>
                                </div>
                              </div>
                              {expired ? (
                                <Badge variant="destructive">Expired</Badge>
                              ) : expiringSoon ? (
                                <Badge variant="outline" className="border-amber-500 text-amber-600">
                                  Expiring Soon
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-green-500 text-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>Issued: {formatDate(cert.issuedAt!)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>Expires: {formatDate(cert.expiresAt!)}</span>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => setSelectedWatchdogCert(cert)}
                                >
                                  View Certificate
                                </Button>
                                {expired && (
                                  <Button 
                                    size="sm" 
                                    className="flex-1"
                                    onClick={() => navigate("/certification/exam")}
                                  >
                                    Renew
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Watchdog Certificate Dialog */}
        <Dialog open={!!selectedWatchdogCert} onOpenChange={() => setSelectedWatchdogCert(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Watchdog Analyst Certificate</DialogTitle>
            </DialogHeader>
            {selectedWatchdogCert && (
              <Certificate
                certificateId={selectedWatchdogCert.certificateNumber}
                recipientName="Certified Analyst"
                courseName="Watchdog Analyst Certification Exam"
                certificateType="Watchdog Analyst"
                issueDate={new Date(selectedWatchdogCert.issuedAt).toISOString()}
                verificationUrl={`/verify/${selectedWatchdogCert.certificateNumber}`}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
