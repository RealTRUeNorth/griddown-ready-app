import Foundation

/// Slippy-map tile math for offline map packs. Tiles are standard
/// web-mercator PNGs (256×256) named `${z}_${x}_${y}.png`, matching
/// https://tile.openstreetmap.org/{z}/{x}/{y}.png.
nonisolated enum TileMath {
    static let offlineZooms = [12, 13, 14, 15]
    static let maxTilesPerPack = 6000
    static let avgTileBytes: Int64 = 20 * 1024
    static let tileSize: Double = 256

    struct Bounds: Sendable {
        let minLat: Double
        let maxLat: Double
        let minLon: Double
        let maxLon: Double
    }

    struct TileRange: Sendable {
        let z: Int
        let xMin: Int
        let xMax: Int
        let yMin: Int
        let yMax: Int
    }

    /// Geographic bounds for a camera region, expanded by a margin so the
    /// pack covers panning slightly past the viewport.
    static func bounds(centerLat: Double, centerLon: Double, spanLat: Double, spanLon: Double, margin: Double = 1.4) -> Bounds {
        let halfLat = abs(spanLat) * margin / 2
        let halfLon = abs(spanLon) * margin / 2
        return Bounds(
            minLat: max(-85.0511, centerLat - halfLat),
            maxLat: min(85.0511, centerLat + halfLat),
            minLon: max(-180, centerLon - halfLon),
            maxLon: min(180, centerLon + halfLon)
        )
    }

    static func lngToTileX(_ lon: Double, _ z: Int) -> Double {
        ((lon + 180) / 360) * pow(2, Double(z))
    }

    static func latToTileY(_ lat: Double, _ z: Int) -> Double {
        let clamped = max(-85.0511, min(85.0511, lat))
        let rad = clamped * .pi / 180
        return ((1 - log(tan(rad) + 1 / cos(rad)) / .pi) / 2) * pow(2, Double(z))
    }

    static func tileRanges(_ bounds: Bounds, zooms: [Int]) -> [TileRange] {
        zooms.map { z in
            let n = pow(2, Double(z))
            return TileRange(
                z: z,
                xMin: max(0, Int(floor(lngToTileX(bounds.minLon, z)))),
                xMax: min(Int(n) - 1, Int(floor(lngToTileX(bounds.maxLon, z)))),
                yMin: max(0, Int(floor(latToTileY(bounds.maxLat, z)))),
                yMax: min(Int(n) - 1, Int(floor(latToTileY(bounds.minLat, z))))
            )
        }
    }

    static func tileCount(_ ranges: [TileRange]) -> Int {
        ranges.reduce(0) { $0 + ($1.xMax - $1.xMin + 1) * ($1.yMax - $1.yMin + 1) }
    }

    static func fileName(_ z: Int, _ x: Int, _ y: Int) -> String {
        "\(z)_\(x)_\(y).png"
    }

    static func tileURL(_ z: Int, _ x: Int, _ y: Int) -> URL? {
        URL(string: "https://tile.openstreetmap.org/\(z)/\(x)/\(y).png")
    }
}
