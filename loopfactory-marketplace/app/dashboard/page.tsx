"use client";

import { Shield, Clock, Package, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SbtBadge } from "@/components/SbtBadge";
import { PRODUCTS, type CharacterProduct } from "@/lib/mockData";

const ownedCharacters = PRODUCTS.filter(
  (p): p is CharacterProduct => p.type === "Character"
).slice(0, 3);

const verificationHistory = [
  {
    id: "audit-001",
    name: "ContextBridge Pro",
    type: "MCP",
    status: "Verified",
    score: 94,
    date: "2024-03-15",
  },
  {
    id: "audit-002",
    name: "SwarmCoord A2A",
    type: "A2A",
    status: "Verified",
    score: 95,
    date: "2024-02-28",
  },
  {
    id: "audit-003",
    name: "TrustBridge A2A",
    type: "A2A",
    status: "Pending",
    date: "2024-03-20",
  },
];

export default function DashboardPage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your SBTs, track audits, and monitor agent performance.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <Package className="h-8 w-8 text-sovereign" />
            <div>
              <div className="text-2xl font-bold">{ownedCharacters.length}</div>
              <div className="text-xs text-muted-foreground">Owned SBTs</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <Shield className="h-8 w-8 text-guardian" />
            <div>
              <div className="text-2xl font-bold">2</div>
              <div className="text-xs text-muted-foreground">Verified</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <Clock className="h-8 w-8 text-scout" />
            <div>
              <div className="text-2xl font-bold">1</div>
              <div className="text-xs text-muted-foreground">Pending Audit</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <Award className="h-8 w-8 text-creator" />
            <div>
              <div className="text-2xl font-bold">94.5</div>
              <div className="text-xs text-muted-foreground">
                Avg POAI Score
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Owned SBTs */}
        <div>
          <h2 className="mb-4 text-xl font-bold">Owned SBTs</h2>
          <div className="space-y-4">
            {ownedCharacters.map((char) => (
              <Card key={char.id}>
                <CardContent className="pt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{char.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {char.category}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/character/${char.id}`}>View</a>
                    </Button>
                  </div>
                  <SbtBadge
                    sbtType={char.sbtType}
                    charterRef={char.charterRef}
                    riskTier={char.riskTier}
                    archetype={char.archetype}
                    evolutionStage={char.evolutionStage}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Verification History */}
        <div>
          <h2 className="mb-4 text-xl font-bold">Verification History</h2>
          <div className="space-y-4">
            {verificationHistory.map((audit) => (
              <Card key={audit.id}>
                <CardContent className="flex items-center justify-between pt-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{audit.name}</p>
                      <Badge variant="secondary">{audit.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Submitted {audit.date}
                    </p>
                  </div>
                  <div className="text-right">
                    {audit.status === "Verified" ? (
                      <>
                        <Badge
                          variant="outline"
                          className="mb-1 border-emerald-500/50 text-emerald-600"
                        >
                          <Shield className="mr-1 h-3 w-3" />
                          Verified
                        </Badge>
                        <p className="text-sm font-bold text-emerald-600">
                          {audit.score}/100
                        </p>
                      </>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
