import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import { HQ_COORDS } from '../data/zimbabweAreas';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon (vite doesn't bundle them correctly)
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const hqIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const clientIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 41"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 29 12 29s12-20 12-29C24 5.4 18.6 0 12 0z" fill="#F26522"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`),
  iconSize: [24, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function FitBounds({ hq, client }) {
  const map = useMap();
  useEffect(() => {
    if (client) {
      const bounds = L.latLngBounds([hq, client]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    } else {
      map.setView(hq, 6);
    }
  }, [map, hq, client]);
  return null;
}

export default function DistanceMap({ clientCoords, distanceKm, areaName }) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 mt-4 relative z-0" style={{ height: 220 }}>
      <MapContainer
        center={HQ_COORDS}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* HQ Marker */}
        <Marker position={HQ_COORDS} icon={hqIcon}>
          <Popup><strong>Taqon Electrico HQ</strong><br />Harare, Zimbabwe</Popup>
        </Marker>

        {/* Client Marker */}
        {clientCoords && (
          <Marker position={clientCoords} icon={clientIcon}>
            <Popup><strong>{areaName}</strong><br />{distanceKm}km from HQ</Popup>
          </Marker>
        )}

        {/* Line between HQ and client */}
        {clientCoords && (
          <Polyline
            positions={[HQ_COORDS, clientCoords]}
            pathOptions={{ color: '#F26522', weight: 3, dashArray: '8, 8', opacity: 0.8 }}
          />
        )}

        <FitBounds hq={HQ_COORDS} client={clientCoords} />
      </MapContainer>
    </div>
  );
}
