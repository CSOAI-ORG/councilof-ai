/**
 * Certificate Component
 * Displays a professional certificate that can be downloaded or shared
 */

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Award, Download, Share2, Shield, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateCertificatePDF } from "@/lib/pdfExport";

interface CertificateProps {
  certificateNumber: string;
  userName: string;
  testName: string;
  score: number;
  issuedDate: Date;
  expiryDate: Date;
}

export default function Certificate({
  certificateNumber,
  userName,
  testName,
  score,
  issuedDate,
  expiryDate,
}: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const pdfBlob = await generateCertificatePDF({
        recipientName: userName,
        certificateType: "AI Safety Analyst Certification",
        issueDate: formatDate(issuedDate),
        expiryDate: formatDate(expiryDate),
        certificateId: certificateNumber,
        courseName: testName,
        score: score,
        byzantineVerified: true,
        verificationUrl: `https://councilof.ai/verify/${certificateNumber}`,
      });

      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `CSOAI-Certificate-${certificateNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Certificate downloaded!", {
        description: "Your PDF certificate has been saved.",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Download failed", {
        description: "Please try again or contact support.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: "COAI Watchdog Analyst Certification",
      text: `I just earned my COAI Watchdog Analyst Certification! Certificate #${certificateNumber}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `${shareData.text}\n${shareData.url}`
      );
      toast.success("Copied to clipboard!", {
        description: "Share your achievement on social media.",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Certificate Display */}
      <motion.div
        ref={certificateRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative bg-gradient-to-br from-amber-50 via-white to-amber-50 dark:from-amber-950/30 dark:via-gray-900 dark:to-amber-950/30 border-4 border-amber-200 dark:border-amber-800 rounded-lg p-8 shadow-xl"
      >
        {/* Decorative corners */}
        <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-amber-400 dark:border-amber-600 rounded-tl-lg" />
        <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-amber-400 dark:border-amber-600 rounded-tr-lg" />
        <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-amber-400 dark:border-amber-600 rounded-bl-lg" />
        <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-amber-400 dark:border-amber-600 rounded-br-lg" />

        {/* Content */}
        <div className="text-center space-y-6 py-8">
          {/* Logo/Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
              <Shield className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-sm uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400 font-medium mb-2">
              Certificate of Achievement
            </h2>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              COAI Watchdog Analyst
            </h1>
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-amber-400" />
            <Award className="h-6 w-6 text-amber-500" />
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-amber-400" />
          </div>

          {/* Recipient */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">This certifies that</p>
            <p className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100">
              {userName}
            </p>
          </div>

          {/* Description */}
          <p className="text-muted-foreground max-w-md mx-auto">
            has successfully completed the {testName} and demonstrated proficiency in AI safety 
            governance, regulatory compliance, and incident analysis.
          </p>

          {/* Score Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-4 py-2 rounded-full">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Score: {score}%</span>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-8 max-w-sm mx-auto text-sm">
            <div>
              <p className="text-muted-foreground">Issued</p>
              <p className="font-medium">{formatDate(issuedDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Valid Until</p>
              <p className="font-medium">{formatDate(expiryDate)}</p>
            </div>
          </div>

          {/* Certificate Number */}
          <div className="pt-4 border-t border-amber-200 dark:border-amber-800">
            <p className="text-xs text-muted-foreground">Certificate Number</p>
            <p className="font-mono text-sm font-medium">{certificateNumber}</p>
          </div>

          {/* Verification */}
          <p className="text-xs text-muted-foreground">
            Verify this certificate at coai.org/verify/{certificateNumber}
          </p>
        </div>
      </motion.div>

      {/* Actions */}
      <div className="flex justify-center gap-3">
        <Button onClick={handleDownload} variant="outline" disabled={isDownloading}>
          {isDownloading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {isDownloading ? "Generating..." : "Download PDF"}
        </Button>
        <Button onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>
    </div>
  );
}
