import { waypoints } from './waypoints';

// Normalização das coordenadas reais para uma visualização sem mapa-base.
// A conectividade entre pontos ainda precisa ser informada para calcular caminhos.
const lon = waypoints.map(p => p.longitude);
const lat = waypoints.map(p => p.latitude);
const minLon = Math.min(...lon);
const maxLon = Math.max(...lon);
const minLat = Math.min(...lat);
const maxLat = Math.max(...lat);

export type Place = {
  id: string; name: string; category: string; description: string;
  x: number; y: number; latitude: number; longitude: number;
};

export const places: Place[] = waypoints.map((p, index) => ({
  id: p.id,
  name: p.label === 'Portaria K' ? p.label : `Ponto ${p.label}`,
  category: p.label === 'Portaria K' ? 'Acesso' : 'Ponto de passagem',
  description: p.label === 'Portaria K'
    ? 'Acesso identificado no levantamento do campus.'
    : `Registro ${index + 1} do levantamento de caminhos e corredores.`,
  longitude: p.longitude,
  latitude: p.latitude,
  x: 6 + (p.longitude - minLon) / (maxLon - minLon) * 88,
  y: 6 + (maxLat - p.latitude) / (maxLat - minLat) * 88,
}));

export const findPlace = (id: string) => places.find(p => p.id === id);
