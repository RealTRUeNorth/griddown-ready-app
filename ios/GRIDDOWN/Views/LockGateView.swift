import SwiftUI

/// Full-screen gate rendered over the app while the biometric lock is
/// engaged. Prompts the system auth UI automatically on appear.
struct LockGateView: View {
    let service: BiometricLockService
    @State private var isAuthenticating = false

    var body: some View {
        ZStack {
            Theme.bg.ignoresSafeArea()
            VStack(spacing: 20) {
                Image(systemName: "shield.fill")
                    .font(.system(size: 48))
                    .foregroundStyle(Theme.orange)
                Text("GRIDDOWN")
                    .font(.system(size: 20, weight: .heavy))
                    .tracking(4)
                    .foregroundStyle(Theme.textPrimary)
                Text("Your ops kit is locked")
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.textSecondary)
                Button {
                    unlock()
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "lock.open.fill")
                            .font(.system(size: 14, weight: .bold))
                        Text("Unlock with \(service.biometryLabel)")
                            .font(.system(size: 14, weight: .bold))
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(Theme.olive)
                    .clipShape(.rect(cornerRadius: 10))
                }
                .buttonStyle(.plain)
                .disabled(isAuthenticating)
                if isAuthenticating {
                    ProgressView()
                        .tint(Theme.oliveLight)
                }
            }
            .padding(24)
        }
        .onAppear { unlock() }
    }

    private func unlock() {
        guard !isAuthenticating else { return }
        isAuthenticating = true
        Task {
            _ = await service.authenticate()
            isAuthenticating = false
        }
    }
}
