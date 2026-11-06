import SwiftUI

struct ContentView: View {
    @State private var appStore = AppStore()
    @State private var downloadManager = KiwixDownloadManager()
    @State private var tileManager = TileDownloadManager()
    @State private var motionService = MotionService()
    @State private var showingShakeSos = false
    @State private var lock = BiometricLockService.shared
    @Environment(\.scenePhase) private var scenePhase
    @AppStorage("griddown_onboarding_complete") private var onboardingComplete = false

    @State private var selectedTab = 0
    @State private var statusPath = NavigationPath()
    @State private var prepPath = NavigationPath()

    var body: some View {
        ZStack {
        TabView(selection: $selectedTab) {
            NavigationStack(path: $statusPath) {
                StatusView()
                    .navigationDestination(for: NavRoute.self) { route in
                        routeView(route)
                    }
            }
            .tag(0)
            .tabItem {
                Image(systemName: "shield.fill")
                Text("Status")
            }

            NavigationStack(path: $prepPath) {
                PrepView()
                    .navigationDestination(for: NavRoute.self) { route in
                        routeView(route)
                    }
            }
            .tag(1)
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
            .tag(2)
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
            .tag(3)
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
            .tag(4)
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
                appStore.consumePendingWidgetAlertLevel()
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
        .onOpenURL { url in
            if let target = DeepLink.route(for: url) {
                handleRoute(target)
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .griddownDeepLink)) { note in
            guard let target = note.object as? DeepLink.Target else { return }
            handleRoute(target)
        }
        .fullScreenCover(isPresented: Binding(
            get: { !onboardingComplete },
            set: { onboardingComplete = !$0 }
        )) {
            OnboardingView()
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

    private func handleRoute(_ target: DeepLink.Target) {
        switch target {
        case .status:
            selectedTab = 0
        case .supplies:
            selectedTab = 1
            prepPath.append(NavRoute.supplies)
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
