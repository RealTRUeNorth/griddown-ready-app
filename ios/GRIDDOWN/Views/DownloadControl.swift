import SwiftUI

/// Download control for a Kiwix resource. Renders the action matching the
/// current download state: start (confirming large files), live progress
/// with cancel, completed (open/delete), error retry, or canceled restart.
struct KiwixDownloadControl: View {
    let resource: KiwixResource
    @Environment(KiwixDownloadManager.self) var downloads
    @State private var showingLargeConfirm = false

    private static let largeThreshold: Int64 = 1024 * 1024 * 1024 // 1 GB

    private var state: KiwixDownloadState { downloads.state(for: resource) }

    var body: some View {
        switch state {
        case .notStarted, .canceled:
            VStack(spacing: 6) {
                if case .canceled = state {
                    Text("Download canceled")
                        .font(.system(size: 11))
                        .foregroundStyle(Theme.textMuted)
                        .frame(maxWidth: .infinity)
                }
                startButton(label: "\(state == .canceled ? "Restart" : "Download") · \(resource.sizeLabel)")
            }

        case .downloading(let progress, let written, let total):
            VStack(spacing: 8) {
                HStack {
                    Text(total > 0
                         ? "\(KiwixDownloadManager.formatBytes(written)) / \(KiwixDownloadManager.formatBytes(total))"
                         : KiwixDownloadManager.formatBytes(written))
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(Theme.textSecondary)
                    Spacer()
                    Text("\(Int(progress * 100))%")
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(Theme.orange)
                }
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Theme.bgElevated.clipShape(.rect(cornerRadius: 3))
                        Theme.orange
                            .frame(width: geo.size.width * progress)
                            .clipShape(.rect(cornerRadius: 3))
                    }
                }
                .frame(height: 6)
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    downloads.cancel(resource.id)
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "xmark").font(.system(size: 12, weight: .semibold))
                        Text("Cancel Download").font(.system(size: 12, weight: .semibold))
                    }
                    .foregroundStyle(Theme.textSecondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 7)
                    .background(Theme.bgElevated)
                    .clipShape(.rect(cornerRadius: 6))
                }
                .buttonStyle(.plain)
            }

        case .completed(let record):
            VStack(spacing: 8) {
                HStack(spacing: 6) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.statusGreen)
                    Text("On device · \(KiwixDownloadManager.formatBytes(record.bytesTotal))")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Theme.statusGreen)
                    Spacer()
                }
                HStack(spacing: 8) {
                    if let url = downloads.fileURL(for: resource.id) {
                        ShareLink(item: url) {
                            HStack(spacing: 6) {
                                Image(systemName: "square.and.arrow.up").font(.system(size: 12, weight: .bold))
                                Text("Open With…").font(.system(size: 12, weight: .bold))
                            }
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 9)
                            .background(Theme.olive)
                            .clipShape(.rect(cornerRadius: 8))
                        }
                    }
                    Button(role: .destructive) {
                        UINotificationFeedbackGenerator().notificationOccurred(.warning)
                        downloads.delete(resource.id)
                    } label: {
                        Image(systemName: "trash")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(Theme.statusRed)
                            .frame(width: 40, height: 36)
                            .background(Theme.redMuted.opacity(0.4))
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.redMuted, lineWidth: 1))
                            .clipShape(.rect(cornerRadius: 8))
                    }
                    .buttonStyle(.plain)
                }
            }

        case .failed(let message):
            VStack(spacing: 8) {
                HStack(spacing: 6) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.statusRed)
                    Text(message)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(Theme.statusRed)
                        .lineLimit(1)
                    Spacer()
                }
                startButton(label: "Retry · \(resource.sizeLabel)", icon: "arrow.clockwise")
            }
        }
    }

    private func startButton(label: String, icon: String = "arrow.down.circle.fill") -> some View {
        Button {
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            if (resource.sizeBytes ?? 0) >= Self.largeThreshold {
                showingLargeConfirm = true
            } else {
                downloads.start(resource)
            }
        } label: {
            HStack(spacing: 6) {
                Image(systemName: icon).font(.system(size: 14, weight: .semibold))
                Text(label).font(.system(size: 13, weight: .bold))
            }
            .foregroundStyle(Theme.orange)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(Theme.orangeMuted.opacity(0.2))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.orangeMuted, lineWidth: 1))
            .clipShape(.rect(cornerRadius: 8))
        }
        .buttonStyle(.plain)
        .alert("Large Download", isPresented: $showingLargeConfirm) {
            Button("Cancel", role: .cancel) {}
            Button("Download") { downloads.start(resource) }
        } message: {
            Text("\(resource.title) is \(resource.sizeLabel). Make sure you have enough free storage and a stable connection.")
        }
    }
}
