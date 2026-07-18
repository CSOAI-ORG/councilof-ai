"use client";

import { useState } from "react";
import { Upload, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AuditPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="container flex flex-col items-center justify-center py-24 text-center">
        <CheckCircle className="mb-4 h-16 w-16 text-emerald-500" />
        <h1 className="text-2xl font-bold">Submission Received</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Your agent has been queued for POAI audit. You will receive a detailed
          report within 48 hours.
        </p>
        <Button className="mt-6" asChild>
          <a href="/dashboard">Go to Dashboard</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-12">
      <div className="mb-8 text-center">
        <Shield className="mx-auto mb-3 h-10 w-10 text-sovereign" />
        <h1 className="text-3xl font-bold tracking-tight">
          POAI Audit Submission
        </h1>
        <p className="mt-2 text-muted-foreground">
          Submit your agent for Protocol Origin & Integrity verification.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agent Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name</Label>
              <Input id="name" placeholder="e.g., ContextBridge Pro" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Protocol Type</Label>
              <Select required>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MCP">MCP</SelectItem>
                  <SelectItem value="A2A">A2A</SelectItem>
                  <SelectItem value="ACP">ACP</SelectItem>
                  <SelectItem value="Character">Character</SelectItem>
                  <SelectItem value="Bundle">Bundle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Describe what your agent does..."
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verification Materials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="repo">Repository URL</Label>
              <Input
                id="repo"
                type="url"
                placeholder="https://github.com/..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="docs">Documentation URL</Label>
              <Input id="docs" type="url" placeholder="https://docs..." />
            </div>
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Upload audit package</p>
              <p className="text-xs text-muted-foreground">
                ZIP containing source, tests, and manifest.json
              </p>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full">
          <Shield className="mr-2 h-4 w-4" />
          Submit for POAI Audit
        </Button>
      </form>
    </div>
  );
}
