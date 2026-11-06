import fs from 'node:fs';
import { resolve } from 'node:path';

export function validateGraph(graph) {
  const errors = [];
  if (graph.directed !== false) errors.push('O aplicativo espera grafo não direcionado.');
  if (graph.weight_unit !== 'meters') errors.push('Os pesos devem estar em metros.');
  if (!Array.isArray(graph.nodes) || !graph.adjacency || typeof graph.adjacency !== 'object') {
    throw new Error('JSON inválido: nodes ou adjacency ausentes.');
  }
  const ids = graph.nodes.map(n => n.id);
  const unique = new Set(ids);
  if (unique.size !== ids.length) errors.push('Há IDs internos duplicados.');
  const coordsById = new Map(graph.nodes.map(n => [n.id, n]));
  let directedEdges = 0;
  for (const node of graph.nodes) {
    if (!Number.isInteger(node.id) || !Number.isFinite(node.lat) || !Number.isFinite(node.lng)) errors.push(`Coordenadas ou ID inválido: ${node.id}`);
    if (!Array.isArray(graph.adjacency[String(node.id)])) errors.push(`Adjacência ausente: ${node.id}`);
  }
  for (const [fromRaw, neighbors] of Object.entries(graph.adjacency)) {
    const from = Number(fromRaw);
    if (!unique.has(from)) errors.push(`Chave de nó inexistente: ${from}`);
    if (!Array.isArray(neighbors)) { errors.push(`Adjacência não é array: ${from}`); continue; }
    const already = new Set();
    for (const edge of neighbors) {
      directedEdges++;
      const to = edge.node;
      if (already.has(to)) errors.push(`Aresta duplicada: ${from} → ${to}`);
      already.add(to);
      if (from === to) errors.push(`Laço não permitido: ${from}`);
      if (!unique.has(to)) { errors.push(`Destino inexistente: ${from} → ${to}`); continue; }
      if (!(Number.isFinite(edge.weight_m) && edge.weight_m > 0)) errors.push(`Peso inválido: ${from} → ${to}`);
      const back = graph.adjacency[String(to)]?.find(e => e.node === from);
      if (!back) errors.push(`Falta conexão inversa: ${to} → ${from}`);
      else if (Math.abs(back.weight_m - edge.weight_m) > 0.001) errors.push(`Pesos diferentes: ${from} ↔ ${to}`);
    }
  }
  const visited = new Set();
  const queue = [ids[0]];
  while (queue.length) {
    const id = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    for (const edge of graph.adjacency[String(id)] || []) if (!visited.has(edge.node)) queue.push(edge.node);
  }
  return { errors, nodes: ids.length, edges: directedEdges / 2, connectedNodes: visited.size,
    components: visited.size === ids.length ? 1 : '>1', duplicateSourceIds: ids.length - new Set(graph.nodes.map(n => n.source_id)).size };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const path = resolve(process.argv[2] || 'src/data/grafo-fho.json');
  const result = validateGraph(JSON.parse(fs.readFileSync(path, 'utf8')));
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length) process.exitCode = 1;
}
