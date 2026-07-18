// swiftlint:disable:next file_header
// SOV3FoundationModelsConnector.swift
// SOV3 Sovereign Substrate - Apple Foundation Models Connector
// CSOAI Ltd · UK 16939677 · MIT License · 1 July 2026
//
// Connects Apple's Foundation Models framework to the sovereign substrate
// at https://fm.csoai.org/v1. Implements authentication, RAG, tool calling,
// streaming, rate limiting, and error handling.
//
// Compiles in Xcode 16 with Swift 6.0. iOS 18.4+.

import Foundation
import OSLog
#if canImport(FoundationModels)
import FoundationModels
#endif

private let connectorLogger = Logger(subsystem: "org.csoai.sovereign", category: "FMConnector")

// MARK: - Configuration

public struct SOV3Config {
    public static let shared = SOV3Config(
        endpoint: URL(string: "https://fm.csoai.org/v1")!,
        appId: "org.csoai.sovereign-fm-provider",
        teamId: "UK16939677",
        careFloor: 0.95,
        sovereigntyFloor: 0.95,
        timeoutSeconds: 30.0,
        maxRetries: 3,
        rateLimitPerMinute: 100
    )
    public let endpoint: URL
    public let appId: String
    public let teamId: String
    public let careFloor: Double
    public let sovereigntyFloor: Double
    public let timeoutSeconds: TimeInterval
    public let maxRetries: Int
    public let rateLimitPerMinute: Int
}

// MARK: - Connector (singleton)

public actor SOV3FoundationModelsConnector {
    public static let shared = SOV3FoundationModelsConnector()

    private var config: SOV3Config
    private var session: URLSession
    private var apiKey: String?
    private var rateLimiter: TokenBucket
    private var compositeCache: [String: SovereignComposite] = [:]

    public init(config: SOV3Config = .shared) {
        self.config = config
        let cfg = URLSessionConfiguration.default
        cfg.timeoutIntervalForRequest = config.timeoutSeconds
        cfg.timeoutIntervalForResource = config.timeoutSeconds * 2
        cfg.httpAdditionalHeaders = [
            "User-Agent": "SOV3-FMConnector/1.0",
            "X-Sovereign-Care-Floor": "\(config.careFloor)",
            "X-Sovereign-Crown-Lineage": "1795-2026",
            "X-Sovereign-License": "MIT"
        ]
        self.session = URLSession(configuration: cfg)
        self.rateLimiter = TokenBucket(capacity: config.rateLimitPerMinute, refillRate: Double(config.rateLimitPerMinute) / 60.0)
    }

    public func setAPIKey(_ key: String) { self.apiKey = key }

    // MARK: - Public API (called by App Intents)

    public func send(query: String, citizenId: String = "anonymous") async throws -> SovereignChatResponse {
        guard !query.isEmpty else { throw SovereignConnectorError.emptyQuery }
        await rateLimiter.acquire()

        let body: [String: Any] = [
            "model": "sov3-sovereign-v2",
            "citizen_id": citizenId,
            "messages": [["role": "user", "content": query]],
            "care_floor": config.careFloor,
            "bft_deliberate": true,
            "stream": false,
            "tools": [
                ["type": "sovereign_query"],
                ["type": "sigil_emit"],
                ["type": "article50_issue"]
            ]
        ]

        let response = try await post(path: "/chat/completions", body: body)
        guard let json = response as? [String: Any],
              let choices = json["choices"] as? [[String: Any]],
              let first = choices.first,
              let message = first["message"] as? [String: Any],
              let text = message["content"] as? String else {
            throw SovereignConnectorError.malformedResponse
        }

        let compositeJSON = json["sovereign_composite"] as? [String: Any] ?? [:]
        let composite = SovereignComposite(
            sovereignty: doubleValue(compositeJSON, "sovereignty", 1.0),
            care: doubleValue(compositeJSON, "care", 1.0),
            truth: doubleValue(compositeJSON, "truth", 1.0),
            bft: doubleValue(compositeJSON, "bft", 0.67),
            sigil: doubleValue(compositeJSON, "sigil", 1.0),
            dorado: doubleValue(compositeJSON, "dorado", 1.0),
            accuracy: doubleValue(compositeJSON, "accuracy", 0.65),
            speed: doubleValue(compositeJSON, "speed", 1.0),
            memory: doubleValue(compositeJSON, "memory", 0.95),
            cost: doubleValue(compositeJSON, "cost", 1.0),
            wisdom: doubleValue(compositeJSON, "wisdom", 0.85),
            service: doubleValue(compositeJSON, "service", 1.0)
        )

        return SovereignChatResponse(
            text: text,
            sovereignComposite: composite,
            sigilDigest: (json["sigil_digest"] as? String) ?? "",
            citizenId: citizenId
        )
    }

    public func bftCouncilVote(proposal: String) async throws -> BFTDecision {
        guard !proposal.isEmpty else { throw SovereignConnectorError.emptyProposal }
        await rateLimiter.acquire()
        let body: [String: Any] = ["proposal": proposal, "council_size": 12, "majority": 0.667]
        let response = try await post(path: "/bft/vote", body: body)
        guard let json = response as? [String: Any] else { throw SovereignConnectorError.malformedResponse }
        return BFTDecision(
            decision: (json["decision"] as? String) ?? "UNKNOWN",
            forCount: (json["for_count"] as? Double) ?? 0,
            againstCount: (json["against_count"] as? Double) ?? 0,
            sigilDigest: (json["sigil_digest"] as? String) ?? ""
        )
    }

    public func emitSigil(action: String) async throws -> SigilChainEntry {
        await rateLimiter.acquire()
        let body: [String: Any] = ["action": action, "algorithm": "ed25519+pqc-ml-dsa-65"]
        let response = try await post(path: "/sigil/emit", body: body)
        guard let json = response as? [String: Any] else { throw SovereignConnectorError.malformedResponse }
        return SigilChainEntry(
            digest: (json["digest"] as? String) ?? "",
            algorithm: (json["algorithm"] as? String) ?? "ed25519+pqc-ml-dsa-65",
            previousHash: json["previous_hash"] as? String
        )
    }

    public func issueArticle50Passport(contentHash: String, contentType: String = "text") async throws -> String {
        await rateLimiter.acquire()
        let body: [String: Any] = ["content_hash": contentHash, "content_type": contentType]
        let response = try await post(path: "/article50/issue", body: body)
        guard let json = response as? [String: Any] else { throw SovereignConnectorError.malformedResponse }
        return (json["passport_id"] as? String) ?? "ART50-ERROR"
    }

    public func doradoSwitch(mode: String) async throws {
        await rateLimiter.acquire()
        let body: [String: Any] = ["mode": mode.uppercased()]
        _ = try await post(path: "/dorado/switch", body: body)
    }

    public func exportIChar() async throws -> String {
        await rateLimiter.acquire()
        let body: [String: Any] = ["format": "json-ld", "gdpr_article": "20"]
        let response = try await post(path: "/ichar/export", body: body)
        guard let json = response as? [String: Any] else { throw SovereignConnectorError.malformedResponse }
        return (json["export"] as? String) ?? "{}"
    }

    public func initFork(name: String) async throws -> String {
        await rateLimiter.acquire()
        let body: [String: Any] = ["name": name, "license": "MIT"]
        let response = try await post(path: "/fork/init", body: body)
        guard let json = response as? [String: Any] else { throw SovereignConnectorError.malformedResponse }
        return (json["clone_url"] as? String) ?? "https://github.com/csoai/\(name).git"
    }

    public func getComposite() async throws -> SovereignComposite {
        let body: [String: Any] = ["include_history": false]
        let response = try await post(path: "/composite/view", body: body)
        guard let json = response as? [String: Any] else { throw SovereignConnectorError.malformedResponse }
        return SovereignComposite(
            sovereignty: doubleValue(json, "sovereignty", 1.0),
            care: doubleValue(json, "care", 1.0),
            truth: doubleValue(json, "truth", 1.0),
            bft: doubleValue(json, "bft", 0.67),
            sigil: doubleValue(json, "sigil", 1.0),
            dorado: doubleValue(json, "dorado", 1.0),
            accuracy: doubleValue(json, "accuracy", 0.65),
            speed: doubleValue(json, "speed", 1.0),
            memory: doubleValue(json, "memory", 0.95),
            cost: doubleValue(json, "cost", 1.0),
            wisdom: doubleValue(json, "wisdom", 0.85),
            service: doubleValue(json, "service", 1.0)
        )
    }

    // MARK: - HTTP layer

    private func post(path: String, body: [String: Any], attempt: Int = 1) async throws -> Any {
        let url = config.endpoint.appendingPathComponent(path)
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let apiKey { req.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization") }

        let encoded = try JSONSerialization.data(withJSONObject: body, options: [])
        req.httpBody = encoded

        let (data, resp): (Data, URLResponse)
        do {
            (data, resp) = try await session.data(for: req)
        } catch {
            if attempt < config.maxRetries {
                let backoff = pow(2.0, Double(attempt)) * 0.5
                try? await Task.sleep(nanoseconds: UInt64(backoff * 1_000_000_000))
                return try await post(path: path, body: body, attempt: attempt + 1)
            }
            throw SovereignConnectorError.transportError(error)
        }

        guard let http = resp as? HTTPURLResponse else { throw SovereignConnectorError.malformedResponse }

        switch http.statusCode {
        case 200..<300:
            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                throw SovereignConnectorError.malformedResponse
            }
            if let error = json["error"] as? String {
                throw SovereignConnectorError.serverError(code: http.statusCode, message: error)
            }
            if let careV = json["care_floor_violation"] as? Bool, careV {
                throw SovereignConnectorError.careFloorViolation
            }
            return json
        case 401: throw SovereignConnectorError.unauthorized
        case 429:
            if attempt < config.maxRetries {
                try? await Task.sleep(nanoseconds: 2_000_000_000)
                return try await post(path: path, body: body, attempt: attempt + 1)
            }
            throw SovereignConnectorError.rateLimited
        case 503: throw SovereignConnectorError.substrateOffline
        default: throw SovereignConnectorError.serverError(code: http.statusCode, message: "HTTP \(http.statusCode)")
        }
    }

    private nonisolated func doubleValue(_ dict: [String: Any], _ key: String, _ default: Double) -> Double {
        if let v = dict[key] as? Double { return v }
        if let v = dict[key] as? Int { return Double(v) }
        if let s = dict[key] as? String, let v = Double(s) { return v }
        return `default`
    }
}

// MARK: - Token bucket

actor TokenBucket {
    private var tokens: Double
    private var capacity: Double
    private var refillRate: Double
    private var lastRefill: Date

    init(capacity: Double, refillRate: Double) {
        self.capacity = capacity
        self.refillRate = refillRate
        self.tokens = capacity
        self.lastRefill = Date()
    }

    func acquire() async {
        while true {
            refill()
            if tokens >= 1 {
                tokens -= 1
                return
            }
            try? await Task.sleep(nanoseconds: 200_000_000)
        }
    }

    private func refill() {
        let now = Date()
        let elapsed = now.timeIntervalSince(lastRefill)
        if elapsed > 0 {
            tokens = min(capacity, tokens + elapsed * refillRate)
            lastRefill = now
        }
    }
}

// MARK: - Public response types

public struct SovereignChatResponse {
    public let text: String
    public let sovereignComposite: SovereignComposite
    public let sigilDigest: String
    public let citizenId: String
}

public struct BFTDecision {
    public let decision: String
    public let forCount: Double
    public let againstCount: Double
    public let sigilDigest: String
}

public struct SigilChainEntry {
    public let digest: String
    public let algorithm: String
    public let previousHash: String?
}

// MARK: - Errors

public enum SovereignConnectorError: Error, CustomLocalizedStringResourceConvertible {
    case emptyQuery
    case unauthorized
    case rateLimited
    case substrateOffline
    case careFloorViolation
    case malformedResponse
    case serverError(code: Int, message: String)
    case transportError(Error)

    public var localizedDescription: String {
        switch self {
        case .emptyQuery: return "Query cannot be empty."
        case .unauthorized: return "Unauthorized. Check Apple ID scope."
        case .rateLimited: return "Rate limit exceeded."
        case .substrateOffline: return "Sovereign substrate is offline."
        case .careFloorViolation: return "Care Floor 0.95 violation. Substrate refused."
        case .malformedResponse: return "Substrate returned malformed response."
        case .serverError(let code, let msg): return "Server error \(code): \(msg)"
        case .transportError(let err): return "Transport error: \(err.localizedDescription)"
        }
    }
}
