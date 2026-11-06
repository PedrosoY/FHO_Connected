# Relatório técnico da integração GraFHO → FHO Connected

## Arquivos recebidos

- `grafo-fho.json`: nós com coordenadas e descrições; lista de adjacência ponderada bidirecional.
- `adjacencia.csv`: visualização textual das conexões e graus.
- `Mapa FHO- Caminhos FHO.csv` e `editor_grafo_fho_python/pontos.csv`: coordenadas geográficas no formato WKT (longitude, latitude).
- `editor_grafo_fho_python/app.py`, `requirements.txt` e `README.md`: ferramenta de edição de grafo com Streamlit, Folium e OpenStreetMap.

A pasta RAR não continha o projeto React Native. A integração foi realizada sobre a versão Expo que já havia sido preparada anteriormente.

## Resultado dos testes de integridade

- 118 nós com IDs internos numéricos únicos (0–117).
- 140 arestas não direcionadas (280 registros na adjacência, pois cada ligação aparece nos dois sentidos).
- 0 nós isolados; 1 componente conexa com 118 nós.
- 6 `source_id` repetidos, preservados como metadado, sem comprometer os IDs internos.
- Todos os pesos das conexões recíprocas conferem.
- 32 nós têm descrições para busca (portarias, blocos, cantinas, restaurante, quadras etc.).

## Arquitetura integrada

`src/data/grafo-fho.json` é a **única fonte de dados de grafo** no app mobile. `places.ts` adapta a lista de nós para as telas; `graph.ts` lê os pesos de adjacência e implementa Dijkstra manualmente. `CampusMap.native.tsx` e `CampusMap.web.tsx` representam os nós e o percurso. A lista de conexões é apenas desenhada quando o usuário pede essa camada.

## Validação das rotas

- Rota nó 0 → 117: `0 → 1 → 2 → 3 → 4 → 5 → 6 → 117`, 164,87 metros e 7 segmentos.
- Rota 117 → 0: mesma distância, por se tratar de um grafo não direcionado.
- Rota 0 → 0: zero metros.
- Identificadores inexistentes: não geram rota.
- Foi verificado que o nó 0 consegue alcançar todos os 118 nós e que os pesos retornados pelo algoritmo correspondem à soma das arestas.

## Limitações reais

- Os pesos do grafo são haversine entre pares de pontos, e não uma medição oficial da caminhada.
- Os caminhos cadastrados ainda precisam de conferência presencial de obstáculos, acesso permitido, passagens internas, escadas e acessibilidade.
- A interface mobile e web foi implementada, mas **a execução visual em dispositivo/navegador não pôde ser concluída nesta máquina**, que não acessa o registro npm para instalar dependências. Sintaxe dos arquivos TypeScript foi checada, os módulos `places.ts` e `graph.ts` foram compilados e os testes do Dijkstra passaram.
- O mapa requer acesso ao serviço cartográfico; sem rede, o algoritmo continua local, mas a base visual não carrega.

## Entrega

Projeto Expo atualizado, editor Python incluído, JSON de grafo incorporado, validação e sincronização documentadas. O ZIP não altera automaticamente o repositório GitHub remoto.
