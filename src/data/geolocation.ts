import { places, type Place } from './places';

export type GeoPoint = { latitude: number; longitude: number };
export type GpsOrigin = GeoPoint & {
  accuracyMeters: number | null;
  nearestNodeId: number;
  connectorMeters: number;
  capturedAt: number;
};

/** Distância em linha reta no elipsoide aproximado como esfera (Haversine). */
export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const lat1 = a.latitude * rad;
  const lat2 = b.latitude * rad;
  const q = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(q), Math.sqrt(Math.max(0, 1 - q)));
}

export function nearestGraphNode(point: GeoPoint, nodes: ReadonlyArray<Place> = places) {
  if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) return null;
  let nearest: Place | null = null;
  let distance = Infinity;
  for (const node of nodes) {
    const current = haversineMeters(point, node);
    if (current < distance) { nearest = node; distance = current; }
  }
  return nearest ? { node: nearest, meters: distance } : null;
}

// Não cria conexão automática a partir de outra cidade ou bairro.
export const MAX_CONNECTOR_METERS = 150;
// Um GPS com grande imprecisão pode escolher o corredor errado.
export const MAX_GPS_ACCURACY_METERS = 100;
