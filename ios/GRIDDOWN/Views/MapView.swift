import SwiftUI
import MapKit

struct MapView: View {
    @Environment(AppStore.self) var store
    @State private var cameraPosition: MapCameraPosition = .region(MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 39.8283, longitude: -98.5795),
        span: MKCoordinateSpan(latitudeDelta: 40, longitudeDelta: 40)
    ))
    @State private var showMembers = true
    @State private var showPois = true
    @State private var showRoutes = true
    @State private var showInfrastructure = true
    @State private var selectedPoi: POI?
    @State private var showLayers = false
    @State private var showingAddPoi = false
    @State private var showingAddRoute = false
    @State private var weather: WeatherData?
    @State private var userLocation: Coordinates?
    @State private var weatherSuggestions: [WeatherSuggestion] = []
    @State private var weatherSummary: String = ""
    @State private var suggestionsLoading = false
    @State private var showSuggestionsBanner = false
    @State private var addedSuggestionIds: Set<String> = []

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            Map(position: $cameraPosition) {
                if showInfrastructure {
                    ForEach(store.pois.filter { $0.category.isInfrastructure }) { poi in
                        Annotation(poi.name, coordinate: CLLocationCoordinate2D(latitude: poi.coordinates.latitude, longitude: poi.coordinates.longitude)) {
                            poiMarker(poi)
                        }
                    }
                }
                if showPois {
                    ForEach(store.pois.filter { !$0.category.isInfrastructure }) { poi in
                        Annotation(poi.name, coordinate: CLLocationCoordinate2D(latitude: poi.coordinates.latitude, longitude: poi.coordinates.longitude)) {
                            poiMarker(poi)
                        }
                    }
                }
                if showRoutes {
                    ForEach(store.routes) { route in
                        if route.waypoints.count >= 2 {
                            MapPolyline(coordinates: route.waypoints.map { CLLocationCoordinate2D(latitude: $0.latitude, longitude: $0.longitude) })
                                .stroke(Color(hexString: route.color) ?? Theme.orange, lineWidth: 3)
                        }
                    }
                }
                if showMembers {
                    ForEach(store.members) { member in
                        if let loc = member.location {
                            Annotation(member.name, coordinate: CLLocationCoordinate2D(latitude: loc.latitude, longitude: loc.longitude)) {
                                memberMarker(member)
                            }
                        }
                    }
                }
            }
            .mapStyle(.standard(elevation: .realistic))
            .mapControls {
                MapCompass()
                MapUserLocationButton()
                MapScaleView()
            }

            // Layer drawer + add buttons
            VStack(alignment: .trailing, spacing: 12) {
                if showLayers {
                    layersPanel
                        .transition(.move(edge: .trailing).combined(with: .opacity))
                }
                VStack(spacing: 8) {
                    if showLayers {
                        Button {
                            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                            showingAddPoi = true
                        } label: {
                            Image(systemName: "mappin.circle.badge.plus")
                                .font(.system(size: 20))
                                .foregroundStyle(Theme.orange)
                                .frame(width: 44, height: 44)
                                .background(Theme.bgCard)
                                .overlay(Circle().stroke(Theme.border, lineWidth: 1))
                                .clipShape(Circle())
                                .shadow(color: .black.opacity(0.3), radius: 4, x: 0, y: 2)
                        }
                        Button {
                            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                            showingAddRoute = true
                        } label: {
                            Image(systemName: "route")
                                .font(.system(size: 20))
                                .foregroundStyle(Theme.oliveLight)
                                .frame(width: 44, height: 44)
                                .background(Theme.bgCard)
                                .overlay(Circle().stroke(Theme.border, lineWidth: 1))
                                .clipShape(Circle())
                                .shadow(color: .black.opacity(0.3), radius: 4, x: 0, y: 2)
                        }
                    }
                    Button {
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                            showLayers.toggle()
                        }
                    } label: {
                        Image(systemName: showLayers ? "xmark" : "square.3.layers.3d.fill")
                            .font(.system(size: 20))
                            .foregroundStyle(Theme.orange)
                            .frame(width: 48, height: 48)
                            .background(Theme.bgCard)
                            .overlay(Circle().stroke(Theme.border, lineWidth: 1))
                            .clipShape(Circle())
                            .shadow(color: .black.opacity(0.3), radius: 4, x: 0, y: 2)
                    }
                }
            }
            .padding(20)

            // Weather suggestions banner (top-left)
            VStack(spacing: 0) {
                weatherBanner
                Spacer()
            }
            .padding(.top, 4)
            .padding(.horizontal, 12)
            .allowsHitTesting(true)

            if let poi = selectedPoi {
                poiDetailSheet(poi)
                    .transition(.move(edge: .bottom))
            }
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("Map")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showingAddPoi) {
            AddPoiView()
        }
        .sheet(isPresented: $showingAddRoute) {
            AddRouteView()
        }
        .task {
            await fetchWeatherForSuggestions()
        }
    }

    // MARK: - Weather Suggestions

    private func fetchWeatherForSuggestions() async {
        let loc = Coordinates(latitude: 39.8283, longitude: -98.5795)
        userLocation = loc
        let url = URL(string: "https://api.open-meteo.com/v1/forecast?latitude=\(loc.latitude)&longitude=\(loc.longitude)&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,is_day&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto")!
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let current = json["current"] as? [String: Any],
               let temp = current["temperature_2m"] as? Double,
               let humidity = current["relative_humidity_2m"] as? Double,
               let feelsLike = current["apparent_temperature"] as? Double,
               let precip = current["precipitation"] as? Double,
               let code = current["weather_code"] as? Int,
               let windSpeed = current["wind_speed_10m"] as? Double,
               let windDir = current["wind_direction_10m"] as? Double,
               let pressure = current["surface_pressure"] as? Double,
               let isDay = current["is_day"] as? Int {
                let wd = WeatherData(
                    temperature: temp, feelsLike: feelsLike, humidity: humidity,
                    windSpeed: windSpeed, windDirection: windDir, weatherCode: code,
                    precipitation: precip, pressure: pressure, isDay: isDay == 1,
                    updatedAt: ISO8601DateFormatter().string(from: Date())
                )
                weather = wd
                if WeatherSuggestionsService.getWeatherTrigger(wd) != nil {
                    showSuggestionsBanner = true
                    suggestionsLoading = true
                    let response = await WeatherSuggestionsService.fetchSuggestions(weather: wd, userLocation: loc)
                    weatherSuggestions = response.suggestions
                    weatherSummary = response.summary
                    suggestionsLoading = false
                }
            }
        } catch {
            // Silent fail — suggestions are optional
        }
    }

    @ViewBuilder
    private var weatherBanner: some View {
        if showSuggestionsBanner, weather != nil {
            VStack(alignment: .leading, spacing: 0) {
                // Header
                HStack(spacing: 10) {
                    Image(systemName: "cloud.rain.fill")
                        .font(.system(size: 16))
                        .foregroundStyle(Color(hex: 0x00BCD4))
                    VStack(alignment: .leading, spacing: 2) {
                        Text("WEATHER RESOURCE ALERT")
                            .font(.system(size: 11, weight: .bold))
                            .tracking(0.5)
                            .foregroundStyle(Color(hex: 0x00BCD4))
                        Text(suggestionsLoading ? "Analyzing conditions..." : weatherSummary)
                            .font(.system(size: 10))
                            .foregroundStyle(Theme.textSecondary)
                            .lineLimit(1)
                    }
                    Spacer()
                    if !suggestionsLoading && !weatherSuggestions.isEmpty {
                        Button {
                            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                            for s in weatherSuggestions where !addedSuggestionIds.contains(s.id) {
                                if let loc = userLocation {
                                    store.addPoi(WeatherSuggestionsService.suggestionToPoi(s, userLocation: loc))
                                    addedSuggestionIds.insert(s.id)
                                }
                            }
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: "plus").font(.system(size: 12, weight: .bold))
                                Text("Add All").font(.system(size: 11, weight: .bold))
                            }
                            .foregroundStyle(.white)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Theme.orange)
                            .clipShape(.rect(cornerRadius: 6))
                        }
                        .buttonStyle(.plain)
                    }
                    Button {
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        withAnimation { showSuggestionsBanner = false }
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(Theme.textMuted)
                    }
                    .buttonStyle(.plain)
                }
                .padding(12)

                // Suggestions list
                if suggestionsLoading {
                    HStack(spacing: 8) {
                        ProgressView().tint(Theme.orange).scaleEffect(0.8)
                        Text("Fetching tactical resource suggestions...")
                            .font(.system(size: 11))
                            .foregroundStyle(Theme.textSecondary)
                    }
                    .padding(.horizontal, 12)
                    .padding(.bottom, 12)
                } else if !weatherSuggestions.isEmpty {
                    ScrollView(.vertical, showsIndicators: false) {
                        VStack(spacing: 8) {
                            ForEach(weatherSuggestions) { s in
                                suggestionCard(s)
                            }
                        }
                        .padding(.horizontal, 12)
                        .padding(.bottom, 12)
                    }
                    .frame(maxHeight: 280)
                }
            }
            .background(Theme.bgCard)
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(hex: 0x00BCD4), lineWidth: 1))
            .clipShape(.rect(cornerRadius: 12))
        }
    }

    private func suggestionCard(_ s: WeatherSuggestion) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 8) {
                Image(systemName: suggestionIcon(s.category))
                    .font(.system(size: 14))
                    .foregroundStyle(suggestionColor(s.category))
                Text(s.title)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(Theme.textPrimary)
                Spacer()
                Text(s.category.uppercased().replacingOccurrences(of: "_", with: " "))
                    .font(.system(size: 8, weight: .bold))
                    .tracking(0.5)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(suggestionColor(s.category))
                    .clipShape(.rect(cornerRadius: 4))
            }
            Text(s.description)
                .font(.system(size: 11))
                .foregroundStyle(Theme.textSecondary)
                .lineLimit(3)
            Text("Why: \(s.reasoning)")
                .font(.system(size: 10))
                .italic()
                .foregroundStyle(Theme.textMuted)
                .lineLimit(2)
            Button {
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                if let loc = userLocation, !addedSuggestionIds.contains(s.id) {
                    store.addPoi(WeatherSuggestionsService.suggestionToPoi(s, userLocation: loc))
                    addedSuggestionIds.insert(s.id)
                }
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: addedSuggestionIds.contains(s.id) ? "checkmark.circle.fill" : "plus")
                        .font(.system(size: 12, weight: .bold))
                    Text(addedSuggestionIds.contains(s.id) ? "Added to Map" : "Add to Map")
                        .font(.system(size: 12, weight: .bold))
                }
                .foregroundStyle(addedSuggestionIds.contains(s.id) ? Theme.statusGreen : .white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(addedSuggestionIds.contains(s.id) ? Theme.bgElevated : Theme.orange)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(addedSuggestionIds.contains(s.id) ? Theme.statusGreen : .clear, lineWidth: 1)
                )
                .clipShape(.rect(cornerRadius: 8))
            }
            .buttonStyle(.plain)
        }
        .padding(12)
        .background(Theme.bg)
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.border, lineWidth: 1))
        .clipShape(.rect(cornerRadius: 10))
    }

    private func suggestionIcon(_ category: String) -> String {
        switch category.lowercased() {
        case "water": "drop.fill"
        case "shelter": "house.fill"
        case "hazard": "exclamationmark.triangle.fill"
        case "rally_point": "flag.fill"
        case "supply_cache": "shippingbox.fill"
        default: "cloud.rain.fill"
        }
    }

    private func suggestionColor(_ category: String) -> Color {
        switch category.lowercased() {
        case "water": Color(hex: 0x00BCD4)
        case "shelter": Theme.olive
        case "hazard": Theme.statusRed
        case "rally_point": Theme.statusGreen
        case "supply_cache": Theme.orange
        default: Color(hex: 0x00BCD4)
        }
    }

    private func poiMarker(_ poi: POI) -> some View {
        Button {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                selectedPoi = poi
            }
        } label: {
            VStack(spacing: 2) {
                Image(systemName: poi.category.iconName)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 32, height: 32)
                    .background(poi.category.color)
                    .overlay(Circle().stroke(.white, lineWidth: 2))
                    .clipShape(Circle())
                    .shadow(color: .black.opacity(0.3), radius: 2, x: 0, y: 1)
            }
        }
        .buttonStyle(.plain)
    }

    private func memberMarker(_ member: GroupMember) -> some View {
        VStack(spacing: 2) {
            Image(systemName: "person.fill")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 28, height: 28)
                .background(member.status.color)
                .overlay(Circle().stroke(.white, lineWidth: 2))
                .clipShape(Circle())
        }
    }

    private var layersPanel: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("LAYERS")
                .font(.system(size: 11, weight: .bold))
                .tracking(2)
                .foregroundStyle(Theme.textMuted)
                .padding(.bottom, 12)
            layerToggle("Infrastructure", icon: "building.2.fill", isOn: $showInfrastructure)
            layerToggle("Custom POIs", icon: "mappin.circle.fill", isOn: $showPois)
            layerToggle("Routes", icon: "route", isOn: $showRoutes)
            layerToggle("Members", icon: "person.2.fill", isOn: $showMembers)
        }
        .padding(16)
        .background(Theme.bgCard)
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.border, lineWidth: 1))
        .clipShape(.rect(cornerRadius: 14))
        .shadow(color: .black.opacity(0.3), radius: 8, x: 0, y: 4)
    }

    private func layerToggle(_ label: String, icon: String, isOn: Binding<Bool>) -> some View {
        Toggle(isOn: isOn) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.orange)
                Text(label)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Theme.textPrimary)
            }
        }
        .tint(Theme.orange)
        .padding(.vertical, 6)
    }

    private func poiDetailSheet(_ poi: POI) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: poi.category.iconName)
                    .font(.system(size: 22))
                    .foregroundStyle(.white)
                    .frame(width: 44, height: 44)
                    .background(poi.category.color)
                    .clipShape(.rect(cornerRadius: 12))
                VStack(alignment: .leading, spacing: 2) {
                    Text(poi.name)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(Theme.textPrimary)
                    Text(poi.category.label)
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.textSecondary)
                }
                Spacer()
                Button {
                    withAnimation { selectedPoi = nil }
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(Theme.textMuted)
                }
            }
            if let notes = poi.notes, !notes.isEmpty {
                Text(notes)
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.textSecondary)
            }
            Text(String(format: "%.4f°, %.4f°", poi.coordinates.latitude, poi.coordinates.longitude))
                .font(.system(size: 11))
                .foregroundStyle(Theme.textMuted)
        }
        .padding(16)
        .background(Theme.bgCard)
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.border, lineWidth: 1))
        .clipShape(.rect(cornerRadius: 14))
        .padding(16)
    }
}

extension Color {
    init?(hexString: String) {
        let hex = hexString.dropFirst()
        guard let value = UInt(hex, radix: 16) else { return nil }
        self.init(hex: value)
    }
}
