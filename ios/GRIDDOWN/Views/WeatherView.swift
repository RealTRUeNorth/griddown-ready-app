import SwiftUI
import CoreLocation

struct WeatherView: View {
    @State private var location: Coordinates?
    @State private var locationError: String = ""
    @State private var current: WeatherData?
    @State private var hourly: [WeatherForecastHour] = []
    @State private var daily: [WeatherForecastDay] = []
    @State private var isLoading: Bool = true
    @State private var hasError: Bool = false
    @State private var lastUpdated: String = ""
    @State private var isShowingCached: Bool = false
    @State private var cachedSavedAt: Date?

    private let locationManager = LocationManager()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                if !locationError.isEmpty {
                    locationWarning(locationError)
                }

                if isShowingCached, let saved = cachedSavedAt {
                    HStack(spacing: 6) {
                        Image(systemName: "icloud.slash.fill")
                            .font(.system(size: 14))
                            .foregroundStyle(Theme.statusAmber)
                        Text("OFFLINE — CACHED DATA FROM \(WeatherCache.formatSavedAt(saved).uppercased())")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(Theme.statusAmber)
                    }
                    .padding(10)
                    .background(Theme.statusAmber.opacity(0.12))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Theme.statusAmber.opacity(0.3), lineWidth: 1)
                    )
                    .clipShape(.rect(cornerRadius: 8))
                }

                if let current {
                    currentConditionsCard(current)
                    if !daily.isEmpty { sunCard(daily[0]) }
                    if !hourly.isEmpty { hourlyForecastSection }
                    if !daily.isEmpty { dailyForecastSection }
                    operationalImpactSection(current)
                }

                footer
            }
            .padding(16)
            .padding(.bottom, 40)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("Weather")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable { await fetchWeather() }
        .overlay {
            if isLoading { loadingView }
            if hasError && !isLoading { errorView }
        }
        .task { await initializeLocation() }
    }

    private var loadingView: some View {
        VStack(spacing: 12) {
            Image(systemName: "cloud.fill")
                .font(.system(size: 48))
                .foregroundStyle(Theme.textMuted)
            Text("ACQUIRING WEATHER DATA")
                .font(.system(size: 12, weight: .bold))
                .tracking(2)
                .foregroundStyle(Theme.textMuted)
            Text(location == nil ? "Getting location..." : "Fetching conditions...")
                .font(.system(size: 12))
                .foregroundStyle(Theme.textMuted)
            ProgressView()
                .tint(Theme.orange)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.bg.ignoresSafeArea())
    }

    private var errorView: some View {
        VStack(spacing: 12) {
            Image(systemName: "cloud.rain.fill")
                .font(.system(size: 48))
                .foregroundStyle(Theme.statusRed)
            Text("WEATHER UNAVAILABLE")
                .font(.system(size: 12, weight: .bold))
                .tracking(2)
                .foregroundStyle(Theme.textMuted)
            Text("Unable to fetch weather data")
                .font(.system(size: 12))
                .foregroundStyle(Theme.textMuted)
            Button {
                Task { await fetchWeather() }
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "arrow.clockwise")
                    Text("Retry")
                }
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(Theme.orange)
                .clipShape(.rect(cornerRadius: 8))
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.bg.ignoresSafeArea())
    }

    private func locationWarning(_ text: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: "location.fill")
                .font(.system(size: 14))
                .foregroundStyle(Theme.statusAmber)
            Text(text)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(Theme.statusAmber)
        }
        .padding(10)
        .background(Theme.statusAmber.opacity(0.12))
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Theme.statusAmber.opacity(0.3), lineWidth: 1)
        )
        .clipShape(.rect(cornerRadius: 8))
    }

    private func currentConditionsCard(_ w: WeatherData) -> some View {
        VStack(spacing: 18) {
            HStack {
                HStack(spacing: 8) {
                    weatherIcon(w.weatherCode, size: 56, isDay: w.isDay)
                    Text("\(Int(w.temperature.rounded()))°")
                        .font(.system(size: 54, weight: .heavy))
                        .tracking(-2)
                        .foregroundStyle(Theme.textPrimary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text(MockData.weatherCodes[w.weatherCode]?.label ?? "Unknown")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(Theme.textPrimary)
                    Text("Feels like \(Int(w.feelsLike.rounded()))°F")
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.textSecondary)
                    if let loc = location {
                        HStack(spacing: 4) {
                            Image(systemName: "location.fill").font(.system(size: 10))
                            Text(String(format: "%.2f°, %.2f°", loc.latitude, loc.longitude))
                                .font(.system(size: 10))
                        }
                        .foregroundStyle(Theme.textMuted)
                    }
                }
            }
            HStack(spacing: 8) {
                metricBox(icon: "wind", iconColor: Theme.oliveLight, label: "WIND", value: "\(Int(w.windSpeed.rounded())) mph", sublabel: windDirectionLabel(w.windDirection))
                metricBox(icon: "humidity.fill", iconColor: Color(hex: 0x64B5F6), label: "HUMIDITY", value: "\(Int(w.humidity))%")
                metricBox(icon: "cloud.rain.fill", iconColor: Color(hex: 0x42A5F5), label: "PRECIP", value: "\(String(format: "%.1f", w.precipitation)) in")
                metricBox(icon: "gauge.high", iconColor: Theme.orangeLight, label: "PRESSURE", value: "\(Int(w.pressure.rounded())) hPa")
            }
        }
        .padding(18)
        .background(Theme.bgCard)
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Theme.border, lineWidth: 1)
        )
        .clipShape(.rect(cornerRadius: 14))
    }

    private func metricBox(icon: String, iconColor: Color, label: String, value: String, sublabel: String? = nil) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 5) {
                Image(systemName: icon)
                    .font(.system(size: 16))
                    .foregroundStyle(iconColor)
                Text(label)
                    .font(.system(size: 9, weight: .bold))
                    .tracking(1.5)
                    .foregroundStyle(Theme.textMuted)
            }
            Text(value)
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(Theme.textPrimary)
            if let sublabel {
                Text(sublabel)
                    .font(.system(size: 11))
                    .foregroundStyle(Theme.textSecondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(Theme.bgElevated)
        .clipShape(.rect(cornerRadius: 10))
    }

    private func sunCard(_ day: WeatherForecastDay) -> some View {
        HStack {
            VStack(spacing: 6) {
                Image(systemName: "sunrise.fill").font(.system(size: 20)).foregroundStyle(Color(hex: 0xF6C243))
                Text("SUNRISE").font(.system(size: 9, weight: .bold)).tracking(1.5).foregroundStyle(Theme.textMuted)
                Text(formatTime(day.sunrise)).font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.textPrimary)
            }
            .frame(maxWidth: .infinity)
            Rectangle().fill(Theme.border).frame(width: 1).padding(.vertical, 4)
            VStack(spacing: 6) {
                Image(systemName: "sunset.fill").font(.system(size: 20)).foregroundStyle(Color(hex: 0xFF8A65))
                Text("SUNSET").font(.system(size: 9, weight: .bold)).tracking(1.5).foregroundStyle(Theme.textMuted)
                Text(formatTime(day.sunset)).font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.textPrimary)
            }
            .frame(maxWidth: .infinity)
        }
        .padding(16)
        .background(Theme.bgCard)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
        .clipShape(.rect(cornerRadius: 12))
    }

    private var hourlyForecastSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            SectionLabel(text: "24-HOUR FORECAST")
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(hourly) { h in
                        VStack(spacing: 6) {
                            Text(formatTime(h.time))
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundStyle(Theme.textMuted)
                            weatherIcon(h.weatherCode, size: 22)
                            Text("\(Int(h.temperature.rounded()))°")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(Theme.textPrimary)
                            if h.precipitation > 0 {
                                Text(String(format: "%.1f\"", h.precipitation))
                                    .font(.system(size: 9, weight: .semibold))
                                    .foregroundStyle(Color(hex: 0x64B5F6))
                            }
                        }
                        .padding(10)
                        .frame(minWidth: 60)
                        .background(Theme.bgCard)
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.border, lineWidth: 1))
                        .clipShape(.rect(cornerRadius: 10))
                    }
                }
            }
        }
    }

    private var dailyForecastSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            SectionLabel(text: "7-DAY OUTLOOK")
            ForEach(Array(daily.enumerated()), id: \.element.id) { idx, day in
                HStack(spacing: 8) {
                    Text(idx == 0 ? "TODAY" : formatDayShort(day.date))
                        .font(.system(size: 11, weight: .bold))
                        .tracking(0.5)
                        .foregroundStyle(Theme.textPrimary)
                        .frame(width: 42, alignment: .leading)
                    weatherIcon(day.weatherCode, size: 20)
                        .frame(width: 28)
                    Text("\(Int(day.tempMin.rounded()))°")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(Theme.textMuted)
                        .frame(width: 30, alignment: .trailing)
                    TemperatureBar(tempMin: day.tempMin, tempMax: day.tempMax)
                    Text("\(Int(day.tempMax.rounded()))°")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Theme.textPrimary)
                        .frame(width: 30, alignment: .leading)
                    if day.precipSum > 0 {
                        HStack(spacing: 2) {
                            Image(systemName: "humidity.fill").font(.system(size: 10)).foregroundStyle(Color(hex: 0x64B5F6))
                            Text(String(format: "%.1f\"", day.precipSum)).font(.system(size: 10, weight: .semibold)).foregroundStyle(Color(hex: 0x64B5F6))
                        }
                    }
                    HStack(spacing: 2) {
                        Image(systemName: "wind").font(.system(size: 10)).foregroundStyle(Theme.textMuted)
                        Text("\(Int(day.windMax.rounded()))").font(.system(size: 10, weight: .semibold)).foregroundStyle(Theme.textMuted)
                    }
                    .frame(width: 30)
                }
                .padding(12)
                .background(Theme.bgCard)
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.border, lineWidth: 1))
                .clipShape(.rect(cornerRadius: 10))
                .padding(.bottom, 6)
            }
        }
    }

    private func operationalImpactSection(_ w: WeatherData) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("OPERATIONAL IMPACT")
                .font(.system(size: 10, weight: .bold))
                .tracking(2)
                .foregroundStyle(Theme.textMuted)
                .padding(.bottom, 4)

            if w.windSpeed > 30 {
                impactRow(color: Theme.statusRed, text: "High winds - secure equipment & shelter")
            }
            if w.precipitation > 0.5 {
                impactRow(color: Theme.statusAmber, text: "Active precipitation - limit movement")
            }
            if w.temperature < 32 {
                impactRow(color: Color(hex: 0x42A5F5), text: "Freezing conditions - cold weather protocols")
            }
            if w.temperature > 95 {
                impactRow(color: Theme.statusRed, text: "Extreme heat - hydration critical")
            }
            if w.windSpeed <= 30 && w.precipitation <= 0.5 && w.temperature >= 32 && w.temperature <= 95 {
                impactRow(color: Theme.statusGreen, text: "Conditions nominal - no weather restrictions")
            }

            Text("Radio propagation: \(w.humidity > 80 ? "Degraded (high moisture)" : "Normal")")
                .font(.system(size: 11))
                .foregroundStyle(Theme.textSecondary)
            Text("Visibility estimate: \(w.weatherCode >= 45 && w.weatherCode <= 48 ? "Reduced (fog)" : w.precipitation > 0.2 ? "Reduced (precip)" : "Good")")
                .font(.system(size: 11))
                .foregroundStyle(Theme.textSecondary)
        }
        .padding(16)
        .background(Theme.bgCard)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
        .clipShape(.rect(cornerRadius: 12))
        .padding(.top, 16)
    }

    private func impactRow(color: Color, text: String) -> some View {
        HStack(spacing: 8) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(text)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(Theme.textPrimary)
        }
    }

    private var footer: some View {
        VStack(spacing: 4) {
            Text("DATA: OPEN-METEO API • UPDATED \(lastUpdated)")
                .font(.system(size: 9, weight: .bold))
                .tracking(1.5)
                .foregroundStyle(Theme.textMuted)
            Text("Pull down to refresh")
                .font(.system(size: 10))
                .foregroundStyle(Theme.textMuted)
        }
        .padding(.top, 24)
        .padding(.bottom, 12)
        .frame(maxWidth: .infinity)
        .overlay(alignment: .top) { Rectangle().fill(Theme.border).frame(height: 1) }
    }

    // MARK: - Helpers

    private func weatherIcon(_ code: Int, size: CGFloat, isDay: Bool = true) -> some View {
        let iconName = MockData.weatherCodes[code]?.icon ?? "sun.max.fill"
        let color: Color = isDay ? Color(hex: 0xF6C243) : Color(hex: 0xB0BEC5)
        if code == 2 { return AnyView(Image(systemName: iconName).font(.system(size: size)).foregroundStyle(Theme.amberLight)) }
        if code == 3 || code == 45 || code == 48 { return AnyView(Image(systemName: iconName).font(.system(size: size)).foregroundStyle(Theme.textSecondary)) }
        if code >= 51 && code <= 55 { return AnyView(Image(systemName: iconName).font(.system(size: size)).foregroundStyle(Color(hex: 0x64B5F6))) }
        if code >= 61 && code <= 67 { return AnyView(Image(systemName: iconName).font(.system(size: size)).foregroundStyle(Color(hex: 0x42A5F5))) }
        if code >= 71 && code <= 77 { return AnyView(Image(systemName: iconName).font(.system(size: size)).foregroundStyle(Color(hex: 0xE0E0E0))) }
        if code >= 80 && code <= 82 { return AnyView(Image(systemName: iconName).font(.system(size: size)).foregroundStyle(Color(hex: 0x42A5F5))) }
        if code >= 85 && code <= 86 { return AnyView(Image(systemName: iconName).font(.system(size: size)).foregroundStyle(Color(hex: 0xE0E0E0))) }
        if code >= 95 { return AnyView(Image(systemName: iconName).font(.system(size: size)).foregroundStyle(Color(hex: 0xFFA726))) }
        return AnyView(Image(systemName: iconName).font(.system(size: size)).foregroundStyle(color))
    }

    private func windDirectionLabel(_ deg: Double) -> String {
        let dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
        return dirs[Int(round(deg / 22.5)) % 16]
    }

    private func formatTime(_ isoString: String) -> String {
        let formatter = ISO8601DateFormatter()
        if let date = formatter.date(from: isoString.contains("T") ? isoString : "\(isoString)T00:00:00") {
            let f = DateFormatter()
            f.dateFormat = "ha"
            return f.string(from: date).lowercased()
        }
        return isoString
    }

    private func formatDayShort(_ dateStr: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        guard let date = formatter.date(from: dateStr) else { return "???" }
        let f = DateFormatter()
        f.dateFormat = "EEE"
        return f.string(from: date).uppercased()
    }

    // MARK: - Data

    private func initializeLocation() async {
        isLoading = true
        let granted = await locationManager.requestPermission()
        if granted {
            if let loc = await locationManager.getCurrentLocation() {
                location = loc
            } else {
                location = Coordinates(latitude: 39.8283, longitude: -98.5795)
                locationError = "Location unavailable - using default"
            }
        } else {
            location = Coordinates(latitude: 39.8283, longitude: -98.5795)
            locationError = "Location denied - using default"
        }
        await fetchWeather()
    }

    private func fetchWeather() async {
        guard let location else { return }
        isLoading = true
        hasError = false
        isShowingCached = false
        let url = URL(string: "https://api.open-meteo.com/v1/forecast?latitude=\(location.latitude)&longitude=\(location.longitude)&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,is_day&hourly=temperature_2m,weather_code,precipitation,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&forecast_days=7")!

        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
            parseWeather(json)
            let f = DateFormatter()
            f.dateFormat = "h:mma"
            lastUpdated = f.string(from: Date()).lowercased()
            if let current {
                WeatherCache.saveFull(CachedWeatherSnapshot(
                    current: current, hourly: hourly, daily: daily,
                    savedAt: Date(), latitude: location.latitude, longitude: location.longitude
                ))
            }
            isLoading = false
        } catch {
            // Offline — fall back to the last cached snapshot if we have one
            if let snapshot = WeatherCache.load() {
                current = snapshot.current
                hourly = snapshot.hourly
                daily = snapshot.daily
                isShowingCached = true
                cachedSavedAt = snapshot.savedAt
                lastUpdated = WeatherCache.formatSavedAt(snapshot.savedAt)
            } else {
                hasError = true
            }
            isLoading = false
        }
    }

    private func parseWeather(_ json: [String: Any]) {
        guard let current = json["current"] as? [String: Any],
              let temp = current["temperature_2m"] as? Double,
              let humidity = current["relative_humidity_2m"] as? Double,
              let feelsLike = current["apparent_temperature"] as? Double,
              let precip = current["precipitation"] as? Double,
              let code = current["weather_code"] as? Int,
              let windSpeed = current["wind_speed_10m"] as? Double,
              let windDir = current["wind_direction_10m"] as? Double,
              let pressure = current["surface_pressure"] as? Double,
              let isDay = current["is_day"] as? Int else { return }

        self.current = WeatherData(
            temperature: temp, feelsLike: feelsLike, humidity: humidity,
            windSpeed: windSpeed, windDirection: windDir, weatherCode: code,
            precipitation: precip, pressure: pressure, isDay: isDay == 1,
            updatedAt: ISO8601DateFormatter().string(from: Date())
        )

        if let hourly = json["hourly"] as? [String: Any],
           let times = hourly["time"] as? [String],
           let temps = hourly["temperature_2m"] as? [Double],
           let codes = hourly["weather_code"] as? [Int],
           let precips = hourly["precipitation"] as? [Double],
           let winds = hourly["wind_speed_10m"] as? [Double] {
            let count = min(24, times.count)
            self.hourly = (0..<count).map { i in
                WeatherForecastHour(time: times[i], temperature: temps[i], weatherCode: codes[i], precipitation: precips[i], windSpeed: winds[i])
            }
        }

        if let daily = json["daily"] as? [String: Any],
           let dates = daily["time"] as? [String],
           let maxes = daily["temperature_2m_max"] as? [Double],
           let mins = daily["temperature_2m_min"] as? [Double],
           let dCodes = daily["weather_code"] as? [Int],
           let dPrecips = daily["precipitation_sum"] as? [Double],
           let dWinds = daily["wind_speed_10m_max"] as? [Double],
           let sunrises = daily["sunrise"] as? [String],
           let sunsets = daily["sunset"] as? [String] {
            self.daily = (0..<dates.count).map { i in
                WeatherForecastDay(
                    date: dates[i], tempMax: maxes[i], tempMin: mins[i],
                    weatherCode: dCodes[i], precipSum: dPrecips[i], windMax: dWinds[i],
                    sunrise: sunrises[i], sunset: sunsets[i]
                )
            }
        }
    }
}

private struct TemperatureBar: View {
    let tempMin: Double
    let tempMax: Double

    var body: some View {
        GeometryReader { geo in
            let lowPct = Swift.max(0, (tempMin - 10) / 100)
            let highPct = Swift.min(1, (tempMax - 10) / 100)
            ZStack(alignment: .leading) {
                Theme.bgElevated
                    .clipShape(.rect(cornerRadius: 2))
                Theme.orange
                    .frame(width: geo.size.width * (highPct - lowPct))
                    .offset(x: geo.size.width * lowPct)
                    .clipShape(.rect(cornerRadius: 2))
            }
        }
        .frame(maxWidth: .infinity)
        .frame(height: 4)
    }
}

final class LocationManager: NSObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    private var permissionContinuation: CheckedContinuation<Bool, Never>?
    private var locationContinuation: CheckedContinuation<Coordinates?, Never>?

    override init() {
        super.init()
        manager.delegate = self
    }

    func requestPermission() async -> Bool {
        let status = manager.authorizationStatus
        if status == .authorizedWhenInUse || status == .authorizedAlways {
            return true
        }
        if status == .denied || status == .restricted {
            return false
        }
        return await withCheckedContinuation { continuation in
            permissionContinuation = continuation
            manager.requestWhenInUseAuthorization()
        }
    }

    func getCurrentLocation() async -> Coordinates? {
        if let loc = manager.location {
            return Coordinates(latitude: loc.coordinate.latitude, longitude: loc.coordinate.longitude)
        }
        return await withCheckedContinuation { continuation in
            locationContinuation = continuation
            manager.requestLocation()
        }
    }

    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        Task { @MainActor in
            let status = manager.authorizationStatus
            let granted = status == .authorizedWhenInUse || status == .authorizedAlways
            permissionContinuation?.resume(returning: granted)
            permissionContinuation = nil
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        Task { @MainActor in
            if let loc = locations.last {
                locationContinuation?.resume(returning: Coordinates(latitude: loc.coordinate.latitude, longitude: loc.coordinate.longitude))
            } else {
                locationContinuation?.resume(returning: nil)
            }
            locationContinuation = nil
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        Task { @MainActor in
            locationContinuation?.resume(returning: nil)
            locationContinuation = nil
        }
    }
}
