// csoai-mavis7-sdk.ts - The CSOAI Mavis-7 License SDK
// Production-ready npm package that lets any third-party developer integrate Mavis-7 license generation + verification into their own apps
// Full TypeScript types + 3-line wedge + the public /verify endpoint

import crypto from "node:crypto"

export type Mavis7Tier = "personal" | "opensource" | "commercial" | "enterprise" | "oem"
export type Mavis7Badge = "founding_fork" | "builder" | "pioneer" | "partner" | "team"

export interface Mavis7License {
  commitId: string
  name: string
  email: string
  company?: string
  useCase: string
  tier: Mavis7Tier
  badgeTier: Mavis7Badge
  licenseText: string
  publicKey: string
  signature: string
  signedAt: string
  verifyUrl: string
  earlyAdopterDiscount: boolean
}

export interface VerifyResult {
  valid: boolean
  license?: Mavis7License
  reason?: string
}

export interface SDKOptions {
  apiBaseUrl: string
  apiKey?: string
  generateKeyPair?: boolean
}

const DEFAULT_OPTIONS: SDKOptions = { apiBaseUrl: "https://api.csoai.org", generateKeyPair: true }

export class CSOAIMavis7SDK {
  private options: SDKOptions
  private keyPair: crypto.KeyPairSyncResult | null = null

  constructor(options: Partial<SDKOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    if (this.options.generateKeyPair) {
      this.keyPair = crypto.generateKeyPairSync("ed25519")
    }
  }

  // ===== Generate a Mavis-7 license (3-line wedge) =====
  async commit(input: { name: string; email: string; company?: string; useCase: string; tier: Mavis7Tier }): Promise<Mavis7License> {
    const response = await fetch(`${this.options.apiBaseUrl}/api/mavis7/commit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(this.options.apiKey ? { Authorization: `Bearer ${this.options.apiKey}` } : {}) },
      body: JSON.stringify(input),
    })
    if (!response.ok) throw new Error(`Failed to commit Mavis-7 license: ${response.statusText}`)
    return await response.json() as Mavis7License
  }

  // ===== Verify a Mavis-7 license (3-line wedge) =====
  async verify(commitId: string): Promise<VerifyResult> {
    const response = await fetch(`${this.options.apiBaseUrl}/api/mavis7/verify/${commitId}`)
    if (!response.ok) return { valid: false, reason: `License not found: ${response.statusText}` }
    return await response.json() as VerifyResult
  }

  // ===== Generate a Mavis-7 license locally (offline mode) =====
  commitLocal(input: { name: string; email: string; company?: string; useCase: string; tier: Mavis7Tier }): Mavis7License {
    if (!this.keyPair) throw new Error("Key pair not generated. Set generateKeyPair: true in options.")
    const commitId = `mavis7-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`
    const signedAt = new Date().toISOString()
    const badgeTier: Mavis7Badge = "founding_fork"
    const earlyAdopterDiscount = true
    const licenseText = this.generateLicenseText(input, commitId, signedAt, badgeTier, earlyAdopterDiscount)
    const signature = crypto.createSign("SHA256").update(licenseText).sign(this.keyPair.privateKey, "hex")
    return {
      commitId, name: input.name, email: input.email, company: input.company, useCase: input.useCase, tier: input.tier, badgeTier, licenseText,
      publicKey: this.keyPair.publicKey.export({ format: "pem", type: "spki" }).toString(),
      signature, signedAt, verifyUrl: `${this.options.apiBaseUrl}/verify/mavis7/${commitId}`, earlyAdopterDiscount,
    }
  }

  // ===== Generate the Mavis-7 license text =====
  private generateLicenseText(input: { name: string; email: string; company?: string; useCase: string; tier: Mavis7Tier }, commitId: string, signedAt: string, badgeTier: Mavis7Badge, earlyAdopterDiscount: boolean): string {
    return `Mavis-7 License v1.0
=========================

Commit ID: ${commitId}
Licensee: ${input.name} <${input.email}>
${input.company ? `Company: ${input.company}\n` : ""}Use case: ${input.useCase}
Tier: ${input.tier}
Badge: ${badgeTier}
Early Adopter Discount: ${earlyAdopterDiscount ? "Yes (50% off commercial)" : "No"}
Signed: ${signedAt}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

1. The above copyright notice and this permission notice shall be included
   in all copies or substantial portions of the Software.

2. The MEOK, MEOK AI Labs, MEOKOS, Mavis, and Mavis-7 trademarks and trade
   names are the property of MEOK AI Labs Ltd. You may NOT use these
   trademarks or trade names in your fork or derivative work. You MAY use
   the architecture, but you MUST ship under your own brand.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.`
  }

  // ===== Get the live Mavis-7 commit counter =====
  async getCounter(): Promise<{ totalCommits: number; earlyAdopterCount: number; earlyAdopterTarget: number }> {
    const response = await fetch(`${this.options.apiBaseUrl}/api/mavis7/counter`)
    if (!response.ok) throw new Error(`Failed to get Mavis-7 counter: ${response.statusText}`)
    return await response.json() as any
  }

  // ===== Get the early adopter progress =====
  async getEarlyAdopter(): Promise<{ earlyAdopterCount: number; earlyAdopterTarget: number; progress: string }> {
    const response = await fetch(`${this.options.apiBaseUrl}/api/mavis7/early-adopter`)
    if (!response.ok) throw new Error(`Failed to get early adopter: ${response.statusText}`)
    return await response.json() as any
  }
}

export default CSOAIMavis7SDK
export { CSOAIMavis7SDK }
