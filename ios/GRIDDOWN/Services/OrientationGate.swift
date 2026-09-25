import UIKit

/// Tracks which screen is active so the app can rotate freely on the
/// tactical map while staying portrait everywhere else. The map screen
/// flips this flag in onAppear/onDisappear; `AppDelegate` reads it.
enum OrientationGate {
    static var isMapActive = false
}

final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        supportedInterfaceOrientationsFor window: UIWindow?
    ) -> UIInterfaceOrientationMask {
        OrientationGate.isMapActive ? .allButUpsideDown : .portrait
    }
}
