import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, ShieldCheck, ShieldOff, Loader2, Trash2 } from "lucide-react";
import { MFAEnrollment } from "./MFAEnrollment";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const MFASettings = () => {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (!error && data.totp.length > 0) {
        const verifiedFactor = data.totp.find(f => f.status === 'verified');
        if (verifiedFactor) {
          setMfaEnabled(true);
          setFactorId(verifiedFactor.id);
        }
      }
    } catch (error) {
      console.error("Error checking MFA status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const disableMFA = async () => {
    if (!factorId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;

      setMfaEnabled(false);
      setFactorId(null);
      toast.success("Two-factor authentication has been disabled");
    } catch (error: any) {
      toast.error(error.message || "Failed to disable MFA");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (showEnrollment) {
    return (
      <MFAEnrollment
        onComplete={() => {
          setShowEnrollment(false);
          checkMFAStatus();
        }}
        onSkip={() => setShowEnrollment(false)}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {mfaEnabled ? (
            <ShieldCheck className="h-6 w-6 text-green-500" />
          ) : (
            <ShieldOff className="h-6 w-6 text-muted-foreground" />
          )}
          <div>
            <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
            <CardDescription>
              {mfaEnabled
                ? "Your account is protected with 2FA"
                : "Add an extra layer of security to your account"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {mfaEnabled ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Shield className="h-4 w-4" />
              <span>Authenticator app enabled</span>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Disable 2FA
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disable Two-Factor Authentication?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will make your account less secure. You'll only need your password to sign in.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={disableMFA} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Disable 2FA
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <Button onClick={() => setShowEnrollment(true)}>
            <Shield className="h-4 w-4 mr-2" />
            Enable Two-Factor Authentication
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
