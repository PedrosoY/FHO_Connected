import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { graphEdges } from '../data/graph';
import { places, placesById } from '../data/places';
import type { CampusMapProps } from './mapTypes';

const lats = places.map(p => p.latitude);
const lngs = places.map(p => p.longitude);
const initialRegion = {
  latitude: (Math.max(...lats) + Math.min(...lats)) / 2,
  longitude: (Math.max(...lngs) + Math.min(...lngs)) / 2,
  latitudeDelta: (Math.max(...lats) - Math.min(...lats)) * 1.35,
  longitudeDelta: (Math.max(...lngs) - Math.min(...lngs)) * 1.35,
};
const asCoordinate = (id: number) => {
  const p = placesById.get(id)!;
  return { latitude: p.latitude, longitude: p.longitude };
};

export function CampusMap({
  onSelect, selectedId, focusedId, routeIds = [], showPassages = false, showConnections = false,
  gpsOrigin = null, gpsNearestId = null, routeCoordinates,
}: CampusMapProps) {
  const mapRef = useRef<MapView>(null);
  const coordinates = routeCoordinates ?? routeIds.map(id => placesById.get(id)).filter(p => p !== undefined)
    .map(p => ({ latitude: p.latitude, longitude: p.longitude }));
  const routeKey = coordinates.map(p => `${p.latitude.toFixed(6)},${p.longitude.toFixed(6)}`).join('|');

  const adjustCamera = () => {
    if (coordinates.length > 1) {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 140, left: 48, right: 48, bottom: 250 }, animated: true,
      });
    } else if (gpsOrigin) {
      mapRef.current?.animateToRegion({ ...gpsOrigin, latitudeDelta: 0.001, longitudeDelta: 0.001 }, 400);
    } else if (focusedId !== null && focusedId !== undefined && placesById.has(focusedId)) {
      mapRef.current?.animateToRegion({ ...asCoordinate(focusedId), latitudeDelta: 0.001, longitudeDelta: 0.001 }, 400);
    }
  };
  useEffect(() => { adjustCamera(); }, [focusedId, routeKey, gpsOrigin?.latitude, gpsOrigin?.longitude]);

  return <View style={styles.wrapper} accessibilityLabel="Mapa interativo da FHO">
    <MapView ref={mapRef} onMapReady={adjustCamera} style={StyleSheet.absoluteFill} initialRegion={initialRegion} mapType="standard" showsCompass>
      {showConnections ? graphEdges.map(edge => (
        <Polyline key={`e-${edge.from}-${edge.to}`} coordinates={[asCoordinate(edge.from), asCoordinate(edge.to)]}
          strokeColor="rgba(14,105,77,0.35)" strokeWidth={2} />
      )) : null}
      {gpsOrigin && gpsNearestId !== null && coordinates.length < 2 ? <Polyline
        coordinates={[gpsOrigin, asCoordinate(gpsNearestId)]} strokeColor="#1769e0" strokeWidth={4}
        lineDashPattern={[6, 5]} /> : null}
      {coordinates.length > 1 ? <Polyline coordinates={coordinates} strokeColor="#1461DA" strokeWidth={6} /> : null}
      {gpsOrigin ? <Marker coordinate={gpsOrigin} title="Sua localização" description="Origem temporária obtida pelo GPS">
        <View style={styles.gpsHalo}><View style={styles.gpsDot} /></View>
      </Marker> : null}
      {places.filter(p => showPassages || p.category !== 'Caminho' || p.id === selectedId || p.id === gpsNearestId || routeIds.includes(p.id)).map(p => (
        <Marker key={p.id} coordinate={{ latitude: p.latitude, longitude: p.longitude }}
          title={`${p.name} (nó ${p.id})`} description={p.category}
          pinColor={p.id === selectedId ? '#F29A23' : p.category !== 'Caminho' ? '#D35A30' : '#13795B'}
          onPress={() => onSelect(p)} />
      ))}
    </MapView>
  </View>;
}

const styles = StyleSheet.create({ wrapper: { flex: 1, overflow: 'hidden', backgroundColor: '#d7e7df' }, gpsHalo: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(23,105,224,0.22)', alignItems: 'center', justifyContent: 'center' }, gpsDot: { width: 15, height: 15, borderRadius: 8, backgroundColor: '#1769e0', borderWidth: 3, borderColor: '#fff' } });
