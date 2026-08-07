import Foundation

/**
 * Weather-triggered tactical resource suggestions.
 *
 * When weather conditions change (rain, snow, storms, extreme heat, etc.),
 * this engine calls the Rork AI proxy to generate context-aware POI
 * suggestions near the user's location — potable water opportunities,
 * shelter needs, hazard zones, and other dynamic resources.
 */

struct WeatherSuggestion: Identifiable, Sendable {
    let id: String
    let title: String
    let category: String
    let description: String
    let latOffset: Double
    let lngOffset: Double
    let reasoning: String
}

struct WeatherSuggestionResponse: Sendable {
    let suggestions: [WeatherSuggestion]
    let summary: String
}

enum WeatherSuggestionsService {

    private static let modelId = "google/gemini-2.5-flash-lite"

    /// Determine if current weather conditions warrant resource suggestions.
    /// Returns a human-readable trigger description, or nil if conditions are benign.
    static func getWeatherTrigger(_ weather: WeatherData) -> String? {
        let code = weather.weatherCode
        let precip = weather.precipitation
        let wind = weather.windSpeed
        let temp = weather.temperature
        let humidity = weather.humidity

        // Heavy rain — water collection opportunity
        if (code >= 61 && code <= 67) || (code >= 80 && code <= 82) {
            if precip >= 0.1 {
                return "Heavy precipitation (\(String(format: "%.2f", precip))in) — potable water collection opportunities available. Rainwater can be harvested at elevated collection points."
            }
        }

        // Thunderstorm — shelter and hazard
        if code >= 95 {
            return "Thunderstorm activity — seek shelter, avoid high ground and open areas. Metal structures and tall objects are lightning hazards."
        }

        // Snow — shelter and warmth
        if (code >= 71 && code <= 77) || (code >= 85 && code <= 86) {
            return "Snow conditions — shelter and warmth are critical. Avoid exposed routes. Whiteout risk on elevated terrain."
        }

        // Fog — navigation hazard
        if code == 45 || code == 48 {
            return "Fog conditions — reduced visibility. Navigation hazards on roads and elevated positions. Stay near known landmarks."
        }

        // High wind — structural and movement hazard
        if wind >= 25 {
            return "High winds (\(Int(wind)) mph) — structural damage risk. Avoid tree-lined routes and loose structures. Secure outdoor equipment."
        }

        // Extreme heat
        if temp >= 100 {
            return "Extreme heat (\(Int(temp))°F) — water consumption will increase 2-3x. Prioritize shade and water sources. Heat exhaustion risk."
        }

        // Extreme cold
        if temp <= 20 {
            return "Extreme cold (\(Int(temp))°F) — hypothermia risk. Shelter and fire-starting materials are priority. Avoid wind-exposed positions."
        }

        // High humidity + moderate temp — dew collection
        if humidity >= 85 && temp > 40 && temp < 80 {
            return "High humidity (\(Int(humidity))%) — dew collection possible at dawn on metal and plastic surfaces. Passive water harvesting opportunity."
        }

        return nil
    }

    /// Call the Rork AI proxy to generate weather-triggered tactical resource suggestions.
    static func fetchSuggestions(
        weather: WeatherData,
        userLocation: Coordinates
    ) async -> WeatherSuggestionResponse {
        guard let trigger = getWeatherTrigger(weather) else {
            return WeatherSuggestionResponse(
                suggestions: [],
                summary: "Current conditions are stable — no weather-triggered resource alerts."
            )
        }

        let toolkitUrl = Config.EXPO_PUBLIC_TOOLKIT_URL
        let secretKey = Config.EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY

        if toolkitUrl.isEmpty || secretKey.isEmpty {
            return generateLocalSuggestions(weather: weather, trigger: trigger, userLocation: userLocation)
        }

        let prompt = buildPrompt(weather: weather, userLocation: userLocation, trigger: trigger)

        guard let url = URL(string: "\(toolkitUrl)/v2/vercel/v1/chat/completions") else {
            return generateLocalSuggestions(weather: weather, trigger: trigger, userLocation: userLocation)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(secretKey)", forHTTPHeaderField: "Authorization")

        let body: [String: Any] = [
            "model": modelId,
            "messages": [
                ["role": "system", "content": "You are a tactical AI assistant. Respond only with valid JSON."],
                ["role": "user", "content": prompt],
            ],
            "temperature": 0.7,
            "max_tokens": 800,
        ]

        guard let httpBody = try? JSONSerialization.data(withJSONObject: body) else {
            return generateLocalSuggestions(weather: weather, trigger: trigger, userLocation: userLocation)
        }
        request.httpBody = httpBody

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let httpResp = response as? HTTPURLResponse, httpResp.statusCode == 200 else {
                return generateLocalSuggestions(weather: weather, trigger: trigger, userLocation: userLocation)
            }

            guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let choices = json["choices"] as? [[String: Any]],
                  let content = choices.first?["message"] as? [String: Any],
                  let text = content["content"] as? String else {
                return generateLocalSuggestions(weather: weather, trigger: trigger, userLocation: userLocation)
            }

            // Extract JSON from the response (may be wrapped in markdown code blocks)
            guard let jsonRange = text.range(of: #"\{[\s\S]*\}"#, options: .regularExpression) else {
                return generateLocalSuggestions(weather: weather, trigger: trigger, userLocation: userLocation)
            }

            let jsonString = String(text[jsonRange])
            guard let jsonData = jsonString.data(using: .utf8),
                  let parsed = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] else {
                return generateLocalSuggestions(weather: weather, trigger: trigger, userLocation: userLocation)
            }

            let summary = parsed["summary"] as? String ?? trigger
            let suggestionsArray = parsed["suggestions"] as? [[String: Any]] ?? []

            let suggestions: [WeatherSuggestion] = suggestionsArray.enumerated().compactMap { idx, item in
                guard let title = item["title"] as? String,
                      let category = item["category"] as? String,
                      let description = item["description"] as? String,
                      let latOffset = item["latOffset"] as? Double,
                      let lngOffset = item["lngOffset"] as? Double,
                      let reasoning = item["reasoning"] as? String else { return nil }
                return WeatherSuggestion(
                    id: "weather-sugg-\(Int(Date().timeIntervalSince1970))-\(idx)",
                    title: title,
                    category: category,
                    description: description,
                    latOffset: latOffset,
                    lngOffset: lngOffset,
                    reasoning: reasoning
                )
            }

            return WeatherSuggestionResponse(suggestions: suggestions, summary: summary)
        } catch {
            return generateLocalSuggestions(weather: weather, trigger: trigger, userLocation: userLocation)
        }
    }

    /// Local rule-based fallback when AI proxy is unavailable.
    private static func generateLocalSuggestions(
        weather: WeatherData,
        trigger: String,
        userLocation: Coordinates
    ) -> WeatherSuggestionResponse {
        var suggestions: [WeatherSuggestion] = []
        let code = weather.weatherCode
        var idCounter = 0

        func makeId() -> String {
            idCounter += 1
            return "weather-local-\(Int(Date().timeIntervalSince1970))-\(idCounter)"
        }

        // Rain → water collection
        if (code >= 61 && code <= 67) || (code >= 80 && code <= 82) {
            suggestions.append(WeatherSuggestion(
                id: makeId(),
                title: "Rainwater Collection Point",
                category: "water",
                description: "Deploy tarps and collection barrels at this elevated position. Wait 10 min after rain starts to avoid debris. Filter and purify before drinking.",
                latOffset: 0.005,
                lngOffset: 0.003,
                reasoning: "Active precipitation (\(String(format: "%.2f", weather.precipitation))in) makes rainwater harvesting viable at scale."
            ))
            suggestions.append(WeatherSuggestion(
                id: makeId(),
                title: "Runoff Collection — Low Ground",
                category: "water",
                description: "Natural runoff channel. Place containers at confluence point. High volume but higher contamination risk — double-filter required.",
                latOffset: -0.008,
                lngOffset: -0.004,
                reasoning: "Rainfall creates surface runoff that converges at low-elevation points."
            ))
        }

        // Thunderstorm → shelter + hazard
        if code >= 95 {
            suggestions.append(WeatherSuggestion(
                id: makeId(),
                title: "Lightning Shelter — Low Ground",
                category: "shelter",
                description: "Seek shelter in a substantial building or hard-topped vehicle. Avoid open areas, tall isolated trees, and metal structures.",
                latOffset: -0.003,
                lngOffset: 0.006,
                reasoning: "Thunderstorm activity makes high ground and open areas extremely dangerous."
            ))
            suggestions.append(WeatherSuggestion(
                id: makeId(),
                title: "Lightning Hazard Zone — High Ground",
                category: "hazard",
                description: "Avoid this elevated area during thunderstorm. Lightning strikes preferentially target high points.",
                latOffset: 0.010,
                lngOffset: 0.008,
                reasoning: "Elevated terrain is a primary lightning strike target during electrical storms."
            ))
        }

        // Snow → shelter
        if (code >= 71 && code <= 77) || (code >= 85 && code <= 86) {
            suggestions.append(WeatherSuggestion(
                id: makeId(),
                title: "Wind-Protected Shelter",
                category: "shelter",
                description: "Natural windbreak — leeward side of terrain feature. Build snow shelter if no structure available. Insulate from ground.",
                latOffset: 0.004,
                lngOffset: -0.005,
                reasoning: "Snow conditions require shelter that blocks wind and retains body heat."
            ))
        }

        // High wind → hazard
        if weather.windSpeed >= 25 {
            suggestions.append(WeatherSuggestion(
                id: makeId(),
                title: "Wind Hazard — Exposed Corridor",
                category: "hazard",
                description: "Avoid this open corridor during high winds. Flying debris and structural failure risk. Seek protected routes instead.",
                latOffset: 0.002,
                lngOffset: -0.007,
                reasoning: "Sustained winds at \(Int(weather.windSpeed)) mph create debris and structural hazards in open areas."
            ))
        }

        // Extreme heat → water priority
        if weather.temperature >= 100 {
            suggestions.append(WeatherSuggestion(
                id: makeId(),
                title: "Shade & Water Staging Point",
                category: "shelter",
                description: "Natural shade structure. Set up hydration station here. Water consumption will be 2-3x normal. Monitor for heat exhaustion.",
                latOffset: -0.004,
                lngOffset: 0.005,
                reasoning: "Extreme heat (\(Int(weather.temperature))°F) dramatically increases water needs and heat illness risk."
            ))
        }

        // Extreme cold → warmth
        if weather.temperature <= 20 {
            suggestions.append(WeatherSuggestion(
                id: makeId(),
                title: "Emergency Warming Shelter",
                category: "shelter",
                description: "Identify insulated structure. Block drafts, concentrate body heat, maintain fire if safe. Watch for frostbite on exposed skin.",
                latOffset: 0.006,
                lngOffset: 0.002,
                reasoning: "Extreme cold (\(Int(weather.temperature))°F) — hypothermia risk within 2-3 hours without adequate shelter."
            ))
        }

        // High humidity → dew collection
        if weather.humidity >= 85 && weather.temperature > 40 && weather.temperature < 80 {
            suggestions.append(WeatherSuggestion(
                id: makeId(),
                title: "Dew Collection Surface",
                category: "water",
                description: "Metal or plastic sheeting placed here will collect condensation at dawn. Wipe into container with clean cloth. 1-2 cups per night possible.",
                latOffset: 0.003,
                lngOffset: -0.003,
                reasoning: "High humidity (\(Int(weather.humidity))%) creates ideal conditions for passive dew condensation overnight."
            ))
        }

        // Fog → navigation hazard
        if code == 45 || code == 48 {
            suggestions.append(WeatherSuggestion(
                id: makeId(),
                title: "Navigation Hazard — Reduced Visibility",
                category: "hazard",
                description: "Visibility severely reduced. Mark known landmarks with reflective markers. Use compass and dead reckoning. Avoid vehicle movement.",
                latOffset: 0.001,
                lngOffset: 0.001,
                reasoning: "Fog conditions make visual navigation unreliable and increase collision risk."
            ))
        }

        return WeatherSuggestionResponse(suggestions: suggestions, summary: trigger)
    }

    private static func buildPrompt(weather: WeatherData, userLocation: Coordinates, trigger: String) -> String {
        """
        You are a tactical preparedness AI for a grid-down emergency app called GRIDDOWN.

        Current weather conditions near \(String(format: "%.4f", userLocation.latitude)), \(String(format: "%.4f", userLocation.longitude)):
        - Temperature: \(Int(weather.temperature))°F (feels like \(Int(weather.feelsLike))°F)
        - Weather code: \(weather.weatherCode)
        - Precipitation: \(String(format: "%.2f", weather.precipitation)) inches
        - Wind: \(Int(weather.windSpeed)) mph from \(Int(weather.windDirection))°
        - Humidity: \(Int(weather.humidity))%
        - Pressure: \(Int(weather.pressure)) hPa

        Trigger: \(trigger)

        Generate 1-4 tactical POI (point of interest) suggestions that the group should mark on their map given these conditions. Think about:
        - Where to collect potable water (rainwater collection, runoff, natural sources)
        - Where to seek shelter (covered areas, wind-protected zones)
        - Hazards to avoid (flood zones, lightning-prone high ground, wind-exposed structures)
        - Resource opportunities (dew collection surfaces, natural windbreaks)

        For each suggestion, provide:
        - title: Short name (e.g. "Rainwater Collection Point", "Wind-Protected Shelter")
        - category: One of: water, shelter, hazard, weather_resource, rally_point, supply_cache
        - description: 1-2 sentences explaining the resource and how to use it
        - latOffset: Small latitude offset from user location (0.001-0.02 degrees, can be negative)
        - lngOffset: Small longitude offset from user location (0.001-0.02 degrees, can be negative)
        - reasoning: Why this suggestion is relevant to the current weather

        Respond as JSON: {"suggestions": [...], "summary": "one-line overview"}
        """
    }

    /// Convert a WeatherSuggestion into a POI that can be added to the map.
    static func suggestionToPoi(_ suggestion: WeatherSuggestion, userLocation: Coordinates) -> POI {
        let category: POICategory
        switch suggestion.category.lowercased() {
        case "water": category = .water
        case "shelter": category = .shelter
        case "hazard": category = .hazard
        case "rally_point": category = .rallyPoint
        case "supply_cache": category = .supplyCache
        default: category = .weatherResource
        }

        return POI(
            id: suggestion.id,
            name: suggestion.title,
            category: category,
            coordinates: Coordinates(
                latitude: userLocation.latitude + suggestion.latOffset,
                longitude: userLocation.longitude + suggestion.lngOffset
            ),
            notes: "\(suggestion.description)\n\nReason: \(suggestion.reasoning)",
            createdAt: ISO8601DateFormatter().string(from: Date())
        )
    }
}
