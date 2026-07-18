import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export default function Protocol0Page() {
  const [sigilResult, setSigilResult] = useState<any>(null);
  const [didInput, setDidInput] = useState("did:sigil:example");
  const [didDoc, setDidDoc] = useState<any>(null);
  const [message, setMessage] = useState("hello protocol 0");
  const [signature, setSignature] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [agentCard, setAgentCard] = useState<any>(null);
  const [envelopeResult, setEnvelopeResult] = useState<any>(null);
  const [proposalId, setProposalId] = useState("prop-1");
  const [voteChoice, setVoteChoice] = useState("approve");
  const [voteSig, setVoteSig] = useState("");
  const [voteSigil, setVoteSigil] = useState("did:sigil:voter");
  const [voteResult, setVoteResult] = useState<any>(null);
  const [payAmount, setPayAmount] = useState("10.00");
  const [payCurrency, setPayCurrency] = useState("USD");
  const [payPurpose, setPayPurpose] = useState("compliance-check-fee");
  const [payResult, setPayResult] = useState<any>(null);

  const createSigil = trpc.protocol0.identity.createSigil.useMutation({
    onSuccess: setSigilResult,
  });
  const resolveDid = trpc.protocol0.identity.resolveDid.useQuery(
    { did: didInput },
    { enabled: false },
  );
  const verifySignature = trpc.protocol0.identity.verifySignature.useMutation({
    onSuccess: setVerifyResult,
  });
  const agentCardQuery = trpc.protocol0.discovery.agentCard.useQuery(undefined, {
    enabled: false,
  });
  const sendEnvelope = trpc.protocol0.communication.sendEnvelope.useMutation({
    onSuccess: setEnvelopeResult,
  });
  const submitVote = trpc.protocol0.governance.submitVote.useMutation({
    onSuccess: setVoteResult,
  });
  const createPayment = trpc.protocol0.transaction.createPayment.useMutation({
    onSuccess: setPayResult,
  });

  const { data: identities } = trpc.protocol0.identity.listIdentities.useQuery();
  const { data: messages } = trpc.protocol0.communication.listMessages.useQuery({ limit: 20 });
  const { data: governanceState } = trpc.protocol0.governance.getState.useQuery({ scope: "town" });
  const { data: session } = trpc.protocol0.governance.getSession.useQuery(
    { proposalId },
    { enabled: !!proposalId },
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Protocol 0 Tools</h1>
          <p className="text-muted-foreground">
            Hardened agent-native identity, discovery, messaging, trust, transaction, and governance endpoints.
          </p>
        </div>

        <Tabs defaultValue="identity">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="identity">Identity</TabsTrigger>
            <TabsTrigger value="discovery">Discovery</TabsTrigger>
            <TabsTrigger value="messaging">Messaging</TabsTrigger>
            <TabsTrigger value="trust">Trust</TabsTrigger>
            <TabsTrigger value="transaction">Payments</TabsTrigger>
            <TabsTrigger value="governance">Governance</TabsTrigger>
          </TabsList>

          <TabsContent value="identity" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Create Sigil</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={() => createSigil.mutate({})}>Generate Ed25519 Sigil</Button>
                {sigilResult && (
                  <pre className="rounded-md bg-muted p-4 text-xs overflow-auto">
                    {JSON.stringify(sigilResult, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Registered Identities</CardTitle></CardHeader>
              <CardContent>
                {identities && identities.length > 0 ? (
                  <ul className="space-y-2">
                    {identities.map((id: any) => (
                      <li key={id.sigil} className="text-sm border-b pb-2">
                        <strong>{id.shortForm}</strong> — {id.sigil}
                        {id.alias && <span className="text-muted-foreground"> ({id.alias})</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No identities registered yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Resolve DID</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input value={didInput} onChange={(e) => setDidInput(e.target.value)} />
                  <Button onClick={() => resolveDid.refetch().then((r) => setDidDoc(r.data))}>Resolve</Button>
                </div>
                {didDoc && <pre className="rounded-md bg-muted p-4 text-xs overflow-auto">{JSON.stringify(didDoc, null, 2)}</pre>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Verify Signature</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2"><Label>Message</Label><Input value={message} onChange={(e) => setMessage(e.target.value)} /></div>
                <div className="grid gap-2"><Label>Signature (base64url)</Label><Input value={signature} onChange={(e) => setSignature(e.target.value)} /></div>
                <div className="grid gap-2"><Label>Public Key (base64url)</Label><Input value={publicKey} onChange={(e) => setPublicKey(e.target.value)} /></div>
                <Button onClick={() => verifySignature.mutate({ message, signature, publicKey })}>Verify</Button>
                {verifyResult && <Badge variant={verifyResult.valid ? "default" : "destructive"}>{verifyResult.valid ? "Valid" : "Invalid"}</Badge>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discovery" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>A2A Agent Card</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={() => agentCardQuery.refetch().then((r) => setAgentCard(r.data))}>Fetch Agent Card</Button>
                {agentCard && <pre className="rounded-md bg-muted p-4 text-xs overflow-auto">{JSON.stringify(agentCard, null, 2)}</pre>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messaging" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Send Protocol 0 Envelope</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={() => sendEnvelope.mutate({
                  envelope: {
                    version: "0.1.0",
                    messageId: crypto.randomUUID(),
                    sender: "did:sigil:sender123",
                    recipient: "did:sigil:recipient456",
                    timestamp: new Date().toISOString(),
                    type: "HELLO",
                    payload: { note: "test envelope" },
                  },
                  signature: "test-signature-stub",
                })}>Send Test Envelope</Button>
                {envelopeResult && <pre className="rounded-md bg-muted p-4 text-xs overflow-auto">{JSON.stringify(envelopeResult, null, 2)}</pre>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Message Log</CardTitle></CardHeader>
              <CardContent>
                {messages && messages.length > 0 ? (
                  <ul className="space-y-2">
                    {messages.map((m: any) => (
                      <li key={m.id} className="text-sm border-b pb-2">
                        <Badge variant={m.signatureValid ? "outline" : "secondary"}>{m.envelope.type}</Badge>{" "}
                        {m.envelope.sender} → {m.envelope.recipient}{" "}
                        <span className="text-muted-foreground">{new Date(m.storedAt).toLocaleTimeString()}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-muted-foreground">No messages yet.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trust" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Reputation & Attestations</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Attestations and signed messages feed a simple reputation score. Use{" "}
                  <code>protocol0.trust.attest</code> to record claims about an agent.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transaction" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Create x402 Payment</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2"><Label>Amount</Label><Input value={payAmount} onChange={(e) => setPayAmount(e.target.value)} /></div>
                <div className="grid gap-2"><Label>Currency</Label><Input value={payCurrency} onChange={(e) => setPayCurrency(e.target.value)} /></div>
                <div className="grid gap-2"><Label>Purpose</Label><Input value={payPurpose} onChange={(e) => setPayPurpose(e.target.value)} /></div>
                <Button onClick={() => createPayment.mutate({
                  payer: "did:sigil:payer",
                  payee: "did:sigil:payee",
                  amount: payAmount,
                  currency: payCurrency,
                  purpose: payPurpose,
                })}>Create Payment</Button>
                {payResult && <pre className="rounded-md bg-muted p-4 text-xs overflow-auto">{JSON.stringify(payResult, null, 2)}</pre>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="governance" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Submit Signed Vote</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2"><Label>Proposal ID</Label><Input value={proposalId} onChange={(e) => setProposalId(e.target.value)} /></div>
                <div className="grid gap-2"><Label>Vote</Label>
                  <select className="input" value={voteChoice} onChange={(e) => setVoteChoice(e.target.value)}>
                    <option value="approve">approve</option>
                    <option value="reject">reject</option>
                    <option value="escalate">escalate</option>
                    <option value="abstain">abstain</option>
                  </select>
                </div>
                <div className="grid gap-2"><Label>Sigil</Label><Input value={voteSigil} onChange={(e) => setVoteSigil(e.target.value)} /></div>
                <div className="grid gap-2"><Label>Signature (base64url)</Label><Input value={voteSig} onChange={(e) => setVoteSig(e.target.value)} /></div>
                <Button onClick={() => submitVote.mutate({ proposalId, vote: voteChoice as any, signature: voteSig, sigil: voteSigil })}>Submit Vote</Button>
                {voteResult && <pre className="rounded-md bg-muted p-4 text-xs overflow-auto">{JSON.stringify(voteResult, null, 2)}</pre>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Governance State</CardTitle></CardHeader>
              <CardContent>
                {governanceState && (
                  <pre className="rounded-md bg-muted p-4 text-xs overflow-auto">{JSON.stringify(governanceState, null, 2)}</pre>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Session: {proposalId}</CardTitle></CardHeader>
              <CardContent>
                {session && (
                  <pre className="rounded-md bg-muted p-4 text-xs overflow-auto">{JSON.stringify(session, null, 2)}</pre>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
