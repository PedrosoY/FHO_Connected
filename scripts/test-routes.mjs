import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const temp = mkdtempSync(join(tmpdir(), 'fho-dijkstra-'));
const compilerArguments = [
  'src/data/graph.ts', 'src/data/places.ts', '--module', 'Node16',
  '--moduleResolution', 'Node16', '--target', 'es2022', '--resolveJsonModule', '--esModuleInterop',
  '--outDir', temp, '--skipLibCheck', '--strict',
];
try {
  const windows = process.platform === 'win32';
  const compiler = spawnSync(windows ? 'cmd.exe' : 'tsc',
    windows ? ['/d', '/s', '/c', 'tsc', ...compilerArguments] : compilerArguments,
    { cwd: process.cwd(), encoding: 'utf8' });
  if (compiler.status !== 0) throw new Error(`Erro ao compilar grafo:\n${compiler.stdout}\n${compiler.stderr}`);
  const require = createRequire(import.meta.url);
  const { shortestPath, graphStats, getNeighbors } = require(join(temp, 'graph.js'));
  assert.equal(graphStats.nodes, 118);
  assert.equal(graphStats.edges, 140);
  assert.equal(shortestPath(0, 0)?.meters, 0);
  assert.equal(shortestPath(-1, 50), null);
  const path = shortestPath(0, 117);
  assert.deepEqual(path.ids, [0, 1, 2, 3, 4, 5, 6, 117]);
  assert.equal(path.meters, 164.87);
  assert.equal(path.segments, 7);
  const reverse = shortestPath(117, 0);
  assert.ok(Math.abs(reverse.meters - path.meters) < 0.001);
  for (let id = 0; id < 118; id++) {
    const r = shortestPath(0, id);
    assert.ok(r, `O nó ${id} deveria ser alcançável`);
    const weight = r.ids.slice(1).reduce((sum, neighbor, index) => {
      const previous = r.ids[index];
      const edge = getNeighbors(previous).find(e => e.node === neighbor);
      assert.ok(edge, `Aresta inexistente na rota ${previous} → ${neighbor}`);
      return sum + edge.weight_m;
    }, 0);
    assert.ok(Math.abs(weight - r.meters) < 0.011, `Peso inválido na rota para ${id}`);
  }
  console.log('OK: Dijkstra, rotas simétricas, percurso 0→117 e acesso aos 118 nós.');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
