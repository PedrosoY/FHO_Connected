import fs from 'node:fs';
import { resolve } from 'node:path';
import { validateGraph } from './validate-graph.mjs';

const filepath = process.argv[2];
if (!filepath) {
  console.error('Uso: npm run sync:graph -- "C:\\caminho\\grafo-fho.json"');
  process.exit(1);
}
const graph = JSON.parse(fs.readFileSync(resolve(filepath), 'utf8'));
const summary = validateGraph(graph);
if (summary.errors.length) {
  console.error(summary.errors.join('\n'));
  process.exit(1);
}
const serialized = JSON.stringify(graph, null, 2) + '\n';
fs.writeFileSync('src/data/grafo-fho.json', serialized);
fs.writeFileSync('tools/editor_grafo_fho_python/grafo-fho.json', serialized);
console.log(`Grafo sincronizado: ${summary.nodes} nós, ${summary.edges} arestas, ${summary.connectedNodes} nós alcançáveis.`);
