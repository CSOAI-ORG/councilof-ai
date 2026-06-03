import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, Loader2 } from "lucide-react";

interface MFAVerificationProps {
  onVerified: () => void;
  onCancel?: () => void;
}

export const MFAVerification = ({ onVerified, onCancel }: MFAVerificationProps) => {
  const [verifyCode, setVerifyCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);

  useEffect(() => {
    const getFactors = async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (!error && data.totp.length > 0) {
        // Use the first verified TOTP factor
        const verifiedFactor = data.totp.find(f => f.status === 'verified');
        if (verifiedFactor) {
          setFactorId(verifiedFactor.id);
        }
      }
    };
    getFactors();
  }, []);

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    if (!factorId) {
      toast.error("MFA factor not found");
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

      toast.success("Verification successful!");
      onVerified();
    } catch (error: any) {
      toast.error(error.message || "Invalid verification code");
      setVerifyCode("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && verifyCode.length === 6) {
      handleVerify();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="mfa-verify-code">Verification Code</Label>
          <Input
            id="mfa-verify-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={handleKeyDown}
            className="text-center text-2xl tracking-widest font-mono"
            autoFocus
            disabled={isLoading}
          />
        </div>

        <Button
          onClick={handleVerify}
          disabled={isLoading || verifyCode.length !== 6 || !factorId}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </Button>

        {onCancel && (
          <Button variant="ghost" onClick={onCancel} className="w-full">
            Sign out
          </Button>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Open your authenticator app (Google Authenticator, Authy, etc.) to get your verification code.
        </p>
      </CardContent>
    </Card>
  );
};
