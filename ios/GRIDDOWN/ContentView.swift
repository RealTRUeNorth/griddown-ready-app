import SwiftUI

struct ContentView: View {
    @State private var appStore = AppStore()
    @State private var downloadManager = KiwixDownloadManager()
    @State private var tileManager = TileDownloadManager()
    @State private var motionService = MotionService()
    @State private var showingShakeSos = false
    @State private var lock = BiometricLockService.shared
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        ZStack {
        TabView {
            NavigationStack {
                StatusView()
                    .navigationDestination(for: NavRoute.self) { route in
                        routeView(route)
                    }
            }
            .tabItem {
                Image(systemName: "shield.fill")
                Text("Status")
            }

            NavigationStack {
                PrepView()
                    .navigationDestination(for: NavRoute.self) { route in
                        routeView(route)
                    }
            }
            .tabItem {
                Image(systemName: "shippingbox.fill")
                Text("Prep")
            }

            NavigationStack {
                MapView()
                    .navigationDestination(for: NavRoute.self) { route in
                        routeView(route)
                    }
            }
            .tabItem {
                Image(systemName: "map.fill")
                Text("Map")
            }

            NavigationStack {
                CommsView()
                    .navigationDestination(for: NavRoute.self) { route in
                        routeView(route)
                    }
            }
            .tabItem {
                Image(systemName: "antenna.radiowaves.left.and.right")
                Text("Comms")
            }

            NavigationStack {
                IntelView()
                    .navigationDestination(for: NavRoute.self) { route in
                        routeView(route)
                    }
            }
            .tabItem {
                Image(systemName: "book.fill")
                Text("Intel")
            }
        }

            if lock.isLocked {
                LockGateView(service: lock)
                    .transition(.opacity)
                    .zIndex(10)
            }
        }
        .tint(Theme.orange)
        .environment(appStore)
        .environment(downloadManager)
        .environment(tileManager)
        .preferredColorScheme(.dark)
        .onChange(of: scenePhase) { _, phase in
            switch phase {
            case .active:
                if let level = lock.consumeIntentAlertLevel() {
                    appStore.updateAlertLevel(level)
                }
            case .background:
                lock.lockIfNeeded()
            default:
                break
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .griddownIntentAlert)) { _ in
            if let level = lock.consumeIntentAlertLevel() {
                appStore.updateAlertLevel(level)
            }
        }
        .confirmationDialog(
            "Shake Detected",
            isPresented: $showingShakeSos,
            titleVisibility: .visible
        ) {
            Button("Set RED Alert", role: .destructive) {
                appStore.updateAlertLevel(.red)
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Set the group alert level to RED?")
        }
        .task(id: appStore.shakeSosEnabled) {
            motionService.onShake = { showingShakeSos = true }
            if appStore.shakeSosEnabled {
                motionService.start()
            } else {
                motionService.stop()
            }
        }
    }

    @ViewBuilder
    private func routeView(_ route: NavRoute) -> some View {
        switch route {
        case .weather:
            WeatherView()
        case .supplies:
            SuppliesView()
        case .checklists:
            ChecklistsView()
        case .checklistDetail(let id):
            if let cl = appStore.checklists.first(where: { $0.id == id }) {
                ChecklistDetailView(checklist: cl)
            }
        case .group:
            GroupView()
        case .library:
            LibraryView()
        case .guides:
            GuidesView()
        case .guideDetail(let id):
            if let guide = MockData.guides.first(where: { $0.id == id }) {
                GuideDetailView(guide: guide)
            }
        case .memberDetail(let id):
            if let member = appStore.members.first(where: { $0.id == id }) {
                MemberDetailView(member: member)
            }
        case .resourceDetail(let id):
            if let res = (appStore.kiwixLibrary.first(where: { $0.id == id }) ?? MockData.kiwixCatalog.first(where: { $0.id == id })) {
                ResourceDetailView(resource: res)
            }
        case .settings:
            SettingsView()
        case .lantern:
            LanternView()
        case .helpFaq:
            HelpFaqView()
        case .legal:
            LegalView()
        }
    }
}

enum NavRoute: Hashable {
    case weather
    case supplies
    case checklists
    case checklistDetail(String)
    case group
    case library
    case guides
    case guideDetail(String)
    case memberDetail(String)
    case resourceDetail(String)
    case settings
    case lantern
    case helpFaq
    case legal
}
