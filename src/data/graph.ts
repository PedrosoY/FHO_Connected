import graphData from './grafo-fho.json';
import { placesById } from './places';

export type Neighbor = { node: number; weight_m: number };
export type RouteResult = { ids: number[]; meters: number; segments: number };

// Grafo não direcionado e ponderado, exportado do editor GraFHO.
// NÃO presumir ligação entre IDs consecutivos: o JSON define as arestas reais.
export const adjacency: Map<number, ReadonlyArray<Neighbor>> = new Map(
  Object.entries(graphData.adjacency).map(([id, neighbors]) => [Number(id), neighbors])
);

// Arestas únicas para desenhar o traçado da rede sem duplicar as duas direções.
export const graphEdges: ReadonlyArray<{ from: number; to: number; meters: number }> =
  [...adjacency.entries()].flatMap(([from, neighbors]) =>
    neighbors.filter(n => from < n.node).map(n => ({ from, to: n.node, meters: n.weight_m }))
  );

export const graphStats = {
  nodes: placesById.size,
  edges: graphEdges.length,
  weightMethod: graphData.weight_method,
};

export function getNeighbors(id: number): ReadonlyArray<Neighbor> {
  return adjacency.get(id) ?? [];
}

/** Dijkstra manual, sem bibliotecas de roteamento.
 * Pesos são os weight_m fornecidos pelo JSON, em metros (Haversine).
 * Complexidade O(V² + E), suficiente para o grafo pequeno do campus.
 */
export function shortestPath(start: number, finish: number): RouteResult | null {
  if (!adjacency.has(start) || !adjacency.has(finish)) return null;
  if (start === finish) return { ids: [start], meters: 0, segments: 0 };

  const distance = new Map<number, number>();
  const previous = new Map<number, number>();
  const unsettled = new Set<number>();

  for (const id of adjacency.keys()) {
    distance.set(id, Infinity);
    unsettled.add(id);
  }
  distance.set(start, 0);

  while (unsettled.size > 0) {
    // Localiza manualmente o vértice não visitado de menor distância.
    let current: number | undefined;
    let best = Infinity;
    for (const id of unsettled) {
      const d = distance.get(id)!;
      if (d < best) { best = d; current = id; }
    }
    if (current === undefined || best === Infinity) break;
    if (current === finish) break;
    unsettled.delete(current);

    for (const neighbor of getNeighbors(current)) {
      if (!unsettled.has(neighbor.node)) continue;
      const alternative = best + neighbor.weight_m;
      if (alternative < distance.get(neighbor.node)!) {
        distance.set(neighbor.node, alternative);
        previous.set(neighbor.node, current);
      }
    }
  }

  const total = distance.get(finish) ?? Infinity;
  if (!Number.isFinite(total)) return null;
  const ids = [finish];
  while (ids[0] !== start) {
    const parent = previous.get(ids[0]);
    if (parent === undefined) return null;
    ids.unshift(parent);
  }
  return { ids, meters: Math.round(total * 100) / 100, segments: ids.length - 1 };
}
