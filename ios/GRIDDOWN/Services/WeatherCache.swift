import Foundation

struct CachedWeatherSnapshot: Codable, Sendable {
    var current: WeatherData
    var hourly: [WeatherForecastHour]
    var daily: [WeatherForecastDay]
    var savedAt: Date
    var latitude: Double
    var longitude: Double
}

/// Persists the last successful weather fetch so the app can show
/// conditions when the network is unavailable. Shared by the Weather
/// screen (full snapshot) and the Map screen (current conditions only,
/// which preserves any existing forecast arrays).
enum WeatherCache {
    private static let key = "griddown_weather_cache"

    static func saveFull(_ snapshot: CachedWeatherSnapshot) {
        if let data = try? JSONEncoder().encode(snapshot) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }

    /// Updates just the current conditions, preserving any cached forecast arrays.
    static func saveCurrent(_ current: WeatherData, latitude: Double, longitude: Double) {
        let existing = load()
        saveFull(CachedWeatherSnapshot(
            current: current,
            hourly: existing?.hourly ?? [],
            daily: existing?.daily ?? [],
            savedAt: Date(),
            latitude: latitude,
            longitude: longitude
        ))
    }

    static func load() -> CachedWeatherSnapshot? {
        guard let data = UserDefaults.standard.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(CachedWeatherSnapshot.self, from: data)
    }

    static func formatSavedAt(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mma"
        return formatter.string(from: date).lowercased()
    }
}
