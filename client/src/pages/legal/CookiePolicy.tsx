import { motion } from "framer-motion";
import { Cookie, Shield, Settings, Eye, BarChart3, Lock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-amber-500/10 via-background to-orange-500/10">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4">
              <Cookie className="h-3 w-3 mr-1" />
              Transparency
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Cookie Policy
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              How we use cookies and similar technologies on the CSOAI platform
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>Version 1.0</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Last Updated: January 2026</span>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">

          {/* Quick Summary */}
          <motion.section {...fadeInUp}>
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  Quick Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-1 flex-shrink-0" />
                    <span>We use <strong>strictly necessary</strong> cookies for the platform to function</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-1 flex-shrink-0" />
                    <span>We use <strong>analytics cookies</strong> to improve our services (you can opt out)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-1 flex-shrink-0" />
                    <span>We do <strong>NOT</strong> use advertising or tracking cookies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-1 flex-shrink-0" />
                    <span>We do <strong>NOT</strong> sell your data to third parties</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.section>

          {/* What Are Cookies */}
          <motion.section {...fadeInUp} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cookie className="h-5 w-5 text-amber-600" />
                  1. What Are Cookies?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-600">
                <p>
                  Cookies are small text files that are stored on your device (computer, tablet, or mobile)
                  when you visit a website. They help websites remember your preferences and understand
                  how you interact with them.
                </p>
                <p>
                  CSOAI uses cookies and similar technologies (such as local storage) to provide you with
                  a better experience, keep you logged in, and understand how our platform is used so we
                  can improve it.
                </p>
              </CardContent>
            </Card>
          </motion.section>

          {/* Types of Cookies We Use */}
          <motion.section {...fadeInUp} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  2. Types of Cookies We Use
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Strictly Necessary */}
                <div className="border-l-4 border-emerald-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-5 w-5 text-emerald-600" />
                    <h4 className="font-bold text-emerald-800">Strictly Necessary Cookies</h4>
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">Required</Badge>
                  </div>
                  <p className="text-gray-600 mb-3">
                    These cookies are essential for the platform to function. Without them, you cannot
                    log in, access your training, or use core features.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left pb-2 font-semibold">Cookie</th>
                          <th className="text-left pb-2 font-semibold">Purpose</th>
                          <th className="text-left pb-2 font-semibold">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2 font-mono text-xs">csoai_session</td>
                          <td className="py-2">Keeps you logged in</td>
                          <td className="py-2">Session</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-mono text-xs">csoai_csrf</td>
                          <td className="py-2">Security token</td>
                          <td className="py-2">Session</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono text-xs">cookie_consent</td>
                          <td className="py-2">Remembers your cookie preferences</td>
                          <td className="py-2">1 year</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Functional */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-5 w-5 text-blue-600" />
                    <h4 className="font-bold text-blue-800">Functional Cookies</h4>
                    <Badge className="bg-blue-100 text-blue-700 text-xs">Optional</Badge>
                  </div>
                  <p className="text-gray-600 mb-3">
                    These cookies remember your preferences and settings to provide a personalized experience.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left pb-2 font-semibold">Cookie</th>
                          <th className="text-left pb-2 font-semibold">Purpose</th>
                          <th className="text-left pb-2 font-semibold">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2 font-mono text-xs">theme_preference</td>
                          <td className="py-2">Light/dark mode preference</td>
                          <td className="py-2">1 year</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono text-xs">dashboard_layout</td>
                          <td className="py-2">Dashboard customization</td>
                          <td className="py-2">1 year</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Analytics */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <h4 className="font-bold text-purple-800">Analytics Cookies</h4>
                    <Badge className="bg-purple-100 text-purple-700 text-xs">Optional</Badge>
                  </div>
                  <p className="text-gray-600 mb-3">
                    These cookies help us understand how visitors use our platform so we can improve it.
                    All data is anonymized and aggregated.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left pb-2 font-semibold">Cookie</th>
                          <th className="text-left pb-2 font-semibold">Purpose</th>
                          <th className="text-left pb-2 font-semibold">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2 font-mono text-xs">_csoai_analytics</td>
                          <td className="py-2">Page views and navigation patterns</td>
                          <td className="py-2">30 days</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono text-xs">_csoai_session_id</td>
                          <td className="py-2">Session tracking (anonymized)</td>
                          <td className="py-2">Session</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </CardContent>
            </Card>
          </motion.section>

          {/* What We DON'T Do */}
          <motion.section {...fadeInUp} transition={{ delay: 0.3 }}>
            <Card className="border-red-200 bg-red-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <Shield className="h-5 w-5 text-red-600" />
                  3. What We DON'T Do
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-gray-700">
                  {[
                    "We do NOT use advertising cookies",
                    "We do NOT track you across other websites",
                    "We do NOT sell your data to third parties",
                    "We do NOT use cookies for behavioral profiling",
                    "We do NOT share cookie data with advertisers",
                    "We do NOT use Facebook Pixel, Google Ads, or similar tracking",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-red-500 font-bold">✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.section>

          {/* Third-Party Cookies */}
          <motion.section {...fadeInUp} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  4. Third-Party Cookies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-600">
                <p>Some third-party services we use may set their own cookies:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">Stripe (Payments)</h4>
                      <p className="text-sm">
                        When you make a payment, Stripe may set cookies for fraud prevention
                        and payment processing. See{" "}
                        <a href="https://stripe.com/privacy" className="text-emerald-600 hover:underline" target="_blank" rel="noopener noreferrer">
                          Stripe's Privacy Policy
                        </a>
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">Embedded Content</h4>
                      <p className="text-sm">
                        Training videos or external content may set cookies from their
                        respective platforms (e.g., YouTube, Vimeo).
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Managing Cookies */}
          <motion.section {...fadeInUp} transition={{ delay: 0.5 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-emerald-600" />
                  5. Managing Your Cookie Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">You can control cookies in several ways:</p>

                <div className="space-y-4">
                  <Card className="bg-emerald-50 border-emerald-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-emerald-800 mb-2">On Our Platform</h4>
                      <p className="text-sm text-emerald-700 mb-3">
                        Use the cookie preferences button below to update your choices at any time.
                      </p>
                      <Button variant="outline" className="border-emerald-300 text-emerald-700">
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Cookie Preferences
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">In Your Browser</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Most browsers allow you to control cookies through their settings. Common options:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                        <li>Block all cookies (may break functionality)</li>
                        <li>Block third-party cookies only</li>
                        <li>Delete cookies when you close your browser</li>
                        <li>Get notified when cookies are set</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Contact */}
          <motion.section {...fadeInUp} transition={{ delay: 0.6 }}>
            <Card className="bg-slate-900 text-white">
              <CardHeader>
                <CardTitle>Questions About Cookies?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">
                  If you have questions about our use of cookies, please contact us:
                </p>
                <p>
                  <a href="mailto:privacy@csoai.org" className="text-emerald-400 hover:underline">
                    privacy@csoai.org
                  </a>
                </p>
                <p className="text-sm text-gray-400">
                  CSOAI LTD | Companies House No: 16939677 | Registered in England & Wales
                </p>
              </CardContent>
            </Card>
          </motion.section>

        </div>
      </div>
    </div>
  );
}
