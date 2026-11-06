// Fallback sem serviços de mapa (para plataformas além de Android/iOS/Web).
// Android/iOS usam CampusMap.native.tsx; Web usa CampusMap.web.tsx.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { graphEdges } from '../data/graph';
import { places, placesById } from '../data/places';
import type { CampusMapProps } from './mapTypes';

export function CampusMap({ onSelect, selectedId, routeIds = [], showPassages = false, showConnections = false, gpsOrigin, gpsNearestId }: CampusMapProps) {
  return <View style={styles.map}>
    {showConnections ? <Text style={styles.caption}>{graphEdges.length} ligações cadastradas · mapa esquemático</Text> : null}
    {places.filter(p => showPassages || p.category !== 'Caminho' || p.id === selectedId || p.id === gpsNearestId || routeIds.includes(p.id)).map(p => (
      <Pressable key={p.id} onPress={() => onSelect(p)} accessibilityLabel={`Selecionar ${p.name}`}
        style={[styles.pin, { left: `${p.x}%`, top: `${p.y}%`, backgroundColor: selectedId === p.id ? '#F29A23' : p.category === 'Caminho' ? '#13795B' : '#D35A30' }]} />
    ))}
    {gpsOrigin ? <View style={[styles.pin, { left: `${5 + (gpsOrigin.longitude - Math.min(...places.map(p=>p.longitude))) / (Math.max(...places.map(p=>p.longitude)) - Math.min(...places.map(p=>p.longitude))) * 90}%`, top: `${5 + (Math.max(...places.map(p=>p.latitude)) - gpsOrigin.latitude) / (Math.max(...places.map(p=>p.latitude)) - Math.min(...places.map(p=>p.latitude))) * 90}%`, backgroundColor: '#1769e0', width: 18, height: 18, borderRadius: 9 }]} /> : null}
    {routeIds.length ? <Text style={[styles.caption, { bottom: 6, top: undefined }]}>Rota calculada: {routeIds.map(id => placesById.get(id)?.id).join(' → ')}</Text> : null}
  </View>;
}
const styles = StyleSheet.create({
  map: { flex: 1, minHeight: 350, position: 'relative', backgroundColor: '#dfeee6', overflow: 'hidden' },
  pin: { position: 'absolute', marginLeft: -6, marginTop: -6, height: 12, width: 12, borderRadius: 6, borderWidth: 1, borderColor: '#fff' },
  caption: { color: '#153b36', position: 'absolute', top: 8, left: 8, fontWeight: '700', fontSize: 11 },
});
