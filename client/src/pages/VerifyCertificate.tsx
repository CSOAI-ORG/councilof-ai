import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Award,
  Calendar,
  BookOpen,
  Shield,
  ArrowLeft,
  Loader2
} from 'lucide-react';

export default function VerifyCertificate() {
  const params = useParams<{ id: string }>();
  const certificateId = params.id || '';

  // Verify certificate query
  const { data, isLoading, error } = trpc.certificates.verify.useQuery(
    { certificateNumber: certificateId },
    { enabled: !!certificateId }
  );

  if (!certificateId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Invalid Record ID</h1>
          <p className="text-muted-foreground mb-6">
            Please provide a valid completion record ID to verify.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold">Verifying Completion Record...</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Please wait while we verify the completion record
          </p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <Shield className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Lookup temporarily offline</h1>
          <p className="text-muted-foreground mb-2">
            Completion record lookup is temporarily offline while the verification service moves
            infrastructure. We can&apos;t confirm or deny this ID right now — and nothing
            here means the completion record is invalid.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            The signed chain is still publicly recomputable —{" "}
            <Link href="/gspc-verify" className="text-emerald-600 hover:underline">
              recompute it client-side →
            </Link>
          </p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!data?.valid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Completion Record Not Found</h1>
          <p className="text-muted-foreground mb-2">
            {(data as any)?.message || error?.message || 'This completion record could not be verified.'}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            The record ID may be invalid or the completion record may have been revoked.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Valid certificate
  const { certificate } = data;
  if (!certificate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Completion Record Data Missing</h1>
          <p className="text-muted-foreground mb-6">
            Unable to load completion record details.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }
  const issuedDate = new Date(certificate.issuedAt);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-12 h-12 text-green-600 dark:text-green-400" />
            <h1 className="text-4xl font-bold">Completion Record Verification</h1>
          </div>
          <p className="text-muted-foreground">
            Official CSOAI Council Academy Training Completion Record
          </p>
        </div>

        {/* Verification Status Card */}
        <Card className="max-w-3xl mx-auto mb-8 border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50/50 to-blue-50/50 dark:from-green-950/20 dark:to-blue-950/20">
          <div className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full">
                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">
                  Completion Record Verified
                </h2>
                <p className="text-sm text-muted-foreground">
                  This is an authentic CSOAI Council Academy completion record
                </p>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Certificate ID */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  Record ID
                </div>
                <div className="font-mono text-sm bg-background/50 p-3 rounded border">
                  {certificate.certificateNumber || certificate.id}
                </div>
              </div>

              {/* Issued Date */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Issue Date
                </div>
                <div className="text-lg font-semibold">
                  {issuedDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>

              {/* Course Name */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  Course
                </div>
                <div className="text-lg font-semibold">
                  {(certificate as any).courseName || certificate.title || 'AI Safety Course'}
                </div>
              </div>

              {/* Framework */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Award className="w-4 h-4" />
                  Framework
                </div>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {(certificate as any).framework || certificate.type || 'CSOAI'}
                </Badge>
              </div>
            </div>

            {/* Verification Notice */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Verification Confirmed:</strong> This completion record was issued by CSOAI
                Council Academy and confirms that the holder completed the training course. It attests
                training completion only — not any AI system's compliance or conformity. Council of AI
                measures; it does not certify or issue conformity marks.
              </p>
            </div>
          </div>
        </Card>

        {/* Additional Information */}
        <div className="max-w-3xl mx-auto">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">About CSOAI Council Academy</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                CSOAI Council Academy provides training in AI safety and governance, measured against
                frameworks including the EU AI Act, NIST AI RMF, and ISO/IEC 42001.
              </p>
              <p>
                Our courses help learners build the knowledge and skills to work as AI Safety Analysts.
                A completion record attests training completion, not conformity — Council of AI measures;
                it does not certify or issue conformity marks.
              </p>
              <p className="text-xs pt-2 border-t">
                To verify this completion record, visit: <span className="font-mono">coai.manus.space/verify-certificate/{certificateId}</span>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
