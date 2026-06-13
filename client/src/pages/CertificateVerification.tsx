/**
 * Certificate Verification Portal
 * Public page where anyone can verify CSOAI certifications by ID or QR code
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Search,
  QrCode,
  Award,
  Calendar,
  User,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function CertificateVerification() {
  const [certificateId, setCertificateId] = useState('');
  const [searchMode, setSearchMode] = useState<'manual' | 'qr'>('manual');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<any>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyCertificateMutation = trpc.certificates.verifyCertificate.useMutation({
    onSuccess: (data: any) => {
      setVerificationResult(data);
      setIsVerifying(false);
      if (data.valid) {
        toast.success('Certificate verified successfully!');
      } else {
        toast.error('Certificate not found or invalid');
      }
    },
    onError: (error: any) => {
      setIsVerifying(false);
      toast.error('Verification failed: ' + error.message);
    },
  });

  const handleVerify = () => {
    if (!certificateId.trim()) {
      toast.error('Please enter a certificate ID');
      return;
    }
    setIsVerifying(true);
    setVerificationResult(null);
    verifyCertificateMutation.mutate({ certificateNumber: certificateId.trim() });
  };

  const handleQRScan = () => {
    setIsScanning(true);
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (isScanning && searchMode === 'qr') {
      // Dynamically import html5-qrcode
      import('html5-qrcode').then(({ Html5Qrcode }) => {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        scanner
          .start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              // QR code successfully scanned
              setCertificateId(decodedText);
              stopScanning();
              toast.success('QR code scanned successfully!');
              // Auto-verify
              setIsVerifying(true);
              setVerificationResult(null);
              verifyCertificateMutation.mutate({ certificateNumber: decodedText });
            },
            (errorMessage) => {
              // Scanning error (can be ignored, happens frequently)
            }
          )
          .catch((err) => {
            console.error('Failed to start scanner:', err);
            toast.error('Camera access denied or not available');
            setIsScanning(false);
          });
      });
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [isScanning, searchMode]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-green-100 rounded-full">
              <Shield className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Certificate Verification</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Verify the authenticity of CSOAI AI Safety Analyst certifications. Enter a certificate
            ID or scan a QR code to confirm credentials.
          </p>
        </div>

        {/* Verification Method Selector */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            variant={searchMode === 'manual' ? 'default' : 'outline'}
            onClick={() => setSearchMode('manual')}
            className={searchMode === 'manual' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            <FileText className="mr-2 h-4 w-4" />
            Enter Certificate ID
          </Button>
          <Button
            variant={searchMode === 'qr' ? 'default' : 'outline'}
            onClick={() => {
              setSearchMode('qr');
              handleQRScan();
            }}
            className={searchMode === 'qr' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            <QrCode className="mr-2 h-4 w-4" />
            Scan QR Code
          </Button>
        </div>

        {/* Manual Search Input */}
        {searchMode === 'manual' && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Enter certificate ID (e.g., CSOAI-2024-001234)"
                    value={certificateId}
                    onChange={(e) => setCertificateId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                    className="text-lg"
                  />
                </div>
                <Button
                  onClick={handleVerify}
                  disabled={isVerifying}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isVerifying ? (
                    <>Verifying...</>
                  ) : (
                    <>
                      <Search className="mr-2 h-5 w-5" />
                      Verify
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* QR Scanner */}
        {searchMode === 'qr' && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              {!isScanning ? (
                <div className="text-center py-8">
                  <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Click the button below to start scanning QR codes with your camera
                  </p>
                  <Button
                    onClick={handleQRScan}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <QrCode className="mr-2 h-5 w-5" />
                    Start Camera
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Scanning QR Code...</h3>
                    <Button
                      onClick={stopScanning}
                      variant="outline"
                      size="sm"
                    >
                      Stop Scanning
                    </Button>
                  </div>
                  <div
                    id="qr-reader"
                    className="border-2 border-green-500 rounded-lg overflow-hidden"
                  />
                  <p className="text-sm text-gray-600 mt-4 text-center">
                    Position the QR code within the frame to scan
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Verification Result */}
        {verificationResult && (
          <Card
            className={`border-2 ${
              verificationResult.valid
                ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50'
                : 'border-red-500 bg-gradient-to-r from-red-50 to-orange-50'
            }`}
          >
            <CardHeader>
              <div className="flex items-center gap-4">
                {verificationResult.valid ? (
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                ) : (
                  <XCircle className="h-12 w-12 text-red-600" />
                )}
                <div>
                  <CardTitle className="text-2xl">
                    {verificationResult.valid ? 'Certificate Verified ✓' : 'Certificate Invalid ✗'}
                  </CardTitle>
                  <p className="text-gray-600 mt-1">
                    {verificationResult.valid
                      ? 'This is an authentic CSOAI certification'
                      : 'This certificate could not be verified in our system'}
                  </p>
                </div>
              </div>
            </CardHeader>

            {verificationResult.valid && verificationResult.certificate && (
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Certificate Details */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <User className="h-4 w-4" />
                        Certified Professional
                      </div>
                      <p className="font-semibold text-gray-900">
                        {verificationResult.certificate.userName}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Award className="h-4 w-4" />
                        Certification Level
                      </div>
                      <Badge className="bg-green-600 text-white">
                        {verificationResult.certificate.level || 'Professional'}
                      </Badge>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <FileText className="h-4 w-4" />
                        Certificate Number
                      </div>
                      <p className="font-mono text-sm text-gray-900">
                        {verificationResult.certificate.certificateNumber}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Calendar className="h-4 w-4" />
                        Issue Date
                      </div>
                      <p className="text-gray-900">
                        {new Date(verificationResult.certificate.issuedAt).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        )}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Status
                      </div>
                      <Badge variant="outline" className="border-green-600 text-green-700">
                        Active & Valid
                      </Badge>
                    </div>

                    {verificationResult.certificate.courseName && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <FileText className="h-4 w-4" />
                          Course Completed
                        </div>
                        <p className="text-gray-900">
                          {verificationResult.certificate.courseName}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification Statement */}
                <div className="mt-6 p-4 bg-white rounded-lg border border-green-200">
                  <p className="text-sm text-gray-700">
                    <strong>Official Verification:</strong> This certificate has been issued by
                    CSOAI (Certified Safety Oversight AI) and is recognized globally as proof of
                    professional competence in AI Safety Analysis. The holder has successfully
                    completed all required training modules and passed the certification examination
                    with a score meeting or exceeding CSOAI standards.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Information Cards */}
        {!verificationResult && (
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Why Verify?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Confirm authenticity of AI Safety Analyst credentials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Verify certification is current and not revoked</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Check professional qualifications before hiring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Ensure compliance with regulatory requirements</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  Where to Find Certificate ID
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-gray-900 flex-shrink-0">•</span>
                    <span>On the certificate document (top right corner)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-gray-900 flex-shrink-0">•</span>
                    <span>In the QR code (scan with your phone camera)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-gray-900 flex-shrink-0">•</span>
                    <span>Format: CSOAI-YYYY-XXXXXX (e.g., CSOAI-2024-001234)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-gray-900 flex-shrink-0">•</span>
                    <span>Contact the certificate holder if you don't have access</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>
            For questions about certificate verification, contact{' '}
            <a href="mailto:verify@csoai.org" className="text-green-600 hover:underline">
              verify@csoai.org
            </a>
          </p>
          <p className="mt-2">
            All CSOAI certifications are issued in accordance with international AI safety standards
            (EU AI Act, NIST AI RMF, TC260).
          </p>
        </div>
      </div>
    </div>
  );
}
