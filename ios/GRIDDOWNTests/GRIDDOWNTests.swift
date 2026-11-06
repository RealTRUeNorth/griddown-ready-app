import Testing
import Foundation
@testable import GRIDDOWN

private let formatter = ISO8601DateFormatter()

private func iso(_ date: Date) -> String {
    formatter.string(from: date)
}

private func hoursAgo(_ hours: Double, from now: Date) -> String {
    iso(now.addingTimeInterval(-hours * 3600))
}

private func member(lastCheckInAt: String?) -> GroupMember {
    GroupMember(
        id: "m1",
        name: "Test Member",
        role: "Scout",
        skills: [],
        status: .ready,
        phone: nil,
        notes: nil,
        location: nil,
        locationUpdatedAt: nil,
        lastCheckInAt: lastCheckInAt
    )
}

// MARK: - Check-in cadence math

@MainActor
struct CheckInStateTests {
    private let now = formatter.date(from: "2026-11-06T12:00:00Z")!

    @Test func neverWhenNoCheckIn() {
        #expect(CheckIn.state(for: member(lastCheckInAt: nil), intervalHours: 4, now: now) == .never)
    }

    @Test func neverOnInvalidTimestamp() {
        #expect(CheckIn.state(for: member(lastCheckInAt: "not-a-date"), intervalHours: 4, now: now) == .never)
    }

    @Test func currentWithin75Percent() {
        // 2h elapsed of a 4h interval (50%) is still current.
        let m = member(lastCheckInAt: hoursAgo(2, from: now))
        #expect(CheckIn.state(for: m, intervalHours: 4, now: now) == .current)
    }

    @Test func dueSoonAt75Percent() {
        // 3.5h elapsed of a 4h interval (87.5%) is due soon.
        let m = member(lastCheckInAt: hoursAgo(3.5, from: now))
        #expect(CheckIn.state(for: m, intervalHours: 4, now: now) == .dueSoon)
    }

    @Test func overdueAtFullInterval() {
        let m = member(lastCheckInAt: hoursAgo(4, from: now))
        #expect(CheckIn.state(for: m, intervalHours: 4, now: now) == .overdue)
    }

    @Test func timeSinceFormatting() {
        #expect(CheckIn.timeSince(iso(now.addingTimeInterval(-30)), now: now) == "Just now")
        #expect(CheckIn.timeSince(iso(now.addingTimeInterval(-5 * 60)), now: now) == "5m ago")
        #expect(CheckIn.timeSince(iso(now.addingTimeInterval(-3 * 3600)), now: now) == "3h ago")
        #expect(CheckIn.timeSince(iso(now.addingTimeInterval(-48 * 3600)), now: now) == "2d ago")
        #expect(CheckIn.timeSince(iso(now.addingTimeInterval(60)), now: now) == "Just now")
        #expect(CheckIn.timeSince(nil, now: now) == "Never")
        #expect(CheckIn.timeSince("garbage", now: now) == "Never")
    }

    @Test func overdueByFormatting() {
        let fresh = member(lastCheckInAt: hoursAgo(2, from: now))
        #expect(CheckIn.overdueBy(fresh, intervalHours: 4, now: now) == nil)

        let overdue = member(lastCheckInAt: hoursAgo(4.5, from: now))
        #expect(CheckIn.overdueBy(overdue, intervalHours: 4, now: now) == "30m overdue")

        let never = member(lastCheckInAt: nil)
        #expect(CheckIn.overdueBy(never, intervalHours: 4, now: now) == nil)
    }
}

// MARK: - Supply expiry parsing

@MainActor
struct ParseExpiryTests {
    // parseExpiry parses in the device's local timezone — mirror that here.
    private let dayFormatter = DateFormatter()

    init() {
        dayFormatter.dateFormat = "yyyy-MM-dd"
        dayFormatter.locale = Locale(identifier: "en_US_POSIX")
        dayFormatter.timeZone = TimeZone.current
    }

    @Test func parsesFullDate() {
        let parsed = NotificationsService.parseExpiry("2026-12-15")
        #expect(parsed == dayFormatter.date(from: "2026-12-15"))
    }

    @Test func monthOnlyExpiresStartOfNextMonth() {
        let parsed = NotificationsService.parseExpiry("2026-12")
        #expect(parsed == dayFormatter.date(from: "2027-01-01"))
    }

    @Test func invalidInputsReturnNil() {
        #expect(NotificationsService.parseExpiry("garbage") == nil)
        #expect(NotificationsService.parseExpiry("") == nil)
        #expect(NotificationsService.parseExpiry("2026-13-45") == nil)
    }
}

// MARK: - Ops backup round trip

@MainActor
struct OpsBackupTests {
    @Test func exportImportRoundTripPreservesData() {
        let source = AppStore()
        guard let json = source.exportOpsBackup() else {
            Issue.record("Export failed")
            return
        }

        #expect(source.opsBackupSummary(json) != nil)

        let target = AppStore()
        let ok = target.importOpsBackup(json)
        #expect(ok)
        #expect(target.members.count == source.members.count)
        #expect(target.supplies.count == source.supplies.count)
        #expect(target.checklists.count == source.checklists.count)
        #expect(target.groupName == source.groupName)
        #expect(target.alertLevel == source.alertLevel)
    }

    @Test func importRejectsInvalidPayload() {
        let store = AppStore()
        #expect(store.importOpsBackup("not json at all") == false)
        #expect(store.opsBackupSummary("{\"type\":\"something-else\"}") == nil)
    }
}

// MARK: - Deep links

struct DeepLinkTests {
    @Test func routesWidgetURLs() {
        #expect(DeepLink.route(for: URL(string: "griddown://status")!) == .status)
        #expect(DeepLink.route(for: URL(string: "griddown://supplies")!) == .supplies)
    }

    @Test func ignoresForeignSchemes() {
        #expect(DeepLink.route(for: URL(string: "https://supplies")!) == nil)
        #expect(DeepLink.route(for: URL(string: "mailto:someone@example.com")!) == nil)
    }

    @Test func routesNotificationIdentifiers() {
        #expect(DeepLink.route(forNotificationIdentifier: "griddown.supply.water-bottle") == .supplies)
        #expect(DeepLink.route(forNotificationIdentifier: "griddown.checkin.reminder") == .status)
        #expect(DeepLink.route(forNotificationIdentifier: "griddown.storm.abc") == .status)
    }
}

// MARK: - Tile math

struct TileMathTests {
    @Test func longitudeMapsToTileX() {
        #expect(TileMath.lngToTileX(0, 0) == 0.5)
        #expect(TileMath.lngToTileX(0, 1) == 1.0)
        #expect(TileMath.lngToTileX(-180, 2) == 0.0)
        #expect(TileMath.lngToTileX(180, 2) == 4.0)
    }

    @Test func equatorMapsToMiddleTileY() {
        #expect(abs(TileMath.latToTileY(0, 1) - 1.0) < 0.0001)
    }

    @Test func boundsClampToWorld() {
        let b = TileMath.bounds(centerLat: 89, centerLon: 200, spanLat: 20, spanLon: 20)
        #expect(b.maxLat <= 85.0511)
        #expect(b.maxLon <= 180)
    }

    @Test func tileCountMatchesRanges() {
        // A box strictly inside a single z2 tile (away from the equator,
        // which is a tile boundary).
        let bounds = TileMath.Bounds(minLat: 0.1, maxLat: 0.9, minLon: 0.1, maxLon: 0.9)
        let ranges = TileMath.tileRanges(bounds, zooms: [2])
        #expect(TileMath.tileCount(ranges) == 1)
    }

    @Test func fileNameAndURL() {
        #expect(TileMath.fileName(12, 3, 4) == "12_3_4.png")
        let url = TileMath.tileURL(12, 3, 4)
        #expect(url?.absoluteString == "https://tile.openstreetmap.org/12/3/4.png")
    }
}
