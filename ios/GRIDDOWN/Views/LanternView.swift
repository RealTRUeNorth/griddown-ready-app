import SwiftUI
import UIKit

/// Emergency lantern: rear LED torch with steady and Morse-SOS modes, and an
/// automatic screen-light fallback (with brightness pinned to maximum) for
/// devices without a torch.
struct LanternView: View {
    enum LanternMode: String, CaseIterable {
        case off, steady, sos
    }

    @State private var torch = TorchService()
    @State private var mode: LanternMode = .off
    @State private var isScreenLit = false
    @State private var brightness: Double = 0.5
    @State private var originalBrightness: CGFloat = 0.5
    @Environment(\.dismiss) private var dismiss

    private var usesTorch: Bool { torch.isAvailable }

    var body: some View {
        VStack(spacing: 24) {
            if !usesTorch {
                Label("No torch on this device — using screen light", systemImage: "info.circle")
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.textMuted)
                    .padding(.top, 8)
            }

            lightStage
                .frame(maxWidth: .infinity)
                .frame(height: 220)
                .clipShape(.rect(cornerRadius: 16))
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.border, lineWidth: 1))

            Picker("Mode", selection: $mode) {
                ForEach(LanternMode.allCases, id: \.self) { m in
                    Text(m == .off ? "OFF" : (m == .steady ? "STEADY" : "SOS")).tag(m)
                }
            }
            .pickerStyle(.segmented)
            .tint(Theme.olive)

            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 8) {
                    Image(systemName: "sun.max.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.amberLight)
                    Text("Screen Brightness")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(Theme.textPrimary)
                    Spacer()
                    Text("\(Int(brightness * 100))%")
                        .font(.system(size: 12, weight: .semibold, design: .monospaced))
                        .foregroundStyle(Theme.textSecondary)
                }
                Slider(value: $brightness, in: 0.1...1)
                    .tint(Theme.amber)
                    .onChange(of: brightness) { _, newValue in
                        UIScreen.main.brightness = CGFloat(newValue)
                    }
                Text("Turn the screen all the way up before dark so you're not fumbling with settings later.")
                    .font(.system(size: 11))
                    .foregroundStyle(Theme.textMuted)
            }
            .padding(16)
            .background(Theme.bgCard)
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
            .clipShape(.rect(cornerRadius: 12))

            Spacer()
        }
        .padding(16)
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("Lantern")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            originalBrightness = UIScreen.main.brightness
            brightness = Double(max(UIScreen.main.brightness, 0.5))
            if !usesTorch { mode = .steady }
        }
        .onDisappear {
            torch.setTorch(false)
            torch.stopSos()
            isScreenLit = false
            UIScreen.main.brightness = originalBrightness
            UIApplication.shared.isIdleTimerDisabled = false
        }
        .task(id: mode) {
            apply(mode: mode)
        }
    }

    @ViewBuilder
    private var lightStage: some View {
        let lit = usesTorch ? torch.isTorchOn || torch.isSosOn : isScreenLit
        ZStack {
            (lit ? Color.yellow.opacity(0.9) : Theme.bgElevated)
            Image(systemName: lit ? "flashlight.on.fill" : "flashlight.off.fill")
                .font(.system(size: 56))
                .foregroundStyle(lit ? .black.opacity(0.6) : Theme.textMuted)
        }
        .animation(.easeInOut(duration: 0.08), value: lit)
    }

    private func apply(mode: LanternMode) {
        UIApplication.shared.isIdleTimerDisabled = mode != .off
        torch.setTorch(false)
        torch.stopSos()
        isScreenLit = false
        switch mode {
        case .off:
            break
        case .steady:
            if usesTorch {
                torch.setTorch(true)
            } else {
                isScreenLit = true
            }
        case .sos:
            if usesTorch {
                torch.startSos()
            } else {
                strobeScreen()
            }
        }
    }

    /// Screen fallback for SOS: alternate full-white flashes.
    private func strobeScreen() {
        Task { @MainActor in
            while mode == .sos && !usesTorch {
                isScreenLit = true
                try? await Task.sleep(for: .milliseconds(250))
                guard mode == .sos else { return }
                isScreenLit = false
                try? await Task.sleep(for: .milliseconds(250))
            }
        }
    }
}
