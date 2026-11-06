import graphData from './grafo-fho.json';

// O id de cada nó é o identificador CANÔNICO gerado pelo editor Python.
// source_id representa a coluna "nome" do CSV e não é único.
export type PlaceCategory = 'Portaria' | 'Bloco' | 'Alimentação' | 'Esporte' | 'Caminho';
export type Place = {
  id: number;
  sourceId: number;
  name: string;
  category: PlaceCategory;
  description: string;
  latitude: number;
  longitude: number;
  x: number;
  y: number;
};

function categoryFor(text: string): PlaceCategory {
  if (/portaria/i.test(text)) return 'Portaria';
  if (/bloco/i.test(text)) return 'Bloco';
  if (/cantina|restaurante|refeit[oó]rio/i.test(text)) return 'Alimentação';
  if (/quadra|poliesportivo|esporte/i.test(text)) return 'Esporte';
  return 'Caminho';
}

const nodes = graphData.nodes;
const minLng = Math.min(...nodes.map(n => n.lng));
const maxLng = Math.max(...nodes.map(n => n.lng));
const minLat = Math.min(...nodes.map(n => n.lat));
const maxLat = Math.max(...nodes.map(n => n.lat));

export const places: Place[] = nodes.map(node => {
  const description = node.description?.trim() ?? '';
  return {
    id: node.id,
    sourceId: node.source_id,
    name: description || `Ponto ${node.id}`,
    category: categoryFor(description),
    description: description || 'Ponto de passagem cadastrado no levantamento do campus.',
    latitude: node.lat,
    longitude: node.lng,
    x: 5 + (node.lng - minLng) / (maxLng - minLng || 1) * 90,
    y: 5 + (maxLat - node.lat) / (maxLat - minLat || 1) * 90,
  };
});

export const placesById = new Map(places.map(place => [place.id, place]));
export const destinations = places.filter(place => place.category !== 'Caminho');

export function findPlace(id: number | string | undefined | null): Place | undefined {
  if (id === undefined || id === null || String(id).trim() === '') return undefined;
  const parsed = Number(id);
  return Number.isInteger(parsed) ? placesById.get(parsed) : undefined;
}

export function placeLabel(place: Place): string {
  return place.category === 'Caminho' ? place.name : `${place.name} · ponto ${place.id}`;
}
