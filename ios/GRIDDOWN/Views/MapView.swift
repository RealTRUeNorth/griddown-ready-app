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
