// SOV3SovereignApp.swift
// Sovereign AI integration for iOS
// CSOAI Ltd UK 16939677
// MIT License
//
// Build: Swift package with iOS 18+ deployment target
// Apple frameworks: AppIntents, FoundationModels, SwiftUI

import AppIntents
import Foundation
import SwiftUI

// MARK: - Sovereign Query Intent

struct SovereignQueryIntent: AppIntent {
    static var title: LocalizedStringResource = "Sovereign Query"
    static var description = IntentDescription(
        "Ask the CSOAI sovereign AI substrate. Public. Auditable. Sovereign."
    )
    static var openAppWhenRun: Bool = false
    
    @Parameter(title: "Question", description: "What sovereign question would you like to ask?")
    var question: String
    
    @Parameter(title: "Mode", default: .east)
    var mode: SovereignModeAppEnum
    
    static var parameterSummary: some ParameterSummary {
        Summary("Sovereign query (\(.$mode)): \(.$question)")
    }
    
    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog & ReturnsValue<String> {
        let url = URL(string: "https://csoai.org/api/sovereign/query")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("sov3-sovereign-1.0", forHTTPHeaderField: "User-Agent")
        request.setValue("ios-app-intents", forHTTPHeaderField: "X-Sov3-Channel")
        request.setValue(mode.rawValue, forHTTPHeaderField: "X-Sov3-Dorado-Mode")
        
        let body: [String: Any] = [
            "query": question,
            "sovereign_composite_required": true,
            "care_floor": 0.95,
            "bft_council_required": true,
            "audit_chain": "SIGIL Ed25519 + PQC ML-DSA-65",
            "crown_lineage": "1795-2026",
            "license": "MIT"
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            return .result(value: "", dialog: "Sovereign substrate unavailable. Care Floor enforced.")
        }
        
        let result = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        let answer = result["response"] as! String
        let sigil = result["sigil_digest"] as! String
        let composite = result["sovereign_composite"] as! Double
        let passport = result["article_50_passport"] as? String ?? "pending"
        
        let summary = "Sovereign (composite \(composite), SIGIL \(sigil.prefix(16))…): \(answer)"
        
        return .result(
            value: summary,
            dialog: IntentDialog(stringLiteral: summary)
        )
    }
}

enum SovereignModeAppEnum: String, AppEnum {
    case east = "EAST"
    case west = "WEST"
    case neutral = "NEUTRAL"
    
    static var typeDisplayRepresentation: TypeDisplayRepresentation = "DORADO Mode"
    static var caseDisplayRepresentations: [SovereignModeAppEnum: DisplayRepresentation] = [
        .east: "EAST (UK/Five Eyes/AUKUS)",
        .west: "WEST (BRICS/ASEAN/Commonwealth)",
        .neutral: "NEUTRAL"
    ]
}

// MARK: - BFT Council Vote Intent

struct BFTCouncilVoteIntent: AppIntent {
    static var title: LocalizedStringResource = "BFT Council Vote"
    static var description = IntentDescription("Call a 12-around-1 BFT Council vote on a sovereign action")
    static var openAppWhenRun: Bool = false
    
    @Parameter(title: "Proposal", description: "What action should the BFT Council vote on?")
    var proposal: String
    
    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog & ReturnsValue<String> {
        let url = URL(string: "https://csoai.org/api/bft/vote")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "proposal": proposal,
            "council_size": 12,
            "majority_required": "2/3",
            "care_floor": 0.95
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        let result = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        let voteId = result["vote_id"] as! String
        let tally = result["tally"] as! [String: Int]
        let forCount = tally["for"] ?? 0
        let againstCount = tally["against"] ?? 0
        let abstainCount = tally["abstain"] ?? 0
        let decision = result["decision"] as! String
        
        let summary = "BFT vote \(voteId): for \(forCount), against \(againstCount), abstain \(abstainCount). Decision: \(decision)"
        
        return .result(value: summary, dialog: IntentDialog(stringLiteral: summary))
    }
}

// MARK: - Article 50 Passport Intent

struct Article50PassportIntent: AppIntent {
    static var title: LocalizedStringResource = "Article 50 Passport"
    static var description = IntentDescription("Issue an Article 50 sovereign passport for content")
    static var openAppWhenRun: Bool = false
    
    @Parameter(title: "Content hash", description: "SHA-256 of content")
    var contentHash: String
    
    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog & ReturnsValue<String> {
        let url = URL(string: "https://csoai.org/api/article50/issue")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "content_hash": contentHash,
            "content_type": "text",
            "interaction_type": "chatbot",
            "watermarked": true
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        let result = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        let passportId = result["passport_id"] as! String
        let verifyUrl = result["verify_url"] as! String
        
        let summary = "Article 50 passport issued: \(passportId). Verify at \(verifyUrl)"
        
        return .result(value: summary, dialog: IntentDialog(stringLiteral: summary))
    }
}

// MARK: - App Shortcuts Provider

struct SOV3AppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
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
                "Council vote on \(\.$proposal)"
            ],
            shortTitle: "BFT Council Vote",
            systemImageName: "person.3.sequence"
        )
        AppShortcut(
            intent: Article50PassportIntent(),
            phrases: [
                "Article 50 passport for \(\.$contentHash)"
            ],
            shortTitle: "Article 50 Passport",
            systemImageName: "checkmark.seal"
        )
    }
}

// MARK: - SwiftUI App

@main
struct SOV3SovereignApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

struct ContentView: View {
    @State private var query: String = ""
    @State private var response: String = ""
    @State private var isLoading: Bool = false
    
    var body: some View {
        VStack(spacing: 20) {
            Text("🜏 SOV3 Sovereign")
                .font(.largeTitle)
                .fontWeight(.bold)
                .foregroundStyle(.linearGradient(colors: [.yellow, .cyan], startPoint: .leading, endPoint: .trailing))
            
            Text("CSOAI Ltd UK 16939677")
                .font(.caption)
                .foregroundColor(.secondary)
            
            TextField("Ask the sovereign substrate…", text: $query)
                .textFieldStyle(.roundedBorder)
                .padding()
            
            Button("Ask Sovereign") {
                Task { await askSovereign() }
            }
            .buttonStyle(.borderedProminent)
            .disabled(query.isEmpty || isLoading)
            
            if isLoading {
                ProgressView()
            }
            
            if !response.isEmpty {
                ScrollView {
                    Text(response)
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            
            Spacer()
        }
        .padding()
    }
    
    func askSovereign() async {
        isLoading = true
        defer { isLoading = false }
        
        let url = URL(string: "https://csoai.org/api/sovereign/query")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "query": query,
            "care_floor": 0.95
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        if let (data, _) = try? await URLSession.shared.data(for: request),
           let result = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let answer = result["response"] as? String {
            response = answer
        }
    }
}
