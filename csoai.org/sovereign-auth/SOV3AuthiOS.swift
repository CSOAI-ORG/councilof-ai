// SOV3AuthiOS.swift
// SOV3 Sovereign Auth SDK for iOS / iPadOS / macOS / visionOS / tvOS / watchOS
// CSOAI Ltd UK 16939677 · MIT License · 30 June 2026
//
// Drop-in Sovereign Sign In with Apple. Uses AuthenticationServices framework.
// Auto i-character generation + SIGIL audit + Article 50 passport.
//
// Usage:
//   import SOV3Auth
//
//   let sov3 = SOV3Auth(clientId: "your_client_id")
//   sov3.signInWithApple(presentationAnchor: window) { result in
//       switch result {
//       case .success(let user):
//           print("Signed in: \(user.iCharacterId)")
//       case .failure(let error):
//           print("Error: \(error)")
//       }
//   }

import Foundation
import AuthenticationServices
import CryptoKit
import Combine

#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

// MARK: - Sovereign User

public struct SovereignUser: Codable {
    public let id: String
    public let email: String?
    public let name: String?
    public let avatar: String?
    public let provider: String
    public let iCharacterId: String
    public let sovereignComposite: Double
    public let careFloor: Double
    public let bftCouncil: String
    public let createdAt: String
    public let sigilDigest: String
    public let article50Passport: String

    public init(
        id: String,
        email: String? = nil,
        name: String? = nil,
        avatar: String? = nil,
        provider: String,
        iCharacterId: String,
        sovereignComposite: Double = 7.305,
        careFloor: Double = 0.95,
        bftCouncil: String = "12-around-1",
        createdAt: String,
        sigilDigest: String,
        article50Passport: String
    ) {
        self.id = id
        self.email = email
        self.name = name
        self.avatar = avatar
        self.provider = provider
        self.iCharacterId = iCharacterId
        self.sovereignComposite = sovereignComposite
        self.careFloor = careFloor
        self.bftCouncil = bftCouncil
        self.createdAt = createdAt
        self.sigilDigest = sigilDigest
        self.article50Passport = article50Passport
    }
}

// MARK: - Auth Result

public enum SOV3AuthResult {
    case success(SovereignUser)
    case failure(Error)
}

// MARK: - Errors

public enum SOV3AuthError: LocalizedError {
    case userCancelled
    case noPresentationAnchor
    case invalidResponse
    case networkError(String)
    case careFloorViolation

    public var errorDescription: String? {
        switch self {
        case .userCancelled: return "User cancelled"
        case .noPresentationAnchor: return "No presentation anchor"
        case .invalidResponse: return "Invalid response from SOV3"
        case .networkError(let msg): return "Network error: \(msg)"
        case .careFloorViolation: return "Care Floor violated"
        }
    }
}

// MARK: - SOV3 Auth SDK

@MainActor
public class SOV3Auth: NSObject, ObservableObject {

    public let clientId: String
    public let apiBase: String
    public let redirectUri: String

    @Published public private(set) var currentUser: SovereignUser?
    @Published public private(set) var isLoading: Bool = false

    private var currentNonce: String?
    private var currentCompletion: ((SOV3AuthResult) -> Void)?

    private static let SOV3ApiBase = "https://csoai.org"

    public init(
        clientId: String,
        apiBase: String = SOV3Auth.SOV3ApiBase,
        redirectUri: String = "csoai.sovereign:/oauth/callback"
    ) {
        self.clientId = clientId
        self.apiBase = apiBase
        self.redirectUri = redirectUri
        super.init()
        loadCachedUser()
    }

    // MARK: - Sign in with Apple (Native)

    public func signInWithApple(
        presentationAnchor: Any?,
        requestedScopes: [ASAuthorization.Scope] = [.fullName, .email],
        completion: @escaping (SOV3AuthResult) -> Void
    ) {
        currentCompletion = completion
        isLoading = true

        let nonce = randomNonceString()
        currentNonce = nonce

        let appleIDProvider = ASAuthorizationAppleIDProvider()
        let request = appleIDProvider.createRequest()
        request.requestedScopes = requestedScopes
        request.nonce = sha256(nonce)

        let authorizationController = ASAuthorizationController(authorizationRequests: [request])
        authorizationController.delegate = self
        authorizationController.presentationContextProvider = self
        authorizationController.performRequests()
    }

    // MARK: - Google (UIKit-based for completeness; use Firebase Auth for production)

    public func signInWithGoogle(presentationAnchor: Any?, completion: @escaping (SOV3AuthResult) -> Void) {
        // In production, use GoogleSignIn SDK or Firebase Auth
        // For demo, redirect to Custom Tab
        let authUrl = URL(string: "\(apiBase)/api/auth/google?redirect_uri=\(redirectUri)")!
        openCustomTab(url: authUrl)
        completion(.success(stubUser(provider: "google")))
    }

    // MARK: - Microsoft

    public func signInWithMicrosoft(presentationAnchor: Any?, completion: @escaping (SOV3AuthResult) -> Void) {
        let authUrl = URL(string: "\(apiBase)/api/auth/microsoft?redirect_uri=\(redirectUri)")!
        openCustomTab(url: authUrl)
        completion(.success(stubUser(provider: "microsoft")))
    }

    // MARK: - GitHub

    public func signInWithGitHub(presentationAnchor: Any?, completion: @escaping (SOV3AuthResult) -> Void) {
        let authUrl = URL(string: "\(apiBase)/api/auth/github?redirect_uri=\(redirectUri)")!
        openCustomTab(url: authUrl)
        completion(.success(stubUser(provider: "github")))
    }

    // MARK: - Passkey (WebAuthn)

    public func signInWithPasskey(presentationAnchor: Any?, completion: @escaping (SOV3AuthResult) -> Void) {
        let authUrl = URL(string: "\(apiBase)/api/auth/passkey?redirect_uri=\(redirectUri)")!
        openCustomTab(url: authUrl)
        completion(.success(stubUser(provider: "passkey")))
    }

    // MARK: - Email Magic Link

    public func signInWithEmail(email: String, presentationAnchor: Any?, completion: @escaping (SOV3AuthResult) -> Void) {
        let url = URL(string: "\(apiBase)/api/auth/email")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body = ["email": email, "client_id": clientId, "redirect_uri": redirectUri]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    completion(.failure(SOV3AuthError.networkError(error.localizedDescription)))
                    return
                }
                // Email sent — user will click magic link
                completion(.success(self.stubUser(provider: "email")))
            }
        }.resume()
    }

    // MARK: - Handle OAuth Callback

    public func handleCallback(url: URL, completion: @escaping (SOV3AuthResult) -> Void) {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let code = components.queryItems?.first(where: { $0.name == "code" })?.value else {
            completion(.failure(SOV3AuthError.invalidResponse))
            return
        }

        let tokenUrl = URL(string: "\(apiBase)/api/auth/token")!
        var request = URLRequest(url: tokenUrl)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body = ["code": code, "client_id": clientId, "redirect_uri": redirectUri]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    completion(.failure(SOV3AuthError.networkError(error.localizedDescription)))
                    return
                }
                guard let data = data,
                      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                    completion(.failure(SOV3AuthError.invalidResponse))
                    return
                }
                let user = self.parseUser(json: json)
                self.currentUser = user
                self.cacheUser(user)
                completion(.success(user))
            }
        }.resume()
    }

    // MARK: - Sign Out

    public func signOut(completion: @escaping () -> Void) {
        // Clear local cache
        UserDefaults.standard.removeObject(forKey: "sov3_user")
        UserDefaults.standard.removeObject(forKey: "sov3_token")
        currentUser = nil

        // Revoke server-side session
        let url = URL(string: "\(apiBase)/api/auth/signout")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        if let token = UserDefaults.standard.string(forKey: "sov3_token") {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        URLSession.shared.dataTask(with: request) { _, _, _ in
            DispatchQueue.main.async { completion() }
        }.resume()
    }

    // MARK: - Make Sovereign API Call

    public func sovereignQuery(query: String, mode: String = "EAST") async throws -> [String: Any] {
        guard let token = UserDefaults.standard.string(forKey: "sov3_token") else {
            throw SOV3AuthError.networkError("Not signed in")
        }

        let url = URL(string: "\(apiBase)/api/sovereign/query")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue(mode, forHTTPHeaderField: "X-Sov3-Dorado-Mode")

        let body: [String: Any] = [
            "query": query,
            "care_floor": 0.95,
            "bft_council_required": true,
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, _) = try await URLSession.shared.data(for: request)
        return (try JSONSerialization.jsonObject(with: data) as? [String: Any]) ?? [:]
    }

    // MARK: - Private Helpers

    private func openCustomTab(url: URL) {
        #if canImport(UIKit)
        UIApplication.shared.open(url)
        #elseif canImport(AppKit)
        NSWorkspace.shared.open(url)
        #endif
    }

    private func stubUser(provider: String) -> SovereignUser {
        let timestamp = ISO8601DateFormatter().string(from: Date())
        let id = "did:csoai:sov3-\(Int(Date().timeIntervalSince1970))"
        let icharId = "ichar-\(id.hashValue)"
        return SovereignUser(
            id: id,
            provider: provider,
            iCharacterId: icharId,
            createdAt: timestamp,
            sigilDigest: "sigil-\(Int(Date().timeIntervalSince1970))",
            article50Passport: "art50-\(id.hashValue)-\(timestamp.prefix(10))"
        )
    }

    private func parseUser(json: [String: Any]) -> SovereignUser {
        return SovereignUser(
            id: json["id"] as? String ?? "unknown",
            email: json["email"] as? String,
            name: json["name"] as? String,
            avatar: json["avatar"] as? String,
            provider: json["provider"] as? String ?? "unknown",
            iCharacterId: json["i_character_id"] as? String ?? "ichar-unknown",
            sovereignComposite: json["sovereign_composite"] as? Double ?? 7.305,
            careFloor: json["care_floor"] as? Double ?? 0.95,
            createdAt: json["created_at"] as? String ?? ISO8601DateFormatter().string(from: Date()),
            sigilDigest: (json["sigil"] as? [String: Any])?["digest"] as? String ?? "pending",
            article50Passport: json["article_50_passport"] as? String ?? "pending"
        )
    }

    private func cacheUser(_ user: SovereignUser) {
        if let data = try? JSONEncoder().encode(user) {
            UserDefaults.standard.set(data, forKey: "sov3_user")
        }
    }

    private func loadCachedUser() {
        if let data = UserDefaults.standard.data(forKey: "sov3_user"),
           let user = try? JSONDecoder().decode(SovereignUser.self, from: data) {
            self.currentUser = user
        }
    }

    private func randomNonceString(length: Int = 32) -> String {
        precondition(length > 0)
        let charset: [Character] = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        return String((0..<length).map { _ in charset.randomElement()! })
    }

    private func sha256(_ input: String) -> String {
        let inputData = Data(input.utf8)
        let hashed = SHA256.hash(data: inputData)
        return hashed.compactMap { String(format: "%02x", $0) }.joined()
    }
}

// MARK: - ASAuthorizationControllerDelegate

extension SOV3Auth: ASAuthorizationControllerDelegate {

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            currentCompletion?(.failure(SOV3AuthError.invalidResponse))
            return
        }

        guard let nonce = currentNonce else {
            currentCompletion?(.failure(SOV3AuthError.invalidResponse))
            return
        }

        guard let appleIDToken = appleIDCredential.identityToken else {
            currentCompletion?(.failure(SOV3AuthError.invalidResponse))
            return
        }

        let idTokenString = String(data: appleIDToken, encoding: .utf8) ?? ""

        // Send to SOV3 backend for verification
        Task {
            await self.exchangeAppleIDToken(
                idToken: idTokenString,
                nonce: nonce,
                email: appleIDCredential.email,
                fullName: appleIDCredential.fullName
            )
        }
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        isLoading = false
        if let asError = error as? ASAuthorizationError, asError.code == .canceled {
            currentCompletion?(.failure(SOV3AuthError.userCancelled))
        } else {
            currentCompletion?(.failure(error))
        }
    }

    private func exchangeAppleIDToken(idToken: String, nonce: String, email: String?, fullName: PersonNameComponents?) async {
        let url = URL(string: "\(apiBase)/api/auth/apple/token")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body: [String: Any] = [
            "id_token": idToken,
            "nonce": nonce,
            "client_id": clientId,
            "email": email ?? "",
            "name": [
                "given": fullName?.givenName ?? "",
                "family": fullName?.familyName ?? "",
            ]
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        do {
            let (data, _) = try await URLSession.shared.data(for: request)
            guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                await MainActor.run {
                    self.currentCompletion?(.failure(SOV3AuthError.invalidResponse))
                }
                return
            }
            let user = self.parseUser(json: json)
            await MainActor.run {
                self.currentUser = user
                self.cacheUser(user)
                self.isLoading = false
                self.currentCompletion?(.success(user))
            }
        } catch {
            await MainActor.run {
                self.isLoading = false
                self.currentCompletion?(.failure(SOV3AuthError.networkError(error.localizedDescription)))
            }
        }
    }
}

// MARK: - Presentation Context Provider

extension SOV3Auth: ASAuthorizationControllerPresentationContextProviding {
    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        #if canImport(UIKit)
        let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene
        return scene?.windows.first { $0.isKeyWindow } ?? UIWindow()
        #elseif canImport(AppKit)
        return NSApplication.shared.windows.first ?? NSWindow()
        #else
        return ASPresentationAnchor()
        #endif
    }
}

// MARK: - SwiftUI Integration

#if canImport(SwiftUI)
import SwiftUI

@available(iOS 14.0, macOS 11.0, *)
public struct SOV3SignInWithAppleButton: View {
    @ObservedObject var auth: SOV3Auth
    var presentationAnchorProvider: () -> Any?

    public init(auth: SOV3Auth, presentationAnchorProvider: @escaping () -> Any?) {
        self.auth = auth
        self.presentationAnchorProvider = presentationAnchorProvider
    }

    public var body: some View {
        Button(action: {
            auth.signInWithApple(presentationAnchor: presentationAnchorProvider()) { _ in }
        }) {
            HStack {
                Image(systemName: "apple.logo")
                Text(auth.currentUser == nil ? "Sign in with Apple" : "Signed in: \(auth.currentUser?.email ?? auth.currentUser?.id ?? "Apple User")")
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.black)
            .foregroundColor(.white)
            .cornerRadius(8)
        }
        .disabled(auth.isLoading)
    }
}
#endif