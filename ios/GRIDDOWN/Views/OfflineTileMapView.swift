import SwiftUI
import MapKit

final class PoiAnnotation: MKPointAnnotation {
    let poiID: String

    init(poi: POI) {
        self.poiID = poi.id
        super.init()
        self.coordinate = CLLocationCoordinate2D(latitude: poi.coordinates.latitude, longitude: poi.coordinates.longitude)
        self.title = poi.name
    }
}

final class UserDotAnnotation: MKPointAnnotation {}

/// MapKit map rendering a downloaded tile pack from local storage — used for
/// offline mode. Fully self-contained: no network requests are made.
struct OfflineTileMapView: UIViewRepresentable {
    let pack: MapPack
    let tileDirectory: URL
    let pois: [POI]
    let userLocation: Coordinates?
    let onSelectPoi: (POI) -> Void

    func makeUIView(context: Context) -> MKMapView {
        let map = MKMapView(frame: .zero)
        map.delegate = context.coordinator
        map.isRotateEnabled = false

        map.addOverlay(LocalTileOverlay(pack: pack), level: .aboveLabels)

        let spanLat = max(0.02, (pack.maxLat - pack.minLat) / 2)
        let spanLon = max(0.02, (pack.maxLon - pack.minLon) / 2)
        let centerLat = userLocation?.latitude ?? pack.centerLat
        let centerLon = userLocation?.longitude ?? pack.centerLon
        map.setRegion(
            MKCoordinateRegion(
                center: CLLocationCoordinate2D(latitude: centerLat, longitude: centerLon),
                span: MKCoordinateSpan(latitudeDelta: spanLat, longitudeDelta: spanLon)
            ),
            animated: false
        )

        context.coordinator.syncAnnotations(pois: pois, userLocation: userLocation, in: map)
        return map
    }

    func updateUIView(_ map: MKMapView, context: Context) {
        context.coordinator.onSelectPoi = onSelectPoi
        context.coordinator.syncAnnotations(pois: pois, userLocation: userLocation, in: map)
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(onSelectPoi: onSelectPoi)
    }

    @MainActor
    final class Coordinator: NSObject, MKMapViewDelegate {
        var onSelectPoi: (POI) -> Void
        private var poisById: [String: POI] = [:]

        init(onSelectPoi: @escaping (POI) -> Void) {
            self.onSelectPoi = onSelectPoi
        }

        func syncAnnotations(pois: [POI], userLocation: Coordinates?, in map: MKMapView) {
            var byId: [String: POI] = [:]
            for poi in pois { byId[poi.id] = poi }

            let existingPois = map.annotations.compactMap { $0 as? PoiAnnotation }
            let stale = existingPois.filter { byId[$0.poiID] == nil }
            map.removeAnnotations(stale)

            let existingIds = Set(map.annotations.compactMap { ($0 as? PoiAnnotation)?.poiID })
            for poi in pois where !existingIds.contains(poi.id) {
                map.addAnnotation(PoiAnnotation(poi: poi))
            }

            if let loc = userLocation {
                if let user = map.annotations.first(where: { $0 is UserDotAnnotation }) as? UserDotAnnotation {
                    user.coordinate = CLLocationCoordinate2D(latitude: loc.latitude, longitude: loc.longitude)
                } else {
                    let user = UserDotAnnotation()
                    user.coordinate = CLLocationCoordinate2D(latitude: loc.latitude, longitude: loc.longitude)
                    user.title = "You"
                    map.addAnnotation(user)
                }
            } else {
                let user = map.annotations.first(where: { $0 is UserDotAnnotation })
                if let user { map.removeAnnotation(user) }
            }
        }

        func mapView(_ mapView: MKMapView, viewFor annotation: MKAnnotation) -> MKAnnotationView? {
            if annotation is UserDotAnnotation {
                let identifier = "userDot"
                var view = mapView.dequeueReusableAnnotationView(withIdentifier: identifier)
                if view == nil {
                    view = MKAnnotationView(annotation: annotation, reuseIdentifier: identifier)
                    view?.frame = CGRect(x: 0, y: 0, width: 16, height: 16)
                    view?.backgroundColor = UIColor(red: 0.12, green: 0.53, blue: 0.9, alpha: 1)
                    view?.layer.cornerRadius = 8
                    view?.layer.borderWidth = 2
                    view?.layer.borderColor = UIColor.white.cgColor
                }
                view?.annotation = annotation
                return view
            }
            guard let ann = annotation as? PoiAnnotation,
                  let poi = poisById[ann.poiID] else { return nil }
            let identifier = "poiMarker"
            var view = mapView.dequeueReusableAnnotationView(withIdentifier: identifier) as? MKMarkerAnnotationView
            if view == nil {
                view = MKMarkerAnnotationView(annotation: ann, reuseIdentifier: identifier)
                view?.canShowCallout = true
            } else {
                view?.annotation = ann
            }
            view?.glyphImage = UIImage(systemName: poi.category.iconName)
            view?.markerTintColor = UIColor(poi.category.color)
            view?.displayPriority = .defaultHigh
            return view
        }

        func mapView(_ mapView: MKMapView, didSelect view: MKAnnotationView) {
            guard let ann = view.annotation as? PoiAnnotation,
                  let poi = poisById[ann.poiID] else { return }
            mapView.deselectAnnotation(ann, animated: false)
            onSelectPoi(poi)
        }

        func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
            if let tileOverlay = overlay as? LocalTileOverlay {
                return MKTileOverlayRenderer(tileOverlay: tileOverlay)
            }
            return MKOverlayRenderer(overlay: overlay)
        }
    }
}
