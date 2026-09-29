import AVFoundation
import UIKit

/// Controls the rear LED torch for the Lantern tool. The torch works without
/// camera permission; devices without a flash fall back to screen light.
@MainActor
@Observable
final class TorchService {
    private(set) var isTorchOn = false
    private(set) var isSosOn = false

    var isAvailable: Bool {
        if let device = AVCaptureDevice.default(for: .video) { return device.hasTorch }
        return false
    }

    private var sosTask: Task<Void, Never>?

    func setTorch(_ on: Bool) {
        stopSos()
        setFlash(on)
        isTorchOn = on
    }

    func toggleTorch() {
        setTorch(!isTorchOn)
    }

    /// Flashes Morse SOS (··· ––– ···) on the torch until stopped.
    func startSos() {
        stopSos()
        guard let device = AVCaptureDevice.default(for: .video), device.hasTorch else { return }
        isSosOn = true
        sosTask = Task { [weak self] in
            let short = Duration.milliseconds(200)
            let long = Duration.milliseconds(600)
            let gap = Duration.milliseconds(150)
            let pattern: [Duration] = [short, short, short, long, long, long, short, short, short]
            while !Task.isCancelled {
                for duration in pattern {
                    guard let self, !Task.isCancelled else { return }
                    self.setFlash(true)
                    try? await Task.sleep(for: duration)
                    guard !Task.isCancelled else { return }
                    self.setFlash(false)
                    try? await Task.sleep(for: gap)
                }
                try? await Task.sleep(for: .seconds(1.2))
            }
        }
    }

    func stopSos() {
        sosTask?.cancel()
        sosTask = nil
        isSosOn = false
    }

    private func setFlash(_ on: Bool) {
        guard let device = AVCaptureDevice.default(for: .video), device.hasTorch else { return }
        do {
            try device.lockForConfiguration()
            device.torchMode = on ? .on : .off
            device.unlockForConfiguration()
        } catch {
            // Torch configuration can fail transiently; ignore and retry on next call.
        }
    }
}
