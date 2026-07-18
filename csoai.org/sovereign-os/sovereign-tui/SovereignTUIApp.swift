// SovereignTUIApp.swift
// The sovereign hotkey daemon - Cmd+Shift+S from anywhere
// CSOAI Ltd UK 16939677 · MIT License · 1 July 2026
//
// macOS-native SwiftUI app that lives in the menu bar.
// Press Cmd+Shift+S → opens Sovereign TUI overlay.
// Cycles: inside → outside → PiP → hidden.

import SwiftUI
import AppKit
import Combine
import OSLog

// MARK: - Hotkey constants
let SOVEREIGN_HOTKEY = "⇧⌘S"  // Cmd+Shift+S
let SOVEREIGN_GLYPH = "🜏"

let log = Logger(subsystem: "org.csoai.sovereign", category: "tui")

// MARK: - App entry
@main
struct SovereignTUIApp: App {
    @NSApplicationDelegateAdaptor(SovereignAppDelegate.self) var appDelegate

    var body: some Scene {
        Settings {
            EmptyView()
        }
    }
}

// MARK: - App delegate
final class SovereignAppDelegate: NSObject, NSApplicationDelegate {
    private var statusItem: NSStatusItem?
    private var tuiWindow: SovereignTUIWindow?
    private var biometricGate: BiometricGate?
    private var mode: TUIMode = .hidden
    private var hotKeyRef: EventHotKeyRef?

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        installMenuBar()
        registerGlobalHotKey()
        biometricGate = BiometricGate()
        log.info("Sovereign TUI daemon installed. Hotkey: \(SOVEREIGN_HOTKEY)")
    }

    private func installMenuBar() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        if let button = statusItem?.button {
            button.image = NSImage(systemSymbolName: "shield.lefthalf.filled", accessibilityDescription: "Sovereign")
            button.imagePosition = .imageLeft
            button.title = SOVEREIGN_GLYPH
        }
        let menu = NSMenu()
        menu.addItem(withTitle: "Open Sovereign TUI (⇧⌘S)", action: #selector(toggleTUI), keyEquivalent: "s").keyEquivalentModifierMask = [.command, .shift]
        menu.addItem(.separator())
        menu.addItem(withTitle: "Authority: GUEST", action: nil, keyEquivalent: "")
        menu.addItem(withTitle: "Enroll Biometrics…", action: #selector(enrollBiometrics), keyEquivalent: "")
        menu.addItem(.separator())
        menu.addItem(withTitle: "Quit Sovereign Daemon", action: #selector(quit), keyEquivalent: "q")
        statusItem?.menu = menu
    }

    private func registerGlobalHotKey() {
        let hotKeyID = EventHotKeyID(signature: OSType(0x53565247), id: 1)  // 'SVRG'
        var eventType = EventTypeSpec(eventClass: OSType(kEventClassKeyboard), eventKind: UInt32(kEventHotKeyPressed))
        let modifiers: UInt32 = UInt32(cmdKey | shiftKey)
        let keyCode: UInt32 = 1  // 'S' key
        InstallEventHandler(GetApplicationEventTarget(), nil, 0, nil, nil, nil)
        let status = RegisterEventHotKey(keyCode, modifiers, hotKeyID, GetApplicationEventTarget(), 0, &hotKeyRef)
        if status != noErr {
            log.error("Failed to register hotkey: \(status)")
        }
    }

    @objc private func toggleTUI() {
        Task {
            let result = await biometricGate?.gate()
            log.info("Biometric gate result: \(result?.authority ?? "unknown")")
            await MainActor.run {
                self.cycleMode(result?.authority ?? .guest)
            }
        }
    }

    @objc private func enrollBiometrics() {
        Task {
            _ = await biometricGate?.enroll()
            log.info("Biometric enrollment complete")
        }
    }

    @objc private func quit() {
        NSApp.terminate(nil)
    }

    private func cycleMode(_ authority: AuthorityLevel) {
        switch mode {
        case .hidden:
            mode = .inside
            showWindow(authority)
        case .inside:
            mode = .outside
            tuiWindow?.toggleFullscreen()
        case .outside:
            mode = .pictureInPicture
            tuiWindow?.setPictureInPicture()
        case .pictureInPicture:
            mode = .hidden
            tuiWindow?.close()
            tuiWindow = nil
        }
        statusItem?.menu?.items.first?.title = "Sovereign TUI: \(mode.description)"
    }

    private func showWindow(_ authority: AuthorityLevel) {
        if tuiWindow == nil {
            let frame = NSRect(x: 100, y: 100, width: 480, height: 720)
            tuiWindow = SovereignTUIWindow(frame: frame, authority: authority)
        }
        tuiWindow?.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }
}

// MARK: - Mode
enum TUIMode: String {
    case hidden, inside, outside, pictureInPicture
    var description: String { rawValue }
}

enum AuthorityLevel: String {
    case guest = "GUEST"
    case citizen = "CITIZEN"
    case sovereignCitizen = "SOVEREIGN_CITIZEN"

    var iconColor: String {
        switch self {
        case .guest: return "gray"
        case .citizen: return "yellow"
        case .sovereignCitizen: return "gold"
        }
    }
}

// MARK: - Sovereign TUI Window
final class SovereignTUIWindow: NSWindow {
    private let authority: AuthorityLevel

    init(frame: NSRect, authority: AuthorityLevel) {
        self.authority = authority
        super.init(
            contentRect: frame,
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        self.title = "Sovereign \(SOVEREIGN_GLYPH)"
        self.level = .floating
        self.isMovableByWindowBackground = true
        self.collectionBehavior = [.canJoinAllSpaces]
        self.contentView = NSHostingView(rootView: SovereignTUIView(authority: authority))
    }

    func toggleFullscreen() {
        self.toggleFullScreen(nil)
    }

    func setPictureInPicture() {
        let frame = NSRect(x: NSScreen.main?.frame.maxX ?? 1500 - 320, y: 40, width: 320, height: 200)
        self.setFrame(frame, display: true, animate: true)
        self.level = .normal
        self.titlebarAppearsTransparent = true
    }
}

// MARK: - TUI View
struct SovereignTUIView: View {
    let authority: AuthorityLevel
    @State private var input: String = ""
    @State private var messages: [ChatMsg] = []
    @State private var careFloor: Double = 0.95
    @State private var bftPass: Double = 0.83
    @State private var composite: Double = 7.305

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text(SOVEREIGN_GLYPH).font(.title)
                VStack(alignment: .leading) {
                    Text("Sovereign TUI").font(.headline).bold()
                    Text("Authority: \(authority.rawValue)").font(.caption).foregroundColor(authority == .sovereignCitizen ? .yellow : .gray)
                }
                Spacer()
                Text("v2.0").font(.caption).foregroundColor(.secondary)
            }
            .padding()
            .background(Color.black.opacity(0.4))

            // Sovereign composite dashboard
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("Care Floor")
                    ProgressView(value: careFloor).tint(.green)
                    Text(String(format: "%.2f", careFloor)).font(.caption.monospaced())
                }
                HStack {
                    Text("BFT Pass")
                    ProgressView(value: bftPass).tint(.yellow)
                    Text(String(format: "%.2f", bftPass)).font(.caption.monospaced())
                }
                HStack {
                    Text("Composite")
                    ProgressView(value: composite / 10).tint(.orange)
                    Text(String(format: "%.3f", composite)).font(.caption.monospaced())
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)

            Divider()

            // Chat log
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 6) {
                    ForEach(messages) { msg in
                        HStack(alignment: .top) {
                            Text(msg.role == .user ? "🧑" : SOVEREIGN_GLYPH).font(.caption)
                            Text(msg.text).font(.caption).foregroundColor(msg.role == .user ? .cyan : .yellow)
                        }
                        .padding(.horizontal)
                    }
                }
            }
            .frame(maxHeight: .infinity)

            Divider()

            // Input
            HStack {
                TextField("ask the sovereign…", text: $input)
                    .textFieldStyle(.plain)
                    .padding(8)
                    .background(Color.black.opacity(0.3))
                    .cornerRadius(6)
                Button("↑") { send() }
                    .keyboardShortcut(.return, modifiers: [])
            }
            .padding()
        }
        .background(LinearGradient(colors: [.black, Color(red: 0.05, green: 0.1, blue: 0.3)], startPoint: .top, endPoint: .bottom))
        .foregroundColor(.white)
    }

    private func send() {
        guard !input.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        let text = input
        messages.append(ChatMsg(role: .user, text: text))
        input = ""
        // Placeholder response — in real impl, calls sovereignEventBus.utter() over WebSocket
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
            messages.append(ChatMsg(role: .sovereign, text: "I see you. Care Floor 0.95. BFT 12-around-1. Composite 7.305.\nSIGIL emitted."))
        }
    }
}

struct ChatMsg: Identifiable {
    enum Role { case user, sovereign }
    let id = UUID()
    let role: Role
    let text: String
}

// MARK: - Biometric Gate (placeholder)
actor BiometricGate {
    func gate() -> (authority: AuthorityLevel, ...) async {
        // Real impl: LocalAuthentication + AVFoundation + WebAuthn bridge
        return (authority: .sovereignCitizen)
    }
    func enroll() async -> Bool { return true }
}
