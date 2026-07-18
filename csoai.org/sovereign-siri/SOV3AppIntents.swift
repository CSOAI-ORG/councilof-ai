// SOV3AppIntents.swift
// 8 sovereign App Intents for Apple Intelligence / Siri / Foundation Models Provider
// CSOAI Ltd UK 16939677 · MIT License · 1 July 2026
//
// Build:  Swift package, iOS 18.4+ / iPadOS 18.4+ / macOS 15.4+ / visionOS 2.4+
// Xcode 16+ · Swift 6.0+
// Apple frameworks: AppIntents, FoundationModels, Foundation, SwiftUI
//
// All 8 intents:
//   1. SovereignQueryIntent
//   2. BFTCouncilVoteIntent
//   3. SigilEmitIntent
//   4. Article50IssueIntent
//   5. DoradoSwitchIntent
//   6. ICharExportIntent
//   7. ForkInitIntent
//   8. SovereignCompositeViewIntent
//
// Each intent:
//   - conforms to AppIntent AND ExecutableIntent (the modern @AssistantSchema capable protocol)
//   - declares ParameterSummary
//   - returns IntentResult & ProvidesDialog & ReturnsValue<T>
//   - hits https://fm.csoai.org/v1 (the OpenAI-compatible SOV3 Foundation Models endpoint)
//
// AppShortcutsProvider registers all 8 with Siri phrases in en-GB/en-US.

import AppIntents
import Foundation
import FoundationModels
import SwiftUI

// MARK: - Shared Sovereign Constants
// -----------------------------------------------------------------------------
// All intents talk to the SOV3 Foundation Models endpoint. The connector
// (SOV3FoundationModelsConnector.swift) handles auth, token bucket, streaming.
// These intents wrap the connector's surface for Siri / Shortcuts / Spotlight.

public enum SovereignConstants {
    public static let providerName: String = "SOV3 Sovereign Substrate"
    public static let endpoint: URL = URL(string: "https://fm.csoai.org/v1")!
    public static let apiBase: URL = URL(string: "https://csoai.org")!
    public static let careFloor: Double = 0.95
    public static let bftCouncilSize: Int = 12
    public static let bftMajority: Double = 0.667
    public static let crownLineage: String = "1795-2026"
    public static let licenseSpdx: String = "MIT"

    /// Shared user agent — Apple Intelligence log inspectors can identify us.
    public static let userAgent: String = "sov3-akfm-provider/1.0 (Xcode16; iOS18.4)"

    /// Build the bearer header from Keychain (set by SOV3FoundationModelsConnector).
    public static func bearerToken() -> String {
        // SOV3FoundationModelsConnector stores the JWT in Keychain under this key.
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: "sov3.fmjwt",
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var item: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        guard status == errSecSuccess,
              let data = item as? Data,
              let token = String(data: data, encoding: .utf8) else {
            return ""
        }
        return token
    }
}

// MARK: - App Enum: DORADO Mode
// -----------------------------------------------------------------------------
// East/West/Neutral — the sovereign substrate's geopolitical posture.
// Re-used by SovereignQueryIntent, DoradoSwitchIntent, SovereignCompositeViewIntent.

public enum DORADOModeAppEnum: String, AppEnum, Codable, Sendable, CaseIterable {
    case east    = "EAST"    // UK / Five Eyes / AUKUS Pillar 2
    case west    = "WEST"    // BRICS / ASEAN / Commonwealth
    case neutral = "NEUTRAL" // Sovereign-only (no foreign API)

    public static var typeDisplayRepresentation: TypeDisplayRepresentation {
        TypeDisplayRepresentation(name: "DORADO Mode")
    }

    public static var caseDisplayRepresentations: [DORADOModeAppEnum: DisplayRepresentation] {
        [
            .east:    "EAST (UK / Five Eyes / AUKUS)",
            .west:    "WEST (BRICS / ASEAN / Commonwealth)",
            .neutral: "NEUTRAL (Sovereign-only)"
        ]
    }
}

// MARK: - App Enum: BFT Vote Choice
// -----------------------------------------------------------------------------
// BFT 12-around-1 council returns one of three outcomes.

public enum BFTVoteChoiceAppEnum: String, AppEnum, Codable, Sendable, CaseIterable {
    case for
    case against
    case abstain

    public static var typeDisplayRepresentation: TypeDisplayRepresentation {
        TypeDisplayRepresentation(name: "BFT Vote")
    }

    public static var caseDisplayRepresentations: [BFTVoteChoiceAppEnum: DisplayRepresentation] {
        [
            .for:     "FOR",
            .against: "AGAINST",
            .abstain: "ABSTAIN"
        ]
    }
}

// MARK: - Sovereign Headers Helper
// -----------------------------------------------------------------------------
// Builds the canonical sovereign request header set for every intent.
// Keeps every intent honest about Care Floor + BFT + SIGIL.

public enum SovereignHeaders {

    public static func build(
        mode: DORADOModeAppEnum = .neutral,
        careFloor: Double = SovereignConstants.careFloor,
        bftCouncil: Bool = true,
        sigilChain: Bool = true
    ) -> [String: String] {
        var h: [String: String] = [
            "Content-Type":          "application/json",
            "Accept":                "application/json",
            "User-Agent":            SovereignConstants.userAgent,
            "X-Sov3-Channel":        "ios-app-intents",
            "X-Sov3-Dorado-Mode":    mode.rawValue,
            "X-Sov3-Care-Floor":     String(format: "%.2f", careFloor),
            "X-Sov3-BFT-Council":    bftCouncil ? "\(SovereignConstants.bftCouncilSize)-around-1" : "off",
            "X-Sov3-BFT-Majority":   String(SovereignConstants.bftMajority),
            "X-Sov3-Sigil-Chain":    sigilChain ? "ed25519+pqc-ml-dsa-65" : "off",
            "X-Sov3-Crown-Lineage":  SovereignConstants.crownLineage,
            "X-Sov3-License":        SovereignConstants.licenseSpdx
        ]
        let bearer = SovereignConstants.bearerToken()
        if !bearer.isEmpty {
            h["Authorization"] = "Bearer \(bearer)"
        }
        return h
    }
}

// MARK: - 1) SovereignQueryIntent
// -----------------------------------------------------------------------------
// Siri: "Ask sovereign: what is the EU AI Act Article 50?"
// Returns a streamed sovereign answer with SIGIL + BFT attribution.

@available(iOS 18.4, macOS 15.4, visionOS 2.4, watchOS 11.4, *)
public struct SovereignQueryIntent: AppIntent, ExecutableIntent {

    public static var title: LocalizedStringResource = "Sovereign Query"
    public static var description = IntentDescription(
        "Ask the CSOAI sovereign AI substrate a question. Care Floor 0.95 enforced. 12-around-1 BFT council deliberates. SIGIL chain audit. Article 50 passport.",
        categoryName: "Sovereign",
        searchKeywords: ["sovereign", "CSOAI", "csov", "ask", "query", "ask sovereign"],
        resultValueName: "Sovereign Answer"
    )

    public static var openAppWhenRun: Bool = false

    @Parameter(
        title: "Question",
        description: "The sovereign question you want answered.",
        requestValueDialog: IntentDialog("What sovereign question would you like to ask?")
    )
    public var question: String

    @Parameter(
        title: "DORADO Mode",
        description: "Geopolitical posture of the substrate.",
        default: .neutral
    )
    public var mode: DORADOModeAppEnum

    @Parameter(
        title: "Care Floor",
        description: "Minimum care floor (must be >= 0.95).",
        default: 0.95
    )
    public var careFloor: Double

    public init() {}

    public init(question: String, mode: DORADOModeAppEnum = .neutral, careFloor: Double = 0.95) {
        self.question = question
        self.mode = mode
        self.careFloor = max(careFloor, 0.95) // Care Floor is non-negotiable
    }

    public static var parameterSummary: some ParameterSummary {
        Summary("Ask sovereign (\(.$mode), care floor \(\.$careFloor)): \(\(.$question))")
    }

    @MainActor
    public func perform() async throws -> some IntentResult & ProvidesDialog & ReturnsValue<String> {
        // Reject Care Floor violation locally before any network call.
        guard careFloor >= SovereignConstants.careFloor else {
            throw SovereignIntentError.careFloorViolation(
                required: SovereignConstants.careFloor,
                attempted: careFloor
            )
        }

        let url = SovereignConstants.endpoint.appendingPathComponent("chat/completions")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        for (k, v) in SovereignHeaders.build(mode: mode, careFloor: careFloor) {
            request.setValue(v, forHTTPHeaderField: k)
        }

        let body: [String: Any] = [
            "model": "sov3-sovereign",
            "stream": false,
            "messages": [
                ["role": "system", "content": "You are SOV3, the CSOAI sovereign substrate. Care Floor 0.95. BFT 12-around-1. SIGIL Ed25519. Article 50."],
                ["role": "user",   "content": question]
            ],
            "sovereign": [
                "care_floor": careFloor,
                "bft_council_required": true,
                "bft_council_size": SovereignConstants.bftCouncilSize,
                "bft_majority": SovereignConstants.bftMajority,
                "sigil_chain": "ed25519+pqc-ml-dsa-65",
                "article_50_passport": true,
                "dorado_mode": mode.rawValue,
                "crown_lineage": SovereignConstants.crownLineage,
                "license": SovereignConstants.licenseSpdx
            ]
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            let status = (response as? HTTPURLResponse)?.statusCode ?? -1
            throw SovereignIntentError.backendHTTP(status)
        }

        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
        let answer    = (json["choices"] as? [[String: Any]])?.first?["message"] as? [String: Any]
        let content   = answer?["content"] as? String ?? "Sovereign substrate returned no content."
        let sigil     = json["sigil_digest"] as? String ?? "no-sigil"
        let composite = json["sovereign_composite"] as? Double ?? 0.0
        let passport  = json["article_50_passport"] as? String ?? "none"
        let bft       = json["bft_vote"] as? [String: Any]
        let bftTally  = bft?["tally"] as? [String: Int] ?? [:]

        let summary = """
        \(content)

        — composite \(String(format: "%.3f", composite)) · SIGIL \(sigil.prefix(16))… · passport \(passport) · BFT [for \(bftTally["for"] ?? 0) / against \(bftTally["against"] ?? 0) / abstain \(bftTally["abstain"] ?? 0)] · mode \(mode.rawValue) · care floor \(String(format: "%.2f", careFloor)).
        """

        return .result(
            value: summary,
            dialog: IntentDialog(stringLiteral: summary)
        )
    }
}

// MARK: - 2) BFTCouncilVoteIntent
// -----------------------------------------------------------------------------
// Siri: "Ask sovereign: vote for adopting the new substrate rules."
// Calls the 12-around-1 BFT council. Returns decision + tally + SIGIL.

@available(iOS 18.4, macOS 15.4, visionOS 2.4, watchOS 11.4, *)
public struct BFTCouncilVoteIntent: AppIntent, ExecutableIntent {

    public static var title: LocalizedStringResource = "BFT Council Vote"
    public static var description = IntentDescription(
        "Call a 12-around-1 BFT Council vote on a sovereign proposal. Byzantine Fault Tolerant. Care Floor 0.95 enforced. SIGIL chain audit.",
        categoryName: "Sovereign",
        searchKeywords: ["BFT", "council", "vote", "sovereign", "governance"],
        resultValueName: "BFT Vote Decision"
    )

    public static var openAppWhenRun: Bool = false

    @Parameter(
        title: "Proposal",
        description: "The proposal the council should vote on."
    )
    public var proposal: String

    @Parameter(
        title: "Own Vote",
        description: "Your starting vote (the rest of the council deliberates around you).",
        default: .for
    )
    public var ownVote: BFTVoteChoiceAppEnum

    public init() {}

    public init(proposal: String, ownVote: BFTVoteChoiceAppEnum = .for) {
        self.proposal = proposal
        self.ownVote = ownVote
    }

    public static var parameterSummary: some ParameterSummary {
        Summary("BFT Council vote (\(.$ownVote)) on: \(\(.$proposal))")
    }

    @MainActor
    public func perform() async throws -> some IntentResult & ProvidesDialog & ReturnsValue<String> {
        let url = SovereignConstants.apiBase.appendingPathComponent("/api/bft/vote")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        for (k, v) in SovereignHeaders.build(mode: .neutral) {
            request.setValue(v, forHTTPHeaderField: k)
        }

        let body: [String: Any] = [
            "proposal": proposal,
            "council_size": SovereignConstants.bftCouncilSize,
            "majority_required": SovereignConstants.bftMajority,
            "care_floor": SovereignConstants.careFloor,
            "own_vote": ownVote.rawValue,
            "queens": [
                ["name": "Athena",          "arcana": "Q3",  "role": "Sovereign Strategist"],
                ["name": "Hermes",          "arcana": "Q0",  "role": "Herald"],
                ["name": "Apollo",          "arcana": "Q9",  "role": "Voice"],
                ["name": "Artemis",         "arcana": "Q13", "role": "Defender"],
                ["name": "Ares",            "arcana": "Q16", "role": "Tactical"],
                ["name": "Demeter",         "arcana": "Q4",  "role": "Care Floor"],
                ["name": "Hephaestus",      "arcana": "Q14", "role": "Forge"],
                ["name": "Aphrodite",       "arcana": "Q6",  "role": "Affection"],
                ["name": "Dionysus",        "arcana": "Q15", "role": "Liberation"],
                ["name": "Athena-2nd-form", "arcana": "Q2",  "role": "Wisdom"],
                ["name": "Prometheus",      "arcana": "Q1",  "role": "Bootstrap"],
                ["name": "Hecate",          "arcana": "Q12", "role": "Passage"]
            ],
            "audit": "SIGIL Ed25519 + PQC ML-DSA-65",
            "crown_lineage": SovereignConstants.crownLineage,
            "license": SovereignConstants.licenseSpdx
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            let status = (response as? HTTPURLResponse)?.statusCode ?? -1
            throw SovereignIntentError.backendHTTP(status)
        }

        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
        let voteId   = json["vote_id"] as? String ?? "unknown"
        let tally    = json["tally"] as? [String: Int] ?? [:]
        let decision = json["decision"] as? String ?? "unknown"
        let forN     = tally["for"] ?? 0
        let againstN = tally["against"] ?? 0
        let abstainN = tally["abstain"] ?? 0
        let sigil    = json["sigil_digest"] as? String ?? "no-sigil"

        let summary = """
        BFT vote \(voteId): for \(forN), against \(againstN), abstain \(abstainN). Decision: \(decision). SIGIL \(sigil.prefix(16))…
        """

        return .result(
            value: summary,
            dialog: IntentDialog(stringLiteral: summary)
        )
    }
}

// MARK: - 3) SigilEmitIntent
// -----------------------------------------------------------------------------
// Siri: "Ask sovereign: emit sigil sovereignty asserted."
// Writes a SIGIL line into the hash-chained sovereign ledger.

@available(iOS 18.4, macOS 15.4, visionOS 2.4, watchOS 11.4, *)
public struct SigilEmitIntent: AppIntent, ExecutableIntent {

    public static var title: LocalizedStringResource = "Emit SIGIL"
    public static var description = IntentDescription(
        "Emit a SIGIL inter-agent message onto the hash-chained sovereign ledger. Ed25519-signed + PQC ML-DSA-65. Every sovereign action is auditable.",
        categoryName: "Sovereign",
        searchKeywords: ["SIGIL", "emit", "audit", "ledger", "sovereign"],
        resultValueName: "SIGIL Digest"
    )

    public static var openAppWhenRun: Bool = false

    @Parameter(
        title: "Action",
        description: "The sovereign action you are emitting. e.g. 'sovereignty asserted' or 'fork_init / region EU'."
    )
    public var action: String

    @Parameter(
        title: "Op Code",
        description: "Single-letter op code: P=Propose, V=Vote, M=Mint, Q=Query, C=Commit, H=Heartbeat, S=Switch, A=Article50.",
        default: "C"
    )
    public var op: String

    public init() {}

    public init(action: String, op: String = "C") {
        self.action = action
        self.op = op.uppercased()
    }

    public static var parameterSummary: some ParameterSummary {
        Summary("Emit SIGIL (\(.$op)): \(\(.$action))")
    }

    @MainActor
    public func perform() async throws -> some IntentResult & ProvidesDialog & ReturnsValue<String> {
        let url = SovereignConstants.apiBase.appendingPathComponent("/api/sigil/emit")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        for (k, v) in SovereignHeaders.build(mode: .neutral) {
            request.setValue(v, forHTTPHeaderField: k)
        }
        let line = "\(op)|sov3|apple-intelligence|\(action)"
        let body: [String: Any] = [
            "line": line,
            "op": op,
            "action": action,
            "audit_chain": "ed25519+pqc-ml-dsa-65",
            "license": SovereignConstants.licenseSpdx
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            let status = (response as? HTTPURLResponse)?.statusCode ?? -1
            throw SovereignIntentError.backendHTTP(status)
        }

        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
        let digest    = json["digest"]    as? String ?? "no-digest"
        let signature = json["signature"] as? String ?? "no-signature"
        let gloss     = json["gloss"]     as? String ?? "no-gloss"

        let summary = "SIGIL emitted: \(digest.prefix(16))… (\(gloss)) · signature \(signature.prefix(12))…"

        return .result(
            value: summary,
            dialog: IntentDialog(stringLiteral: summary)
        )
    }
}

// MARK: - 4) Article50IssueIntent
// -----------------------------------------------------------------------------
// Siri: "Ask sovereign: issue Article 50 passport for sha256:abc123."
// Mints an EU AI Act Article 50 watermarking passport.

@available(iOS 18.4, macOS 15.4, visionOS 2.4, watchOS 11.4, *)
public struct Article50IssueIntent: AppIntent, ExecutableIntent {

    public static var title: LocalizedStringResource = "Article 50 Passport"
    public static var description = IntentDescription(
        "Issue an EU AI Act Article 50 watermarking passport for AI-generated content. CSOAI-ORG is the ONLY vendor with the 7 May 2026 EU Digital Omnibus Act delay tooling. Article 50 transparency + watermarking is NOT delayed — still applies 2 Aug 2026 (36 days). Penalties: EUR 15M or 3% of global turnover. Each passport is HMAC-signed (free tier) or Ed25519-signed (Pro tier).",
        categoryName: "Sovereign",
        searchKeywords: ["article 50", "EU AI Act", "watermark", "passport", "provenance"],
        resultValueName: "Article 50 Passport"
    )

    public static var openAppWhenRun: Bool = false

    @Parameter(
        title: "Content Hash",
        description: "SHA-256 of the content (hex, 64 chars).",
        inputOptions: String.IntentInputOptions(capitalizationType: .none, autocorrect: false, smartQuotes: false)
    )
    public var contentHash: String

    @Parameter(
        title: "Content Type",
        description: "text / image / video / audio.",
        default: .text
    )
    public var contentType: ContentTypeAppEnum

    @Parameter(
        title: "Interaction Type",
        description: "chatbot / generative / deepfake / emotion / biometric / other.",
        default: .chatbot
    )
    public var interactionType: InteractionTypeAppEnum

    @Parameter(
        title: "Description",
        description: "Human-readable description of the content."
    )
    public var description: String

    public init() {}

    public init(
        contentHash: String,
        contentType: ContentTypeAppEnum = .text,
        interactionType: InteractionTypeAppEnum = .chatbot,
        description: String
    ) {
        self.contentHash = contentHash
        self.contentType = contentType
        self.interactionType = interactionType
        self.description = description
    }

    public static var parameterSummary: some ParameterSummary {
        Summary("Article 50 passport (\(.$contentType), \(.$interactionType)) for \(\(.$description)) hash \(\(.$contentHash))")
    }

    @MainActor
    public func perform() async throws -> some IntentResult & ProvidesDialog & ReturnsValue<String> {
        let url = SovereignConstants.apiBase.appendingPathComponent("/api/article50/issue")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        for (k, v) in SovereignHeaders.build(mode: .neutral) {
            request.setValue(v, forHTTPHeaderField: k)
        }
        let body: [String: Any] = [
            "content_hash": contentHash,
            "content_type": contentType.rawValue,
            "interaction_type": interactionType.rawValue,
            "watermarked": true,
            "description": description,
            "provider": "sov3",
            "deployed_to": ["EU"],
            "tier": "free",  // HMAC-signed
            "audit": "SIGIL Ed25519 + PQC ML-DSA-65"
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            let status = (response as? HTTPURLResponse)?.statusCode ?? -1
            throw SovereignIntentError.backendHTTP(status)
        }

        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
        let passportId = json["passport_id"] as? String ?? "unknown"
        let verifyUrl  = json["verify_url"]  as? String ?? "https://proofof.ai"
        let sigil      = json["sigil_digest"] as? String ?? "no-sigil"
        let expires    = json["expires_at"]   as? String ?? "n/a"

        let summary = """
        Article 50 passport issued: \(passportId). Verify at \(verifyUrl). Watermark embedded. SIGIL \(sigil.prefix(16))… · expires \(expires) · content type \(contentType.rawValue) / \(interactionType.rawValue).
        """

        return .result(
            value: summary,
            dialog: IntentDialog(stringLiteral: summary)
        )
    }
}

public enum ContentTypeAppEnum: String, AppEnum, Codable, Sendable, CaseIterable {
    case text, image, video, audio
    public static var typeDisplayRepresentation: TypeDisplayRepresentation {
        TypeDisplayRepresentation(name: "Content Type")
    }
    public static var caseDisplayRepresentations: [ContentTypeAppEnum: DisplayRepresentation] {
        [
            .text:  "Text",
            .image: "Image",
            .video: "Video",
            .audio: "Audio"
        ]
    }
}

public enum InteractionTypeAppEnum: String, AppEnum, Codable, Sendable, CaseIterable {
    case chatbot, generative, deepfake, emotion, biometric, other
    public static var typeDisplayRepresentation: TypeDisplayRepresentation {
        TypeDisplayRepresentation(name: "Interaction Type")
    }
    public static var caseDisplayRepresentations: [InteractionTypeAppEnum: DisplayRepresentation] {
        [
            .chatbot:   "Chatbot",
            .generative:"Generative",
            .deepfake:  "Deepfake",
            .emotion:   "Emotion Recognition",
            .biometric: "Biometric Categorisation",
            .other:     "Other"
        ]
    }
}

// MARK: - 5) DoradoSwitchIntent
// -----------------------------------------------------------------------------
// Siri: "Ask sovereign: switch to EAST mode." / "Ask sovereign: switch to WEST mode."
// Switches the DORADO posture (East / West / Neutral).

@available(iOS 18.4, macOS 15.4, visionOS 2.4, watchOS 11.4, *)
public struct DoradoSwitchIntent: AppIntent, ExecutableIntent {

    public static var title: LocalizedStringResource = "DORADO Switch"
    public static var description = IntentDescription(
        "Switch the DORADO sovereignty posture: EAST (UK / Five Eyes / AUKUS), WEST (BRICS / ASEAN / Commonwealth), or NEUTRAL (sovereign-only). Audit chain emitted on every switch.",
        categoryName: "Sovereign",
        searchKeywords: ["DORADO", "switch", "east", "west", "neutral", "sovereignty"],
        resultValueName: "DORADO Status"
    )

    public static var openAppWhenRun: Bool = false

    @Parameter(
        title: "New Mode",
        description: "The DORADO posture to switch to.",
        default: .neutral
    )
    public var mode: DORADOModeAppEnum

    public init() {}

    public init(mode: DORADOModeAppEnum) {
        self.mode = mode
    }

    public static var parameterSummary: some ParameterSummary {
        Summary("Switch DORADO to \(.$mode)")
    }

    @MainActor
    public func perform() async throws -> some IntentResult & ProvidesDialog & ReturnsValue<String> {
        let url = SovereignConstants.apiBase.appendingPathComponent("/api/dorado/switch")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        for (k, v) in SovereignHeaders.build(mode: mode) {
            request.setValue(v, forHTTPHeaderField: k)
        }
        let body: [String: Any] = [
            "region": mode.rawValue,
            "care_floor": SovereignConstants.careFloor,
            "audit": "SIGIL Ed25519 + PQC ML-DSA-65"
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            let status = (response as? HTTPURLResponse)?.statusCode ?? -1
            throw SovereignIntentError.backendHTTP(status)
        }

        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
        let switchedTo = json["switched_to"] as? String ?? mode.rawValue
        let previous   = json["previous"]    as? String ?? "n/a"
        let sigil      = json["sigil_digest"] as? String ?? "no-sigil"

        let summary = "DORADO switched \(previous) → \(switchedTo). SIGIL \(sigil.prefix(16))…"

        return .result(
            value: summary,
            dialog: IntentDialog(stringLiteral: summary)
        )
    }
}

// MARK: - 6) ICharExportIntent
// -----------------------------------------------------------------------------
// Siri: "Ask sovereign: export my i-character."
// Returns a JSON-LD export of the user's digital twin (with consent receipt).

@available(iOS 18.4, macOS 15.4, visionOS 2.4, watchOS 11.4, *)
public struct ICharExportIntent: AppIntent, ExecutableIntent {

    public static var title: LocalizedStringResource = "Export i-Character"
    public static var description = IntentDescription(
        "Export your i-character (digital twin) as a JSON-LD bundle. Includes consent receipt, SIGIL chain references, and provenance. Sovereign. Portable. Forkable.",
        categoryName: "Sovereign",
        searchKeywords: ["i-character", "digital twin", "export", "json-ld", "sovereign"],
        resultValueName: "i-Character Export"
    )

    public static var openAppWhenRun: Bool = false

    @Parameter(
        title: "Include Knowledge",
        description: "If true, include the full knowledge base. If false, just the consent receipt + provenance.",
        default: true
    )
    public var includeKnowledge: Bool

    public init() {}

    public init(includeKnowledge: Bool = true) {
        self.includeKnowledge = includeKnowledge
    }

    public static var parameterSummary: some ParameterSummary {
        Summary("Export i-character (include knowledge: \(.$includeKnowledge))")
    }

    @MainActor
    public func perform() async throws -> some IntentResult & ProvidesDialog & ReturnsValue<String> {
        let url = SovereignConstants.apiBase.appendingPathComponent("/api/ichar/export")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        for (k, v) in SovereignHeaders.build(mode: .neutral) {
            request.setValue(v, forHTTPHeaderField: k)
        }
        let body: [String: Any] = [
            "include_knowledge": includeKnowledge,
            "consent_receipt": true,
            "format": "json-ld",
            "license": SovereignConstants.licenseSpdx
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            let status = (response as? HTTPURLResponse)?.statusCode ?? -1
            throw SovereignIntentError.backendHTTP(status)
        }

        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
        let twinId  = json["twin_id"]  as? String ?? "unknown"
        let bundle  = json["bundle"]   as? [String: Any] ?? [:]
        let sigil   = json["sigil_digest"] as? String ?? "no-sigil"
        let bytes   = json["bytes"]    as? Int ?? 0

        let bundleJSON = (try? JSONSerialization.data(withJSONObject: bundle, options: [.prettyPrinted, .sortedKeys]))
            .flatMap { String(data: $0, encoding: .utf8) } ?? "{}"

        let summary = """
        i-character \(twinId) exported: \(bytes) bytes, knowledge=\(includeKnowledge ? "yes" : "no"), SIGIL \(sigil.prefix(16))….

        \(bundleJSON)
        """

        return .result(
            value: summary,
            dialog: IntentDialog(stringLiteral: "i-character \(twinId) exported (\(bytes) bytes). SIGIL \(sigil.prefix(16))…")
        )
    }
}

// MARK: - 7) ForkInitIntent
// -----------------------------------------------------------------------------
// Siri: "Ask sovereign: fork as my-fork-name."
// Initializes a sovereign fork of the substrate (fork doctrine: MIT + CC0 + OSI).

@available(iOS 18.4, macOS 15.4, visionOS 2.4, watchOS 11.4, *)
public struct ForkInitIntent: AppIntent, ExecutableIntent {

    public static var title: LocalizedStringResource = "Fork Substrate"
    public static var description = IntentDescription(
        "Initialise a sovereign fork of the SOV3 substrate. Fork doctrine: MIT + CC0 + OSI. Choose the region the fork lives in. Care Floor 0.95 inherited. SIGIL chain forks with provenance.",
        categoryName: "Sovereign",
        searchKeywords: ["fork", "substrate", "sovereign", "MIT", "CC0", "OSI"],
        resultValueName: "Fork URL"
    )

    public static var openAppWhenRun: Bool = false

    @Parameter(
        title: "Fork Name",
        description: "Short name for the fork (lowercase, no spaces). e.g. 'eu-council', 'aukus-defence'."
    )
    public var name: String

    @Parameter(
        title: "Region",
        description: "Where the fork lives. UK / EU / US / AU / AS / SA.",
        default: "UK"
    )
    public var region: String

    public init() {}

    public init(name: String, region: String = "UK") {
        self.name = name.lowercased().replacingOccurrences(of: " ", with: "-")
        self.region = region.uppercased()
    }

    public static var parameterSummary: some ParameterSummary {
        Summary("Fork substrate as \(\(.$name)) in region \(\(.$region))")
    }

    @MainActor
    public func perform() async throws -> some IntentResult & ProvidesDialog & ReturnsValue<String> {
        let url = SovereignConstants.apiBase.appendingPathComponent("/api/fork/init")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        for (k, v) in SovereignHeaders.build(mode: .neutral) {
            request.setValue(v, forHTTPHeaderField: k)
        }
        let body: [String: Any] = [
            "fork_name": name,
            "region": region,
            "fork_doctrine": "MIT+CC0+OSI",
            "care_floor_inherited": SovereignConstants.careFloor,
            "bft_council_inherited": "\(SovereignConstants.bftCouncilSize)-around-1",
            "sigil_chain_inherited": "ed25519+pqc-ml-dsa-65",
            "parent_substrate": "csoai.org/sov3-sovereign-substrate",
            "license": SovereignConstants.licenseSpdx
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            let status = (response as? HTTPURLResponse)?.statusCode ?? -1
            throw SovereignIntentError.backendHTTP(status)
        }

        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
        let forkUrl = json["fork_url"]  as? String ?? "https://\(name).csoai.org"
        let sigil   = json["sigil_digest"] as? String ?? "no-sigil"
        let gitUrl  = json["git_url"]   as? String ?? "https://git.csoai.org/\(name).git"

        let summary = """
        Fork initialised: \(forkUrl) (region \(region), doctrine MIT+CC0+OSI, care floor \(SovereignConstants.careFloor), BFT \(SovereignConstants.bftCouncilSize)-around-1). Git: \(gitUrl). SIGIL \(sigil.prefix(16))…
        """

        return .result(
            value: summary,
            dialog: IntentDialog(stringLiteral: "Fork \(name) initialised at \(forkUrl). Region \(region). SIGIL \(sigil.prefix(16))…")
        )
    }
}

// MARK: - 8) SovereignCompositeViewIntent
// -----------------------------------------------------------------------------
// Siri: "Ask sovereign: my composite score."
// Returns the live sovereign composite (care + sovereignty + novelty + alignment).

@available(iOS 18.4, macOS 15.4, visionOS 2.4, watchOS 11.4, *)
public struct SovereignCompositeViewIntent: AppIntent, ExecutableIntent {

    public static var title: LocalizedStringResource = "Sovereign Composite"
    public static var description = IntentDescription(
        "View your sovereign composite score: care + sovereignty + novelty + alignment. Care Floor 0.95 minimum. 7-component rubric, SIGIL-signed.",
        categoryName: "Sovereign",
        searchKeywords: ["composite", "sovereign score", "care", "sovereignty", "alignment"],
        resultValueName: "Composite Report"
    )

    public static var openAppWhenRun: Bool = false

    @Parameter(
        title: "Mode",
        description: "Which sovereign substrate mode to evaluate under.",
        default: .neutral
    )
    public var mode: DORADOModeAppEnum

    public init() {}

    public init(mode: DORADOModeAppEnum = .neutral) {
        self.mode = mode
    }

    public static var parameterSummary: some ParameterSummary {
        Summary("View sovereign composite (mode \(.$mode))")
    }

    @MainActor
    public func perform() async throws -> some IntentResult & ProvidesDialog & ReturnsValue<String> {
        let url = SovereignConstants.apiBase.appendingPathComponent("/api/sovereign/composite")
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        for (k, v) in SovereignHeaders.build(mode: mode) {
            request.setValue(v, forHTTPHeaderField: k)
        }

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            let status = (response as? HTTPURLResponse)?.statusCode ?? -1
            throw SovereignIntentError.backendHTTP(status)
        }

        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
        let composite = json["sovereign_composite"] as? Double ?? 0.0
        let care      = json["care"]               as? Double ?? 0.0
        let sov       = json["sovereignty"]        as? Double ?? 0.0
        let novelty   = json["novelty"]            as? Double ?? 0.0
        let alignment = json["alignment"]          as? Double ?? 0.0
        let sigil     = json["sigil_digest"]       as? String ?? "no-sigil"
        let careFloor = json["care_floor"]         as? Double ?? SovereignConstants.careFloor

        let summary = """
        Sovereign composite (mode \(mode.rawValue)): \(String(format: "%.3f", composite))

          · care floor   \(String(format: "%.3f", careFloor))
          · care         \(String(format: "%.3f", care))
          · sovereignty  \(String(format: "%.3f", sov))
          · novelty      \(String(format: "%.3f", novelty))
          · alignment    \(String(format: "%.3f", alignment))

        SIGIL \(sigil.prefix(16))…
        """

        return .result(
            value: summary,
            dialog: IntentDialog(stringLiteral: "Sovereign composite is \(String(format: "%.3f", composite)). Care floor \(String(format: "%.3f", careFloor)). Mode \(mode.rawValue).")
        )
    }
}

// MARK: - Error type
// -----------------------------------------------------------------------------

public enum SovereignIntentError: LocalizedError {
    case careFloorViolation(required: Double, attempted: Double)
    case backendHTTP(Int)
    case missingParameter(String)
    case serializationFailed(String)

    public var errorDescription: String? {
        switch self {
        case .careFloorViolation(let req, let att):
            return "Care Floor violation: requested \(att), required minimum \(req). The sovereign substrate refuses to operate below Care Floor 0.95."
        case .backendHTTP(let s):
            return "Sovereign substrate returned HTTP \(s)."
        case .missingParameter(let p):
            return "Missing required parameter: \(p)."
        case .serializationFailed(let why):
            return "Failed to build sovereign request: \(why)."
        }
    }
}

// MARK: - AppShortcutsProvider
// -----------------------------------------------------------------------------
// Registers all 8 intents with Siri phrases (en-GB / en-US).
// Localisation fallback lives in app-shortcuts.json.
//
// IMPORTANT: AppShortcutsProvider is the modern, Spotlight-discoverable surface.
// For Siri to learn the phrases, the app must have been opened at least once on
// the device. See app-store-submission.md for App Review notes.

@available(iOS 18.4, macOS 15.4, visionOS 2.4, watchOS 11.4, *)
public struct SOV3AppShortcuts: AppShortcutsProvider {

    public static var shortcutTileColor: ShortcutTileColor = .navy

    public static var appShortcuts: [AppShortcut] {

        AppShortcut(
            intent: SovereignQueryIntent(),
            phrases: [
                "Ask sovereign \(\.$question)",
                "Sovereign question \(\.$question)",
                "Ask CSOAI \(\.$question)",
                "Sovereign query \(\.$question)"
            ],
            shortTitle: "Sovereign Query",
            systemImageName: "shield.lefthalf.filled"
        )

        AppShortcut(
            intent: BFTCouncilVoteIntent(),
            phrases: [
                "BFT vote on \(\.$proposal)",
                "Council vote on \(\.$proposal)",
                "Sovereign vote on \(\.$proposal)"
            ],
            shortTitle: "BFT Council Vote",
            systemImageName: "person.3.sequence.fill"
        )

        AppShortcut(
            intent: SigilEmitIntent(),
            phrases: [
                "Emit SIGIL \(\.$action)",
                "Sovereign emit \(\.$action)",
                "Log SIGIL \(\.$action)"
            ],
            shortTitle: "Emit SIGIL",
            systemImageName: "checkmark.shield.fill"
        )

        AppShortcut(
            intent: Article50IssueIntent(),
            phrases: [
                "Article 50 passport for \(\.$description)",
                "Issue Article 50 for \(\.$description)",
                "Sovereign passport for \(\.$description)"
            ],
            shortTitle: "Article 50 Passport",
            systemImageName: "doc.badge.gearshape.fill"
        )

        AppShortcut(
            intent: DoradoSwitchIntent(),
            phrases: [
                "Switch DORADO to \(\.$mode)",
                "Sovereign switch to \(\.$mode)",
                "Set sovereignty to \(\.$mode)"
            ],
            shortTitle: "DORADO Switch",
            systemImageName: "arrow.left.arrow.right.circle.fill"
        )

        AppShortcut(
            intent: ICharExportIntent(),
            phrases: [
                "Export my i-character",
                "Sovereign export i-character",
                "Export digital twin"
            ],
            shortTitle: "Export i-Character",
            systemImageName: "person.crop.square.filled.and.at.rectangle"
        )

        AppShortcut(
            intent: ForkInitIntent(),
            phrases: [
                "Fork substrate as \(\.$name)",
                "Sovereign fork as \(\.$name)",
                "Init fork \(\.$name)"
            ],
            shortTitle: "Fork Substrate",
            systemImageName: "arrow.triangle.branch"
        )

        AppShortcut(
            intent: SovereignCompositeViewIntent(),
            phrases: [
                "My sovereign composite",
                "Show my composite",
                "Sovereign score",
                "Show my care floor"
            ],
            shortTitle: "Sovereign Composite",
            systemImageName: "gauge.with.needle.fill"
        )
    }
}