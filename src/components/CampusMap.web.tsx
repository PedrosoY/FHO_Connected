import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { graphEdges } from '../data/graph';
import { places, placesById } from '../data/places';
import type { CampusMapProps } from './mapTypes';

// No navegador, Leaflet é carregado após a montagem (compatível com SSR do Expo Router).
// O mapa-base usa OpenStreetMap. Não precisa de chave de API ou dependência npm extra.
const JS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
let leafletPromise: Promise<any> | null = null;

function loadLeaflet(): Promise<any> {
  if (typeof document === 'undefined') return Promise.reject(new Error('Mapa disponível apenas no navegador.'));
  const win = window as typeof window & { L?: any };
  if (win.L) return Promise.resolve(win.L);
  if (!leafletPromise) {
    leafletPromise = new Promise((resolve, reject) => {
      if (!document.querySelector('link[data-fho-leaflet]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet'; link.href = CSS_URL;
        link.setAttribute('data-fho-leaflet', 'true');
        document.head.appendChild(link);
      }
      const script = document.createElement('script');
      script.src = JS_URL;
      script.async = true;
      script.onload = () => win.L ? resolve(win.L) : reject(new Error('Leaflet não inicializou.'));
      script.onerror = () => reject(new Error('Não foi possível carregar o mapa. Verifique a internet.'));
      document.head.appendChild(script);
    }).catch(error => { leafletPromise = null; throw error; });
  }
  return leafletPromise;
}

const center: [number, number] = [
  (Math.min(...places.map(p => p.latitude)) + Math.max(...places.map(p => p.latitude))) / 2,
  (Math.min(...places.map(p => p.longitude)) + Math.max(...places.map(p => p.longitude))) / 2,
];

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);
}

export function CampusMap({
  onSelect, selectedId, focusedId, routeIds = [], showPassages = false, showConnections = false,
  gpsOrigin = null, gpsNearestId = null, routeCoordinates,
}: CampusMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const callbackRef = useRef(onSelect);
  const redrawRef = useRef<() => void>(() => {});
  const adjustViewportRef = useRef<() => void>(() => {});
  const [error, setError] = useState<string | null>(null);
  callbackRef.current = onSelect;

  redrawRef.current = () => {
    const L = LRef.current;
    const layer = layerRef.current;
    if (!L || !layer) return;
    layer.clearLayers();

    if (showConnections) {
      graphEdges.forEach(edge => {
        const a = placesById.get(edge.from)!;
        const b = placesById.get(edge.to)!;
        L.polyline([[a.latitude, a.longitude], [b.latitude, b.longitude]], {
          color: '#17815b', weight: 2, opacity: 0.45,
        }).addTo(layer);
      });
    }

    const path = routeCoordinates ?? routeIds.map(id => placesById.get(id)).filter(p => p !== undefined)
      .map(p => ({ latitude: p.latitude, longitude: p.longitude }));
    if (path.length > 1) {
      L.polyline(path.map(p => [p.latitude, p.longitude]), {
        color: '#1461DA', weight: 7, opacity: 0.95,
      }).addTo(layer);
    }

    if (gpsOrigin && gpsNearestId !== null && path.length < 2) {
      const nearest = placesById.get(gpsNearestId);
      if (nearest) L.polyline([[gpsOrigin.latitude, gpsOrigin.longitude], [nearest.latitude, nearest.longitude]], {
        color: '#1769e0', weight: 3, opacity: 0.8, dashArray: '6,5',
      }).addTo(layer);
    }
    if (gpsOrigin) {
      L.circleMarker([gpsOrigin.latitude, gpsOrigin.longitude], {
        radius: 9, color: '#fff', weight: 3, fillColor: '#1769e0', fillOpacity: 1,
      }).bindTooltip('Sua localização (GPS)').addTo(layer);
    }
    places.filter(p => showPassages || p.category !== 'Caminho' || p.id === selectedId || p.id === gpsNearestId || routeIds.includes(p.id))
      .forEach(p => {
        const selected = p.id === selectedId;
        const notable = p.category !== 'Caminho';
        L.circleMarker([p.latitude, p.longitude], {
          radius: selected ? 9 : notable ? 6.5 : 4,
          color: '#fff', weight: selected ? 3 : 1,
          fillColor: selected ? '#F29A23' : notable ? '#D35A30' : '#13795B', fillOpacity: 0.95,
        }).bindTooltip(`${escapeHtml(p.name)} · nó ${p.id}`)
          .on('click', () => callbackRef.current(p)).addTo(layer);
      });
  };

  adjustViewportRef.current = () => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    const route = routeCoordinates ?? routeIds.map(id => placesById.get(id)).filter(p => p !== undefined)
      .map(p => ({ latitude: p.latitude, longitude: p.longitude }));
    if (route.length > 1) {
      map.fitBounds(L.latLngBounds(route.map(p => [p.latitude, p.longitude])), { padding: [90, 90], animate: true });
    } else if (gpsOrigin) {
      map.setView([gpsOrigin.latitude, gpsOrigin.longitude], 18, { animate: true });
    } else if (focusedId !== undefined && focusedId !== null) {
      const focused = placesById.get(focusedId);
      if (focused) map.setView([focused.latitude, focused.longitude], 18, { animate: true });
    }
  };

  useEffect(() => {
    let active = true;
    loadLeaflet().then(L => {
      if (!active || !containerRef.current) return;
      LRef.current = L;
      const map = L.map(containerRef.current, { zoomControl: true }).setView(center, 17);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 20, maxNativeZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      const bounds = L.latLngBounds(places.map(p => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [24, 24] });
      redrawRef.current();
      adjustViewportRef.current();
    }).catch((e: Error) => { if (active) setError(e.message); });
    return () => {
      active = false;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      LRef.current = null;
    };
  }, []);

  const routeKey = (routeCoordinates ?? routeIds.map(id => placesById.get(id)).filter(p => p !== undefined)).map(p => `${p.latitude.toFixed(6)},${p.longitude.toFixed(6)}`).join('|');
  useEffect(() => { redrawRef.current(); }, [selectedId, showPassages, showConnections, routeKey, gpsOrigin?.latitude, gpsOrigin?.longitude]);
  useEffect(() => {
    adjustViewportRef.current();
  }, [focusedId, routeKey, gpsOrigin?.latitude, gpsOrigin?.longitude]);

  return <View style={{ flex: 1, minHeight: 350, overflow: 'hidden', backgroundColor: '#e0ede6' }}>
    <div ref={containerRef} aria-label="Mapa interativo com pontos do campus FHO"
      style={{ height: '100%', width: '100%', position: 'relative', zIndex: 0 }} />
    {error ? <Text style={{ position: 'absolute', top: 18, left: 16, right: 16, color: '#8a241b', backgroundColor: 'white', padding: 12 }}>{error}</Text> : null}
  </View>;
}
