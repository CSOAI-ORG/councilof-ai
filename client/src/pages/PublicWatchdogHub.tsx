/**
 * Public Watchdog Hub
 * Global AI problem reporting and transparency dashboard
 * Read-only access - anyone can view reports
 * Sign up to submit reports or access full dashboard
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  AlertTriangle,
  Globe,
  TrendingUp,
  Filter,
  Search,
  Eye,
  MapPin,
  Calendar,
  Tag,
  Shield,
  Users,
  Zap,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// Mock data for reports
/**
 * NO PUBLIC INCIDENT RECORD IS PUBLISHED HERE.
 *
 * This array previously held five fabricated incidents — including CRITICAL reports
 * marked "verified", with invented view counts, attributed by name to ChatGPT-4 and
 * Tesla FSD v12 — rendered on /watchdog/report and /watchdog-hub as a "Global AI
 * Safety Incident Database". They were demo fixtures presented as genuine records
 * about identifiable companies. That is the exact harm this project's own watchdog
 * doctrine exists to prevent: an allegation must never be published before the
 * subject has been notified and given a right of reply.
 *
 * It stays EMPTY until there is a real, notified, right-of-reply-respecting intake
 * behind it. An empty register is honest; a populated fake one is not. If you are
 * adding records here, they must come from a live source, not a literal.
 */
type WatchdogReport = {
  id: number; title: string; description: string; severity: string; aiSystem: string;
  reporter: string; region: string; date: string; views: number; status: string; category: string;
};
const mockReports: WatchdogReport[] = [];

export default function PublicWatchdogHub() {
  const [reports, setReports] = useState(mockReports);
  const [filteredReports, setFilteredReports] = useState(mockReports);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  // Filter and search reports
  useEffect(() => {
    let filtered = reports;

    // Search
    if (searchQuery) {
      filtered = filtered.filter(
        (report) =>
          report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.aiSystem.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Severity filter
    if (severityFilter !== "all") {
      filtered = filtered.filter((report) => report.severity === severityFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((report) => report.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((report) => report.status === statusFilter);
    }

    // Sort
    if (sortBy === "recent") {
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sortBy === "views") {
      filtered.sort((a, b) => b.views - a.views);
    } else if (sortBy === "severity") {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      filtered.sort((a, b) => severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder]);
    }

    setFilteredReports(filtered);
  }, [searchQuery, severityFilter, categoryFilter, statusFilter, sortBy, reports]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "investigating":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const stats = [
    { label: "Total Reports", value: reports.length, icon: AlertTriangle },
    { label: "Critical Issues", value: reports.filter((r) => r.severity === "critical").length, icon: AlertTriangle },
    { label: "Verified", value: reports.filter((r) => r.status === "verified").length, icon: CheckCircle },
    { label: "Under Investigation", value: reports.filter((r) => r.status === "investigating").length, icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white py-16">
        <div className="container max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Eye className="h-8 w-8" />
              <h1 className="text-4xl font-bold">The Watchdog</h1>
            </div>
            <p className="text-xl text-slate-200 max-w-2xl mx-auto">
              Global AI Safety Incident Database - Transparent, Community-Driven Reporting
            </p>
            <p className="text-sm text-slate-300">
              View real AI incidents reported by our community. Sign up to submit reports and access the full dashboard.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
              >
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <Icon className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* CTA Banner */}
      <div className="bg-emerald-50 border-t border-b border-emerald-200 py-8">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-emerald-900 mb-1">Want to Submit a Report?</h3>
              <p className="text-sm text-emerald-700">
                Join our community of AI safety analysts and help protect the world from AI risks.
              </p>
            </div>
            <Link href="/signup">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Sign Up Free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="space-y-4"
        >
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search incidents by title, AI system, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Employment">Employment</SelectItem>
                <SelectItem value="Transportation">Transportation</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Content Moderation">Content Moderation</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="views">Most Viewed</SelectItem>
                <SelectItem value="severity">Highest Severity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>
      </div>

      {/* Reports List */}
      <div className="container max-w-6xl mx-auto px-4 pb-12">
        <div className="space-y-4">
          {filteredReports.length > 0 ? (
            filteredReports.map((report, idx) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getSeverityColor(report.severity)}>
                            {report.severity.toUpperCase()}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(report.status)}
                            <span className="text-xs text-muted-foreground capitalize">{report.status}</span>
                          </div>
                          <Badge variant="outline">{report.category}</Badge>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{report.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {report.aiSystem}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {report.region}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(report.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {report.views} views
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card className="px-6 py-12 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mx-auto max-w-2xl text-base font-semibold text-slate-900">
                No public incident record is published here.
              </p>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                We do not publish allegations about a named system before its provider has been
                notified and given a right of reply. Until that intake exists, this register stays
                empty rather than being filled with examples — an empty register is honest, a
                populated illustrative one is not.
              </p>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                What we do publish today is our own measurement, with its limits attached:
                the signed board at{" "}
                <Link href="/gspc-scoreboard" className="font-semibold text-emerald-700 underline">the live board</Link>,
                and our own errors at{" "}
                <Link href="/honesty" className="font-semibold text-emerald-700 underline">the honesty gate</Link>.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-slate-900 text-white py-12">
        <div className="container max-w-6xl mx-auto px-4 text-center space-y-4">
          <h2 className="text-2xl font-bold">Help Protect AI Safety</h2>
          <p className="text-slate-300 max-w-2xl mx-auto">
            Join AI safety analysts working to identify and report AI incidents worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Get Started
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="border-slate-600 text-slate-100 hover:bg-slate-800">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
