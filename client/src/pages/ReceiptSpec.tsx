import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, ExternalLink, Shield, Bot } from "lucide-react";
import { StackHonestyBanner } from "@/components/StackHonestyBanner";
import CouncilOsPageShell from "@/components/os/CouncilOsPageShell";

export default function ReceiptSpec() {
  return (
    <CouncilOsPageShell title="Receipt spec" subtitle="RECEIPT-SPEC-0.1" className="min-h-screen bg-[#04070d] text-slate-200">
      <header className="border-b border-white/8 bg-[#080c14]">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <Badge className="mb-4 border-emerald-500/40 bg-emerald-950/40 text-emerald-300">RECEIPT-SPEC-0.1</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Agent measurement card</h1>
        </div>
      </header>
    </CouncilOsPageShell>
  );
}
