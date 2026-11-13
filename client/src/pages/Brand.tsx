import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeCheck, ShieldAlert, Mail } from "lucide-react";

/**
 * /brand — canonical surfaces and the impostor notice.
 *
 * WHY. Third parties sell "CSOAI certification" badges and publish pages
 * describing a "CSOAI" that certifies — that is not us, and our whole doctrine
 * is that a certification could never come from us. This page states, in one
 * place, which surfaces are ours and warns readers about the rest.
 */

const SURFACES = [
  { label: "councilof.ai", note: "this site — the board, the evidence, the APIs" },
  { label: "csoai.org", note: "redirects to councilof.ai" },
  { label: "meok.ai", note: "related MEOK project; assess its ownership and evidence separately from CSOAI Ltd" },
  { label: "Hugging Face: csoai", note: "published datasets, models and Spaces; each repository carries its own content and update history" },
  { label: "GitHub: CSOAI-ORG", note: "councilof-ai source, gspc-board mirror" },
  { label: "PyPI: csoai", note: "csoai, csoai-gspc, csoai-evidence-fabric and sibling packages" },
  { label: "npm: csoai / @meok-labs", note: "csoai-gspc-mcp, @csoai/gspc-cli, x402 rail client" },
  { label: "MCP registry: ai.councilof/gspc", note: "the official MCP registry listing (both doors)" },
  { label: "Kaggle: nicktempleman", note: "csoai-* dataset mirrors (living board, censuses)" },
];

export default function Brand() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Canonical surfaces</h1>
      <p className="mt-2 text-muted-foreground">
        Council of AI is operated by CSOAI Ltd (UK Companies House 16939677).
        {" "}These are Council publishing locations and related MEOK channels. Check each asset's publisher and licence before attributing it to a legal entity.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BadgeCheck className="h-4 w-4" /> The list
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {SURFACES.map((s) => (
              <li key={s.label}>
                <span className="font-medium">{s.label}</span>
                <span className="text-muted-foreground"> — {s.note}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <p className="mt-5 text-sm text-muted-foreground">
        A listing or mention does not establish endorsement or customer use. Read the{" "}
        <a href="/traction/#external-use" className="font-semibold underline underline-offset-4">dated evidence of outside use</a>{" "}
        and the separate commercial position.
      </p>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4" /> Impostors and name collisions
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            We measure. We never certify. There is no "CSOAI certification", no
            "CSOAI-Authorised" status, and no "CASA Certification" — npm packages
            and pages using those names (for example under the <code className="rounded bg-muted px-1">@csgaglobal</code> npm
            scope) are not operated by us and contradict our published doctrine.
            We sell signed measurement artifacts whose bytes anyone can verify
            for free; a certification is the one thing this body could never sell.
          </p>
          <p className="mt-3">
            Found a page, package, or person claiming to certify on our behalf?{" "}
            <a href="https://councilof.ai/contact" className="underline decoration-dotted underline-offset-2">Tell us</a>{" "}
            — it goes in the corrections ledger if we got something wrong, and on
            this page if someone else got it wrong for us.
          </p>
        </CardContent>
      </Card>

      <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Mail className="h-3 w-3" /> nicholas@csoai.org — the one mailbox, Mon–Fri 09:00–18:00 Europe/London
      </p>
    </div>
  );
}
