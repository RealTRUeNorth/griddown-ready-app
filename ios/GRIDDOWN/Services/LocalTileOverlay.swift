import MapKit

/// MKTileOverlay that reads downloaded pack tiles from local storage.
/// Missing tiles return empty data so uncovered areas stay transparent.
final class LocalTileOverlay: MKTileOverlay {
    nonisolated private let packDirectory: URL

    init(pack: MapPack) {
        self.packDirectory = TileDownloadManager.mapsDirectory
            .appendingPathComponent(pack.id, isDirectory: true)
        super.init(urlTemplate: nil)
        self.tileSize = CGSize(width: 256, height: 256)
        self.minimumZ = pack.minZ
        self.maximumZ = pack.maxZ
    }

    override nonisolated func loadTile(
        at path: MKTileOverlayPath,
        result: @escaping (Data?, (any Error)?) -> Void
    ) {
        let url = packDirectory.appendingPathComponent(TileMath.fileName(path.z, path.x, path.y))
        if let data = try? Data(contentsOf: url), !data.isEmpty {
            result(data, nil)
        } else {
            result(Data(), nil)
        }
    }
}
