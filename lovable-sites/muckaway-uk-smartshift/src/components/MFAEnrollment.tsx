import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, Smartphone, Check, X, Loader2 } from "lucide-react";

interface MFAEnrollmentProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export const MFAEnrollment = ({ onComplete, onSkip }: MFAEnrollmentProps) => {
  const [step, setStep] = useState<"intro" | "qr" | "verify">("intro");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [factorId, setFactorId] = useState<string>("");
  const [verifyCode, setVerifyCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const startEnrollment = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "MuckAway Authenticator",
      });

      if (error) throw error;

      if (data.totp) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
        setStep("qr");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to start MFA enrollment");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEnrollment = async () => {
    if (verifyCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      toast.success("MFA enabled successfully! Your account is now more secure.");
      onComplete?.();
    } catch (error: any) {
      toast.error(error.message || "Invalid verification code");
      setVerifyCode("");
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEnrollment = async () => {
    if (factorId) {
      try {
        await supabase.auth.mfa.unenroll({ factorId });
      } catch (e) {
        // Ignore errors on cancel
      }
    }
    setStep("intro");
    setQrCode("");
    setSecret("");
    setFactorId("");
    setVerifyCode("");
  };

  if (step === "intro") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Secure Your Account</CardTitle>
          <CardDescription>
            Add an extra layer of security with Two-Factor Authentication (2FA)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 mt-0.5 text-primary" />
              <p>Use an authenticator app like Google Authenticator, Authy, or 1Password</p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 mt-0.5 text-green-500" />
              <p>Generate time-based codes that expire every 30 seconds</p>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 mt-0.5 text-primary" />
              <p>Protect your account even if your password is compromised</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={startEnrollment} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Enable Two-Factor Authentication"
              )}
            </Button>
            {onSkip && (
              <Button variant="ghost" onClick={onSkip} className="w-full">
                Skip for now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "qr") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Scan QR Code</CardTitle>
          <CardDescription>
            Open your authenticator app and scan this QR code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {qrCode && (
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg">
                <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Can't scan? Enter this code manually:
            </p>
            <code className="block w-full p-3 bg-muted rounded-md text-center font-mono text-sm break-all">
              {secret}
            </code>
          </div>

          <Button onClick={() => setStep("verify")} className="w-full">
            I've scanned the code
          </Button>

          <Button variant="ghost" onClick={cancelEnrollment} className="w-full">
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Verify Setup</CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="mfa-code">Verification Code</Label>
          <Input
            id="mfa-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
            className="text-center text-2xl tracking-widest font-mono"
            autoFocus
          />
        </div>

        <Button
          onClick={verifyEnrollment}
          disabled={isLoading || verifyCode.length !== 6}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify & Enable MFA"
          )}
        </Button>

        <Button variant="ghost" onClick={() => setStep("qr")} className="w-full">
          Back to QR Code
        </Button>
      </CardContent>
    </Card>
  );
};
