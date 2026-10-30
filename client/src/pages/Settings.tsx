/**
 * CSOAI Settings Page
 * User and organization settings
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, User, Building, Bell, Shield, Key, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { COUNCIL_TOKEN_KEY } from "@/lib/councilSession";
import { createPrivateProfileController, validPrivateProfileName, type PrivateProfileState } from "@/lib/councilProfile";

const settingsSections = [
  {
    title: "Profile",
    description: "Manage your personal information",
    icon: User,
  },
  {
    title: "Organization",
    description: "Company and team settings",
    icon: Building,
  },
  {
    title: "Notifications",
    description: "Configure alert preferences",
    icon: Bell,
  },
  {
    title: "Security",
    description: "Password and authentication",
    icon: Shield,
  },
  {
    title: "API Keys",
    description: "Manage API access tokens",
    icon: Key,
  },
  {
    title: "Appearance",
    description: "Theme and display settings",
    icon: Palette,
  },
];

export default function Settings() {
  const { user, token, loading } = useAuth();
  const liveAuth = useRef({ user, token, loading });
  liveAuth.current = { user, token, loading };
  const controller = useRef<ReturnType<typeof createPrivateProfileController> | null>(null);
  const [profile, setProfile] = useState<PrivateProfileState>({ phase: "loading", profile: null, message: null });
  const [name, setName] = useState("");
  const [sessionChanged, setSessionChanged] = useState(false);

  useEffect(() => {
    setName("");
    setSessionChanged(false);
    if (loading || !user?.email || !token) {
      setProfile({ phase: loading ? "loading" : "error", profile: null,
        message: loading ? null : "Sign in to view your private profile." });
      return;
    }
    try {
      if (window.localStorage.getItem(COUNCIL_TOKEN_KEY) !== token) throw new Error("Session changed");
    } catch {
      setSessionChanged(true);
      setProfile({ phase: "error", profile: null, message: "Your account session changed. Reload this page to verify the current sign-in." });
      return;
    }
    const mounted = createPrivateProfileController({
      identity: { email: user.email, token },
      currentIdentity: () => {
        const live = liveAuth.current;
        if (live.loading || !live.user?.email || !live.token) return null;
        try {
          if (window.localStorage.getItem(COUNCIL_TOKEN_KEY) !== live.token) return null;
        } catch { return null; }
        return { email: live.user.email, token: live.token };
      },
      fetcher: (url, init) => fetch(url, init),
      publish: setProfile,
    });
    controller.current = mounted;
    void mounted.load();
    return () => {
      mounted.dispose();
      if (controller.current === mounted) controller.current = null;
    };
  }, [user?.email, token, loading]);

  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (event.key !== null && event.key !== COUNCIL_TOKEN_KEY) return;
      try {
        if (window.localStorage.getItem(COUNCIL_TOKEN_KEY) === liveAuth.current.token) return;
      } catch { /* An unreadable shared session must hide the private form. */ }
      controller.current?.dispose();
      controller.current = null;
      setName("");
      setSessionChanged(true);
      setProfile({ phase: "error", profile: null, message: "Your account session changed. Reload this page to verify the current sign-in." });
    };
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, []);

  useEffect(() => {
    if ((profile.phase === "ready" || profile.phase === "saved") && profile.profile) {
      setName(profile.profile.name);
    }
  }, [profile]);

  // Never show a previous account's name during the render before its effect disposes.
  const sameAccount = !sessionChanged && !loading && !!user?.email && !!token &&
    profile.profile?.email === user.email.toLowerCase();
  const phase = profile.profile && !sameAccount ? "loading" : profile.phase;
  const message = profile.profile && !sameAccount ? null : profile.message;
  const editable = sameAccount && (phase === "ready" || phase === "saved");
  const busy = phase === "loading" || phase === "saving";
  const changed = sameAccount && name.trim() !== profile.profile?.name;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground text-sm">
            Manage your account and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Navigation */}
          <div className="space-y-2">
            {settingsSections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: idx * 0.03 }}
                >
                  <Button
                    variant={idx === 0 ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3"
                    disabled={idx !== 0}
                  >
                    <Icon className="h-4 w-4" />
                    <div className="text-left">
                      <p className="font-medium">{section.title}</p>
                      <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                  </Button>
                </motion.div>
              );
            })}
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile Settings
                  </CardTitle>
                  <CardDescription>
                    Update your personal information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This account name is private. Saving it does not publish a profile or grant any role.
                  </p>
                  <form className="space-y-4" onSubmit={(event) => {
                    event.preventDefault();
                    void controller.current?.save(name);
                  }}>
                    <div className="space-y-2">
                      <Label htmlFor="name">Private account name</Label>
                      <Input id="name" value={sameAccount ? name : ""} onChange={(event) => setName(event.target.value)}
                        maxLength={120} required disabled={!editable} placeholder="Your name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Account email</Label>
                      <Input id="email" type="email" value={sessionChanged ? "" : (sameAccount ? profile.profile?.email : user?.email) || ""} readOnly />
                      <p className="text-xs text-muted-foreground">
                        Your email identifies this account and cannot be changed here. Signing in does not verify email ownership.
                      </p>
                    </div>
                    <Separator />
                    <div role={phase === "error" || phase === "unconfirmed" ? "alert" : "status"}
                      aria-live="polite" className="text-sm">
                      {phase === "loading" ? "Loading your private profile…" :
                        phase === "saving" ? "Saving and checking your private name…" : message}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" disabled={!editable || !changed || !validPrivateProfileName(name)}>
                        Save private name
                      </Button>
                      <Button type="button" variant="outline" disabled={!sessionChanged && (busy || !user || !token)}
                        onClick={() => {
                          if (sessionChanged) window.location.reload();
                          else void controller.current?.load();
                        }}>
                        {sessionChanged ? "Reload account" : "Reopen profile"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
