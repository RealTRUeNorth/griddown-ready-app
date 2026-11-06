import UIKit
import UserNotifications

/// Tracks which screen is active so the app can rotate freely on the
/// tactical map while staying portrait everywhere else. The map screen
/// flips this flag in onAppear/onDisappear; `AppDelegate` reads it.
enum OrientationGate {
    static var isMapActive = false
}

final class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(
        _ application: UIApplication,
        supportedInterfaceOrientationsFor window: UIWindow?
    ) -> UIInterfaceOrientationMask {
        OrientationGate.isMapActive ? .allButUpsideDown : .portrait
    }

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    /// Routes notification taps to the relevant screen (check-in reminders
    /// open Status, supply expiry alerts open the supplies list).
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        let target = DeepLink.route(
            forNotificationIdentifier: response.notification.request.identifier
        )
        NotificationCenter.default.post(name: .griddownDeepLink, object: target)
    }
}
