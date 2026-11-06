//
//  GRIDDOWNApp.swift
//  GRIDDOWN
//
//  Created by Rork on July 12, 2026.
//

import SwiftUI

@main
struct GRIDDOWNApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate

    /// Unit tests are hosted in the app process but don't need the UI or
    /// its startup side effects (store init, biometric gate, services).
    private let isTesting = ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] != nil

    var body: some Scene {
        WindowGroup {
            if isTesting {
                Color.clear
            } else {
                ContentView()
            }
        }
    }
}
