import type { Place } from '../data/places';
import type { GeoPoint } from '../data/geolocation';

export type CampusMapProps = {
  onSelect: (place: Place) => void;
  selectedId?: number | null;
  focusedId?: number | null;
  routeIds?: number[];
  showPassages?: boolean;
  showConnections?: boolean;
  gpsOrigin?: GeoPoint | null;
  gpsNearestId?: number | null;
  routeCoordinates?: GeoPoint[];
};
