import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SocialLogin } from "@/components/SocialLogin";
import { MFAVerification } from "@/components/MFAVerification";
import { MFAEnrollment } from "@/components/MFAEnrollment";
import { z } from "zod";
import { Check, X } from "lucide-react";
// Validation schemas
const emailSchema = z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters");

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  companyName: z.string().trim().max(100, "Company name must be less than 100 characters").optional().or(z.literal("")),
  phone: z.string().trim().max(20, "Phone number is too long").optional().or(z.literal("")),
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Terms of Service and Privacy Policy" })
  })
});

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required")
});

// Password strength calculator
const getPasswordStrength = (password: string): { score: number; checks: { label: string; passed: boolean }[] } => {
  const checks = [
    { label: "At least 8 characters", passed: password.length >= 8 },
    { label: "Uppercase letter", passed: /[A-Z]/.test(password) },
    { label: "Lowercase letter", passed: /[a-z]/.test(password) },
    { label: "Number", passed: /[0-9]/.test(password) },
    { label: "Special character", passed: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
  ];
  const score = (checks.filter(c => c.passed).length / checks.length) * 100;
  return { score, checks };
};

export const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [mfaStep, setMfaStep] = useState<"none" | "verify" | "enroll">("none");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Parse redirect URL and tier from query params
  const searchParams = new URLSearchParams(window.location.search);
  const redirectPath = searchParams.get('redirect');
  const selectedTier = searchParams.get('tier');
  
  // Build the full redirect URL with tier if present
  const getRedirectUrl = () => {
    if (redirectPath) {
      const url = new URL(redirectPath, window.location.origin);
      if (selectedTier) {
        url.searchParams.set('tier', selectedTier);
      }
      return url.pathname + url.search;
    }
    return '/dashboard';
  };

  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    fullName: "",
    companyName: "",
    phone: "",
    agreedToTerms: false as boolean
  });

  const [signInData, setSignInData] = useState({
    email: "",
    password: ""
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Check MFA status on mount
  const checkMFARequirement = async () => {
    try {
      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      if (aalError) return;

      // If user has MFA enrolled but hasn't verified in this session
      if (aalData.nextLevel === "aal2" && aalData.currentLevel === "aal1") {
        setMfaStep("verify");
      }
    } catch (error) {
      console.error("Error checking MFA status:", error);
    }
  };

  const passwordStrength = useMemo(() => getPasswordStrength(signUpData.password), [signUpData.password]);

  const validateSignUp = () => {
    const result = signUpSchema.safeParse(signUpData);
    if (!result.success) {
      const fieldErrors: { [key: string]: string } = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const validateSignIn = () => {
    const result = signInSchema.safeParse(signInData);
    if (!result.success) {
      const fieldErrors: { [key: string]: string } = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as string;
        fieldErrors[`signin_${field}`] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(forgotEmail);
    if (!emailResult.success) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: `${window.location.origin}/auth`
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Password Reset Email Sent",
          description: "Check your email for a link to reset your password.",
        });
        setShowForgotPassword(false);
        setForgotEmail("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSignUp()) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: signUpData.email.trim(),
        password: signUpData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: signUpData.fullName.trim(),
            company_name: signUpData.companyName.trim(),
            phone: signUpData.phone.trim(),
            terms_accepted_at: new Date().toISOString(),
            privacy_accepted_at: new Date().toISOString()
          }
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Account Created",
          description: selectedTier 
            ? "Your account has been created. Redirecting to complete your subscription..."
            : "Your account has been created successfully.",
        });
        navigate(getRedirectUrl());
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSignIn()) {
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInData.email.trim(),
        password: signInData.password
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        // Check if MFA is required
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        
        if (aalData?.nextLevel === "aal2" && aalData?.currentLevel === "aal1") {
          // User has MFA enrolled but hasn't verified - show MFA screen
          setMfaStep("verify");
        } else {
          toast({
            title: "Success",
            description: selectedTier 
              ? "Signed in! Redirecting to complete your subscription..."
              : "Signed in successfully!",
          });
          navigate(getRedirectUrl());
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFAVerified = () => {
    toast({
      title: "Success",
      description: selectedTier 
        ? "Verified! Redirecting to complete your subscription..."
        : "Signed in successfully!",
    });
    navigate(getRedirectUrl());
  };

  const handleMFACancel = async () => {
    await supabase.auth.signOut();
    setMfaStep("none");
  };

  // Show MFA verification screen
  if (mfaStep === "verify") {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
        <MFAVerification onVerified={handleMFAVerified} onCancel={handleMFACancel} />
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border shadow-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-primary">Reset Password</CardTitle>
            <CardDescription>
              Enter your email and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="bg-input border-border"
                  required
                />
              </div>
              <Button type="submit" variant="action" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                Back to Sign In
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border shadow-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-primary">{t('auth.welcome')}</CardTitle>
          <CardDescription>
            {selectedTier 
              ? `Sign in or create an account to subscribe to the ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} plan`
              : t('auth.subtitle')
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t('auth.signIn')}</TabsTrigger>
              <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signInData.email}
                    onChange={(e) => setSignInData({...signInData, email: e.target.value})}
                    className="bg-input border-border"
                    required
                  />
                  {errors.signin_email && (
                    <p className="text-sm text-destructive mt-1">{errors.signin_email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={signInData.password}
                    onChange={(e) => setSignInData({...signInData, password: e.target.value})}
                    className="bg-input border-border"
                    required
                  />
                  {errors.signin_password && (
                    <p className="text-sm text-destructive mt-1">{errors.signin_password}</p>
                  )}
                </div>
                <Button type="submit" variant="action" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing In..." : t('auth.signIn')}
                </Button>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="w-full text-sm text-primary hover:underline"
                >
                  Forgot your password?
                </button>
              </form>
              <SocialLogin />
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({...signUpData, email: e.target.value})}
                    className="bg-input border-border"
                    required
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({...signUpData, password: e.target.value})}
                    className="bg-input border-border"
                    required
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive mt-1">{errors.password}</p>
                  )}
                  {signUpData.password && (
                    <div className="mt-2 space-y-2">
                      <Progress value={passwordStrength.score} className="h-2" />
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        {passwordStrength.checks.map((check, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            {check.passed ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <X className="w-3 h-3 text-muted-foreground" />
                            )}
                            <span className={check.passed ? "text-green-500" : "text-muted-foreground"}>
                              {check.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input
                    id="full-name"
                    placeholder="Enter your full name"
                    value={signUpData.fullName}
                    onChange={(e) => setSignUpData({...signUpData, fullName: e.target.value})}
                    className="bg-input border-border"
                    required
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive mt-1">{errors.fullName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    placeholder="Enter your company name"
                    value={signUpData.companyName}
                    onChange={(e) => setSignUpData({...signUpData, companyName: e.target.value})}
                    className="bg-input border-border"
                  />
                  {errors.companyName && (
                    <p className="text-sm text-destructive mt-1">{errors.companyName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="Enter your phone number"
                    value={signUpData.phone}
                    onChange={(e) => setSignUpData({...signUpData, phone: e.target.value})}
                    className="bg-input border-border"
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                  )}
                </div>
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms-consent"
                    checked={signUpData.agreedToTerms}
                    onCheckedChange={(checked) => 
                      setSignUpData({...signUpData, agreedToTerms: checked === true})
                    }
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <Label htmlFor="terms-consent" className="font-normal cursor-pointer leading-relaxed">
                      I agree to the{" "}
                      <Link to="/terms" className="text-primary hover:underline" target="_blank">
                        Terms of Service
                      </Link>
                      {" "}and{" "}
                      <Link to="/privacy" className="text-primary hover:underline" target="_blank">
                        Privacy Policy
                      </Link>
                    </Label>
                    {errors.agreedToTerms && (
                      <p className="text-sm text-destructive mt-1">{errors.agreedToTerms}</p>
                    )}
                  </div>
                </div>
                <Button type="submit" variant="action" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : t('auth.createAccount')}
                </Button>
              </form>
              <SocialLogin />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
