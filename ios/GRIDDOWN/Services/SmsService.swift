import SwiftUI
import MessageUI

/// UIKit SMS composer presented as a sheet so a group broadcast stays
/// in-app. On devices without messaging capability (e.g. the simulator)
/// callers should fall back to `SmsService.openViaUrl` or show an alert.
struct MessageComposer: UIViewControllerRepresentable {
    let recipients: [String]
    let body: String
    var onDismiss: () -> Void = {}

    func makeUIViewController(context: Context) -> MFMessageComposeViewController {
        let vc = MFMessageComposeViewController()
        vc.recipients = recipients
        vc.body = body
        vc.messageComposeDelegate = context.coordinator
        return vc
    }

    func updateUIViewController(_ uiViewController: MFMessageComposeViewController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(onDismiss: onDismiss)
    }

    final class Coordinator: NSObject, MFMessageComposeViewControllerDelegate {
        let onDismiss: () -> Void

        init(onDismiss: @escaping () -> Void) {
            self.onDismiss = onDismiss
        }

        nonisolated func messageComposeViewController(
            _ controller: MFMessageComposeViewController,
            didFinishWith result: MessageComposeResult
        ) {
            Task { @MainActor in
                controller.dismiss(animated: true)
                self.onDismiss()
            }
        }
    }
}

enum SmsService {
    /// True when the device can actually send SMS — false on the simulator.
    static var canSend: Bool { MFMessageComposeViewController.canSendText() }

    /// Opens Messages via the sms: URL scheme (iOS takes the body after "&").
    /// Returns false when the platform refuses to open it.
    @MainActor
    static func openViaUrl(recipients: [String], body: String) -> Bool {
        let numbers = recipients
            .map { $0.replacingOccurrences(of: "[^0-9+]", with: "", options: .regularExpression) }
            .filter { !$0.isEmpty }
        var components = URLComponents()
        components.scheme = "sms"
        components.path = numbers.joined(separator: ",")
        components.queryItems = [URLQueryItem(name: "body", value: body)]
        guard let url = components.url, UIApplication.shared.canOpenURL(url) else { return false }
        UIApplication.shared.open(url, options: [:], completionHandler: nil)
        return true
    }
}
