/**
 * Certificate Component
 * Displays a certificate with professional styling
 */

import { Shield, Award, CheckCircle } from "lucide-react";

interface CertificateProps {
  recipientName: string;
  courseName?: string;
  certificateType?: string;
  issueDate: string;
  certificateId: string;
  verificationUrl?: string;
}

export default function Certificate({
  recipientName,
  courseName,
  certificateType = "Completion",
  issueDate,
  certificateId,
  verificationUrl,
}: CertificateProps) {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 rounded-lg border-4 border-amber-500/20 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,215,0,0.1) 10px, rgba(255,215,0,0.1) 20px)`
        }} />
      </div>

      {/* Certificate Content */}
      <div className="relative z-10 text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
            <Shield className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-amber-500 text-sm uppercase tracking-widest font-semibold">
            Council of Safety of AI
          </h2>
          <h1 className="text-3xl font-bold text-white mt-2">
            Certificate of {certificateType}
          </h1>
        </div>

        {/* Recipient */}
        <div className="py-6 border-y border-amber-500/20">
          <p className="text-gray-400 text-sm mb-2">This certifies that</p>
          <h3 className="text-2xl font-semibold text-white">{recipientName}</h3>
        </div>

        {/* Achievement */}
        <div>
          <p className="text-gray-300">
            has successfully completed the requirements for
          </p>
          <p className="text-xl font-semibold text-amber-400 mt-2">
            {courseName || "AI Safety Certification"}
          </p>
        </div>

        {/* Verification Badge */}
        <div className="flex justify-center items-center gap-2 text-green-400">
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm">Blockchain Verified</span>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end pt-6 text-gray-400 text-sm">
          <div>
            <p>Issue Date</p>
            <p className="text-white">{issueDate}</p>
          </div>
          <div>
            <Award className="h-12 w-12 text-amber-500/50" />
          </div>
          <div className="text-right">
            <p>Certificate ID</p>
            <p className="text-white font-mono text-xs">{certificateId}</p>
          </div>
        </div>

        {/* Verification URL */}
        {verificationUrl && (
          <p className="text-xs text-gray-500">
            Verify at: {verificationUrl}
          </p>
        )}
      </div>
    </div>
  );
}
