import SwiftUI
import MapKit

struct MapView: View {
    @Environment(AppStore.self) var store
    @Environment(TileDownloadManager.self) var tileManager
    @State private var cameraPosition: MapCameraPosition = .region(MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 39.8283, longitude: -98.5795),
        span: MKCoordinateSpan(latitudeDelta: 40, longitudeDelta: 40)
    ))
    @State private var showMembers = true
    @State private var showPois = true
    @State private var showRoutes = true
    @State private var showInfrastructure = true
    @State private var selectedPoi: POI?
    @State private var editingPoi: POI?
    @State private var pendingDeletePoi: POI?
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
    @State private var searchQuery: String = ""
    @State private var weatherIsCached = false
    @State private var weatherCachedAt: Date?
    @State private var showingNoRallyAlert = false
    @State private var showOfflineTiles = false
    @State private var cameraRegion: MKCoordinateRegion?
    @State private var showingPrepareConfirm = false
    @State private var pendingEstimate: TileDownloadManager.PackEstimate?
    @State private var pendingRegion: MKCoordinateRegion?

    private var offlinePack: MapPack? {
        if let loc = userLocation {
            return tileManager.packCovering(lat: loc.latitude, lon: loc.longitude)
        }
        if let region = cameraRegion {
            return tileManager.packCovering(lat: region.center.latitude, lon: region.center.longitude)
        }
        return nil
    }

    private var controlsColumn: some View {
        VStack(alignment: .trailing, spacing: 12) {
            if showLayers {
                layersPanel
                    .transition(.move(edge: .trailing).combined(with: .opacity))
            }
            VStack(spacing: 8) {
                rallyButton
                if showLayers {
                    addPoiButton
                    addRouteButton
                }
                layersToggleButton
            }
        }
    }

    private var rallyButton: some View {
        Button {
            navigateToNearestRally()
        } label: {
            Image(systemName: "flag.fill")
                .font(.system(size: 18))
                .foregroundStyle(.white)
                .frame(width: 48, height: 48)
                .background(Theme.statusGreen)
                .overlay(Circle().stroke(Theme.border, lineWidth: 1))
                .clipShape(Circle())
                .shadow(color: .black.opacity(0.3), radius: 4, x: 0, y: 2)
        }
    }

    private var addPoiButton: some View {
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
    }

    private var addRouteButton: some View {
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

    private var layersToggleButton: some View {
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

    @ViewBuilder
    private var mapContent: some View {
        if showOfflineTiles, let pack = offlinePack {
            OfflineTileMapView(
                pack: pack,
                tileDirectory: tileManager.tileDirectory(for: pack.id),
                pois: store.pois,
                userLocation: userLocation
            ) { poi in
                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                    selectedPoi = poi
                }
            }
            .ignoresSafeArea()
        } else {
            onlineMap
        }
    }

    private var onlineMap: some View {
        Map(position: $cameraPosition) {
            if showInfrastructure {
                ForEach(filteredInfrastructurePois) { poi in
                    Annotation(poi.name, coordinate: CLLocationCoordinate2D(latitude: poi.coordinates.latitude, longitude: poi.coordinates.longitude)) {
                        poiMarker(poi)
                    }
                }
            }
            if showPois {
                ForEach(filteredCustomPois) { poi in
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
        .onMapCameraChange(frequency: .onEnd) { context in
            cameraRegion = context.region
        }
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            mapContent

            // Layer drawer + add buttons
            controlsColumn
                .padding(20)

            // Search bar + results + weather banner (top area)
            VStack(spacing: 0) {
                searchBar
                if !searchQuery.isEmpty {
                    searchResultsList
                } else {
                    weatherBanner
                }
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
        .sheet(item: $editingPoi) { poi in
            AddPoiView(existing: poi)
        }
        .confirmationDialog(
            deletePoiTitle,
            isPresented: Binding(
                get: { pendingDeletePoi != nil },
                set: { if !$0 { pendingDeletePoi = nil } }
            ),
            titleVisibility: .visible
        ) {
            Button("Remove", role: .destructive) {
                if let poi = pendingDeletePoi {
                    withAnimation { selectedPoi = nil }
                    store.removePoi(poi.id)
                    UINotificationFeedbackGenerator().notificationOccurred(.warning)
                }
                pendingDeletePoi = nil
            }
            Button("Cancel", role: .cancel) { pendingDeletePoi = nil }
        }
        .task {
            await fetchWeatherForSuggestions()
        }
        .onAppear { OrientationGate.isMapActive = true }
        .onDisappear { OrientationGate.isMapActive = false }
        .alert("No Rally Points", isPresented: $showingNoRallyAlert) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("Add a rally point POI first to use rally navigation.")
        }
        .alert("Prepare Offline Map Pack", isPresented: $showingPrepareConfirm) {
            Button("Download") {
                if let region = pendingRegion {
                    tileManager.downloadPack(
                        name: "Area — \(Date.now.formatted(date: .abbreviated, time: .omitted))",
                        centerLat: region.center.latitude,
                        centerLon: region.center.longitude,
                        spanLat: region.span.latitudeDelta,
                        spanLon: region.span.longitudeDelta
                    )
                }
                pendingEstimate = nil
                pendingRegion = nil
            }
            Button("Cancel", role: .cancel) {
                pendingEstimate = nil
                pendingRegion = nil
            }
        } message: {
            Text(prepareAlertMessage)
        }
        .alert(
            "Map Download Error",
            isPresented: Binding(
                get: { tileManager.lastError != nil },
                set: { if !$0 { tileManager.clearError() } }
            )
        ) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(tileManager.lastError ?? "")
        }
    }

    private var deletePoiTitle: String {
        "Remove \"\(pendingDeletePoi?.name ?? "POI")\" from the map?"
    }

    private var prepareAlertMessage: String {
        let count = pendingEstimate?.tileCount ?? 0
        let size = TileDownloadManager.bytesLabel(pendingEstimate?.sizeBytes ?? 0)
        return "\(count) tiles (~\(size)) for the current view. Works with no signal once saved."
    }

    private func prepareOfflineArea() {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        let region = cameraRegion ?? MKCoordinateRegion(
            center: CLLocationCoordinate2D(
                latitude: userLocation?.latitude ?? 39.8283,
                longitude: userLocation?.longitude ?? -98.5795
            ),
            span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
        )
        pendingRegion = region
        pendingEstimate = tileManager.estimate(
            centerLat: region.center.latitude,
            centerLon: region.center.longitude,
            spanLat: region.span.latitudeDelta,
            spanLon: region.span.longitudeDelta
        )
        showingPrepareConfirm = true
    }

    // MARK: - Search

    private var isSearching: Bool { !searchQuery.isEmpty }

    private var filteredPois: [POI] {
        guard isSearching else { return store.pois }
        let q = searchQuery.lowercased()
        return store.pois.filter { poi in
            poi.name.lowercased().contains(q) ||
            poi.category.label.lowercased().contains(q) ||
            (poi.notes?.lowercased().contains(q) ?? false)
        }
    }

    private var filteredInfrastructurePois: [POI] {
        filteredPois.filter { $0.category.isInfrastructure }
    }

    private var filteredCustomPois: [POI] {
        filteredPois.filter { !$0.category.isInfrastructure }
    }

    @ViewBuilder
    private var searchBar: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 16))
                .foregroundStyle(Theme.textMuted)
            TextField("Search POIs by name or category...", text: $searchQuery)
                .font(.system(size: 14))
                .foregroundStyle(Theme.textPrimary)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
            if !searchQuery.isEmpty {
                Button {
                    searchQuery = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 16))
                        .foregroundStyle(Theme.textMuted)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(12)
        .background(Theme.bgCard)
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.border, lineWidth: 1))
        .clipShape(.rect(cornerRadius: 10))
    }

    @ViewBuilder
    private var searchResultsList: some View {
        let results = filteredPois
        VStack(alignment: .leading, spacing: 0) {
            if results.isEmpty {
                HStack {
                    Spacer()
                    Text("No POIs match \"\(searchQuery)\"")
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.textMuted)
                        .padding(.vertical, 20)
                    Spacer()
                }
            } else {
                ScrollView(.vertical, showsIndicators: false) {
                    VStack(spacing: 0) {
                        ForEach(results) { poi in
                            Button {
                                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                selectedPoi = poi
                                searchQuery = ""
                                withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                                    cameraPosition = .region(MKCoordinateRegion(
                                        center: CLLocationCoordinate2D(latitude: poi.coordinates.latitude, longitude: poi.coordinates.longitude),
                                        span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
                                    ))
                                }
                            } label: {
                                HStack(spacing: 10) {
                                    Circle()
                                        .fill(poi.category.color)
                                        .frame(width: 10, height: 10)
                                    VStack(alignment: .leading, spacing: 1) {
                                        Text(poi.name)
                                            .font(.system(size: 13, weight: .semibold))
                                            .foregroundStyle(Theme.textPrimary)
                                        Text(poi.category.label)
                                            .font(.system(size: 11))
                                            .foregroundStyle(Theme.textMuted)
                                    }
                                    Spacer()
                                    Image(systemName: "mappin")
                                        .font(.system(size: 12))
                                        .foregroundStyle(Theme.textMuted)
                                }
                                .padding(.horizontal, 14)
                                .padding(.vertical, 12)
                            }
                            .buttonStyle(.plain)
                            Divider().overlay(Theme.border)
                        }
                    }
                }
                .frame(maxHeight: 280)
            }
        }
        .background(Theme.bgCard)
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.border, lineWidth: 1))
        .clipShape(.rect(cornerRadius: 10))
        .padding(.top, 8)
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
                weatherIsCached = false
                WeatherCache.saveCurrent(wd, latitude: loc.latitude, longitude: loc.longitude)
                await loadSuggestions(for: wd, at: loc)
            }
        } catch {
            // Offline — fall back to the last cached conditions
            if let snapshot = WeatherCache.load() {
                weather = snapshot.current
                weatherIsCached = true
                weatherCachedAt = snapshot.savedAt
                await loadSuggestions(for: snapshot.current, at: loc)
            }
        }
    }

    private func loadSuggestions(for wd: WeatherData, at loc: Coordinates) async {
        if WeatherSuggestionsService.getWeatherTrigger(wd) != nil {
            showSuggestionsBanner = true
            suggestionsLoading = true
            let response = await WeatherSuggestionsService.fetchSuggestions(weather: wd, userLocation: loc)
            weatherSuggestions = response.suggestions
            weatherSummary = response.summary
            suggestionsLoading = false
        }
    }

    private func openDirections(to poi: POI) {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        let coordinate = CLLocationCoordinate2D(latitude: poi.coordinates.latitude, longitude: poi.coordinates.longitude)
        let mapItem = MKMapItem(placemark: MKPlacemark(coordinate: coordinate))
        mapItem.name = poi.name
        mapItem.openInMaps(launchOptions: [MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeDriving])
    }

    private func navigateToNearestRally() {
        let rallyPoints = store.pois.filter { $0.category == .rallyPoint }
        guard !rallyPoints.isEmpty else {
            showingNoRallyAlert = true
            return
        }
        var target = rallyPoints[0]
        if let loc = userLocation {
            var best = Double.greatestFiniteMagnitude
            for rp in rallyPoints {
                let dLat = rp.coordinates.latitude - loc.latitude
                let dLng = rp.coordinates.longitude - loc.longitude
                let dist = dLat * dLat + dLng * dLng
                if dist < best { best = dist; target = rp }
            }
        }
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        openDirections(to: target)
    }

    @ViewBuilder
    private var weatherBanner: some View {
        if showSuggestionsBanner, weather != nil {
            VStack(alignment: .leading, spacing: 0) {
                if weatherIsCached, let savedAt = weatherCachedAt {
                    HStack(spacing: 6) {
                        Image(systemName: "icloud.slash.fill")
                            .font(.system(size: 11))
                            .foregroundStyle(Theme.statusAmber)
                        Text("OFFLINE — CACHED \(WeatherCache.formatSavedAt(savedAt).uppercased())")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundStyle(Theme.statusAmber)
                    }
                    .padding(.horizontal, 12)
                    .padding(.top, 8)
                }
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

            offlineMapsSection
        }
        .padding(16)
        .background(Theme.bgCard)
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.border, lineWidth: 1))
        .clipShape(.rect(cornerRadius: 14))
        .shadow(color: .black.opacity(0.3), radius: 8, x: 0, y: 4)
    }

    @ViewBuilder
    private var offlineMapsSection: some View {
        Divider().overlay(Theme.border).padding(.vertical, 10)
        Text("OFFLINE MAPS")
            .font(.system(size: 11, weight: .bold))
            .tracking(2)
            .foregroundStyle(Theme.textMuted)
            .padding(.bottom, 6)
        if tileManager.isDownloading {
            offlineDownloadRow
        } else {
            prepareOfflineButton
        }
        ForEach(tileManager.packs) { pack in
            packRow(pack)
        }
        offlineTilesToggle
    }

    @ViewBuilder
    private var offlineDownloadRow: some View {
        HStack(spacing: 10) {
            ProgressView()
                .tint(Theme.orange)
                .scaleEffect(0.8)
            let percent = tileManager.tilesTotal > 0
                ? Int((Double(tileManager.tilesDone) / Double(tileManager.tilesTotal) * 100).rounded())
                : 0
            VStack(alignment: .leading, spacing: 2) {
                Text("Downloading… \(percent)%")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Theme.textPrimary)
                Text("\(tileManager.tilesDone)/\(tileManager.tilesTotal) tiles · \(TileDownloadManager.bytesLabel(tileManager.downloadedBytes))")
                    .font(.system(size: 10))
                    .foregroundStyle(Theme.textMuted)
            }
            Spacer()
            Button {
                tileManager.cancelDownload()
            } label: {
                Image(systemName: "stop.fill")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.statusRed)
            }
            .buttonStyle(.plain)
        }
        .padding(.vertical, 6)
    }

    private var prepareOfflineButton: some View {
        Button {
            prepareOfflineArea()
        } label: {
            HStack(spacing: 6) {
                Image(systemName: "square.and.arrow.down.fill")
                    .font(.system(size: 12, weight: .bold))
                Text("Prepare Offline Area")
                    .font(.system(size: 12, weight: .bold))
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(Theme.olive)
            .clipShape(.rect(cornerRadius: 8))
        }
        .buttonStyle(.plain)
        .padding(.vertical, 4)
    }

    private func packRow(_ pack: MapPack) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "square.stack.3d.down.forward")
                .font(.system(size: 13))
                .foregroundStyle(Theme.statusGreen)
            VStack(alignment: .leading, spacing: 1) {
                Text(pack.name)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Theme.textPrimary)
                    .lineLimit(1)
                Text("\(pack.tileCount) tiles · \(TileDownloadManager.bytesLabel(pack.sizeBytes))")
                    .font(.system(size: 10))
                    .foregroundStyle(Theme.textMuted)
            }
            Spacer()
            Button {
                tileManager.deletePack(pack)
            } label: {
                Image(systemName: "trash")
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.statusRed)
            }
            .buttonStyle(.plain)
        }
        .padding(.vertical, 5)
    }

    private var offlineTilesToggle: some View {
        let isOn = showOfflineTiles && offlinePack != nil
        return Button {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            showOfflineTiles.toggle()
        } label: {
            HStack(spacing: 8) {
                Image(systemName: "map.fill")
                    .font(.system(size: 16))
                    .foregroundStyle(isOn ? Theme.statusGreen : Theme.orange)
                Text(isOn ? "Offline Tiles: ON" : "Use Offline Tiles")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(offlinePack != nil ? Theme.textPrimary : Theme.textMuted)
                Spacer()
                Image(systemName: isOn ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 16))
                    .foregroundStyle(isOn ? Theme.statusGreen : Theme.border)
            }
            .padding(.vertical, 6)
        }
        .buttonStyle(.plain)
        .disabled(offlinePack == nil)
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
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    withAnimation { selectedPoi = nil }
                    editingPoi = poi
                } label: {
                    Image(systemName: "pencil")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(Theme.orangeLight)
                        .frame(width: 30, height: 30)
                        .background(Theme.bgElevated)
                        .clipShape(Circle())
                }
                Button {
                    pendingDeletePoi = poi
                } label: {
                    Image(systemName: "trash")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(Theme.statusRed)
                        .frame(width: 30, height: 30)
                        .background(Theme.bgElevated)
                        .clipShape(Circle())
                }
                Button {
                    withAnimation { selectedPoi = nil }
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(Theme.textMuted)
                        .frame(width: 30, height: 30)
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
            Button {
                openDirections(to: poi)
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "arrow.triangle.turn.up.right.diamond.fill")
                        .font(.system(size: 12, weight: .bold))
                    Text(poi.category == .rallyPoint ? "Navigate to Rally Point" : "Directions")
                        .font(.system(size: 12, weight: .bold))
                }
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 9)
                .background(poi.category == .rallyPoint ? Theme.statusGreen : Theme.olive)
                .clipShape(.rect(cornerRadius: 8))
            }
            .buttonStyle(.plain)
            .padding(.top, 4)
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
