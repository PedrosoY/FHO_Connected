# FHO Connected — experiência simplificada de navegação

A aplicação **abre diretamente no mapa**, com busca de destinos e um painel inferior para definir partida e chegada. A rota é calculada pelo Dijkstra sobre os **118 nós e 140 arestas** fornecidos pelo GraFHO.

## Como usar

1. Abra o mapa e toque na busca **“Para onde você quer ir?”**, ou toque em um marcador.
2. Selecione seu destino.
3. No painel inferior, toque em **“Escolher ponto de partida”**.
4. Pesquise ou selecione o ponto de origem. A linha azul aparece automaticamente.
5. Use **⇅** para inverter a rota, **×** para limpar ou o menu **☷** para exibir os pontos técnicos e as conexões do grafo.

**Importante:** a partida é selecionada manualmente; o aplicativo não afirma conhecer a posição GPS do usuário. As distâncias utilizam os pesos do grafo cadastrado, e o tempo a pé é apenas uma estimativa. A confiabilidade das rotas depende da validação dos caminhos no campus.

## Execução

```bash
npm install
npm run check:graph
npm run test:routes
npx expo start
```

Pressione `w` para o mapa no navegador, ou use o Expo Go compatível para testar no Android/iOS. A versão web carrega Leaflet e OpenStreetMap, dependendo de acesso à internet.

## Estrutura

- `src/app/mapa.tsx`: tela principal, busca e painel de rotas.
- `src/components/CampusMap.native.tsx`: mapa Android/iOS com `react-native-maps`.
- `src/components/CampusMap.web.tsx`: mapa web com Leaflet.
- `src/data/grafo-fho.json`: grafo real proveniente do GraFHO.
- `src/data/graph.ts`: Dijkstra manual.
- `src/data/places.ts`: locais e coordenadas.
- `tools/editor_grafo_fho_python/`: editor do grafo.

O GitHub remoto **não foi alterado**; envie os arquivos após testar localmente.

---

# FHO Connected — Mapa Universitário

MVP acadêmico em **React Native, Expo Router e TypeScript**. Exibe o campus FHO em um mapa geográfico, permite localizar os pontos do levantamento e calcula rotas pelo algoritmo **Dijkstra implementado manualmente** (sem serviço externo de rotas).

## O que está implementado

- **Início:** visão geral do projeto e números da rede.
- **Buscar locais:** pesquisa por bloco, portaria, alimentação, esportes ou **ID de nó**. É possível mostrar os pontos de passagem.
- **Mapa:** base cartográfica interativa (Android/iOS: `react-native-maps`, Web: Leaflet/OpenStreetMap), zoom e marcadores com coordenadas geográficas.
- **Rotas:** selecionar origem e destino tocando nos marcadores ou a partir da tela de detalhes; inverter ou limpar a rota. Dijkstra calcula a menor soma dos pesos e desenha uma linha azul.
- **Camadas:** habilitar/desabilitar pontos de passagem e **visualizar as conexões do grafo**.
- **Detalhes:** coordenadas e vizinhos diretamente conectados, com seus pesos em metros.
- **Editor de grafos:** o código Python original está em `tools/editor_grafo_fho_python/`, com carregamento inicial do grafo completo e importação de JSON para evitar perder a rede criada.

## Dados incorporados

Os dados vieram do `GraFHO.rar` disponibilizado pelo grupo:

| Recurso | Quantidade |
|---|---:|
| Nós (IDs internos 0–117) | 118 |
| Arestas não direcionadas | 140 |
| Nós pertencentes à rede conectada | 118 |
| Pontos com descrição preenchida | 32 |

O arquivo principal é `src/data/grafo-fho.json`, contendo `nodes` e `adjacency`. **Não use `source_id` para roteamento:** essa coluna preserva os números originais do CSV e contém repetições. O identificador único é `nodes[].id`. A rede foi revisada automaticamente quanto a arestas recíprocas, pesos e conectividade; a **validade física dos trechos** continua dependendo do levantamento do grupo.

## Instalação

1. Instale Node.js compatível com Expo SDK 58 (por exemplo, Node 22 atualizado).
2. Abra esta pasta no VS Code e instale as dependências:

```bash
npm install
```

3. Execute:

```bash
npx expo start
```

- Android/iOS: abra o QR code no **Expo Go** compatível com a versão do projeto.
- Web: pressione `w` ou execute `npm run web`.

**Atenção:** o mapa da Web carrega o Leaflet 1.9.4 por CDN (`unpkg.com`) e as imagens cartográficas do OpenStreetMap. Precisa de conexão com a internet. O mapa nativo também precisa carregar seu mapa-base. O cálculo de rotas e os dados do grafo são locais, sem chamadas a serviços de direções ou chaves de API. Para publicar uma versão compilada do Android com Google Maps, consulte a configuração oficial do `react-native-maps` para distribuição.

## Demonstração em sala

1. Abra **Buscar um local** e digite `Portaria II`.
2. Entre em **Detalhes**, selecione **Iniciar rota daqui**.
3. No mapa, toque em outro ponto (por exemplo, **Bloco D - Entrada**, nó 117) e marque como destino.
4. Mostre a distância, o número de trechos e a linha azul. Habilite **Mostrar as 140 conexões** para explicar o grafo.
5. Mostre o `src/data/graph.ts` e explique a escolha gulosa do nó com menor distância, o relaxamento de arestas e a reconstrução da rota pelo mapa de predecessores.

**Exemplo conferido no conjunto atual:** nó `0 → 117`: 164,87 metros e 7 trechos. A distância é uma **estimativa geométrica**, não uma medição verificada do percurso a pé.

## Organização

```text
src/
  app/
    index.tsx             # tela inicial
    locais.tsx            # pesquisa
    mapa.tsx              # escolha de origem/destino e resultado
    local/[id].tsx        # detalhes e vizinhos
    _layout.tsx           # navegação Expo Router
  components/
    CampusMap.native.tsx  # Google Maps / Apple Maps (Android/iOS)
    CampusMap.web.tsx     # Leaflet + OpenStreetMap (navegador)
    CampusMap.tsx         # fallback esquemático
    mapTypes.ts
    Screen.tsx
  data/
    grafo-fho.json        # BASE ATUAL: nós, descrições, adjacência e pesos
    places.ts             # nomes/categorias com IDs únicos
    graph.ts              # Dijkstra manual, arestas e estatísticas
scripts/
  validate-graph.mjs      # valida peso, integridade e conectividade
  sync-graph.mjs          # importa novo JSON para app e editor
  test-routes.mjs         # testes do caminho mínimo
 tools/
  editor_grafo_fho_python/
    app.py, pontos.csv, grafo-fho.json, requirements.txt
  dados/
    adjacencia.csv
    Mapa FHO- Caminhos FHO.csv
```

## Como atualizar a rede de caminhos

O editor Python agora **abre automaticamente o grafo-fho.json com as 140 arestas existentes**. Para abri-lo:

```powershell
cd tools/editor_grafo_fho_python
python -m pip install -r requirements.txt
python -m streamlit run app.py
```

1. Faça as alterações no mapa e exporte `grafo-fho.json`.
2. Volte ao diretório raiz do projeto (onde está `package.json`).
3. Importe o JSON exportado:

```bash
npm run sync:graph -- "C:/Users/SEU_USUARIO/Downloads/grafo-fho.json"
npm run check:graph
npm run test:routes
```

4. Reinicie o aplicativo. Os dados atualizados serão incorporados ao `src/data/grafo-fho.json` e à cópia usada pelo editor. Se for editar as coordenadas ou inserir nós, preserve IDs internos únicos e atualize todas as arestas.

## Limitações e próximos passos

- Os pesos do JSON são distâncias Haversine **entre pontos diretamente conectados**; cada trecho é desenhado em linha reta. Curvas, escadas, obstáculos e acessibilidade ainda precisam ser validados.
- Não há localização GPS em tempo real, geolocalização em interiores, instruções curva a curva ou navegação por voz.
- As descrições de locais são as presentes no JSON (nem todas as salas têm nomes).
- Adicionar planta validada do campus, categorias/horários dos prédios, acessibilidade e testes presenciais com alunos.
- O conteúdo do `GraFHO.rar` é composto pelo editor Python e dados do grafo; o aplicativo React Native é a continuação da versão Expo existente.

## Comandos de verificação

```bash
npm run check:graph    # funciona sem instalar pacotes
npm run test:routes    # requer TypeScript instalado via npm install
npx tsc --noEmit        # exige as dependências npm
```


## GPS: usar minha localização como origem

A tela do mapa inclui o botão **Minha localização**. Ao tocar:

1. O app solicita permissão de localização **apenas enquanto estiver aberto**.
2. Lê uma posição atual com `expo-location` (não monitora em segundo plano).
3. Cria um ponto temporário azul nas coordenadas do dispositivo.
4. Calcula o ponto permanente mais próximo pelos metros da fórmula de Haversine e mostra imediatamente uma ligação tracejada até ele.
5. Ao selecionar um destino, o Dijkstra calcula a menor rota pelo grafo original; o trecho inicial temporário entra na distância total.

**Limitações:** o trecho GPS→nó mais próximo é **reto**, não validado contra paredes, cercas ou obstáculos. O ponto mais próximo geograficamente pode não ser o melhor acesso físico; verifique os caminhos em campo. O aplicativo bloqueia a criação de origem caso a localização esteja a mais de 150 m de todos os pontos ou caso o GPS informe precisão pior que 100 m. Se for usado dentro de prédios, o GPS pode demorar ou ser impreciso. Não existe acompanhamento contínuo do usuário.

### Instalação após extrair este pacote

Este pacote inclui `expo-location` no `package.json`, porém o lockfile é o anterior porque o registro npm não estava acessível durante a geração. **Não use `npm ci` antes de atualizar o lockfile.** Na pasta do projeto, com o Expo SDK 58 restaurado, execute:

```powershell
npx expo install expo-location
npx expo install --fix
npx expo install --check
npm run check:graph
npm run test:routes
npm run test:gps
npx expo start --clear
```

O primeiro comando instala a versão adequada do `expo-location` e sincroniza o `package-lock.json`. Nas próximas reinstalações limpas, `npm ci` volta a funcionar. Não execute `npm audit fix --force`: anteriormente ele fez downgrade do SDK para 53 e quebrou o Metro.

No iOS e Android as mensagens de permissão estão configuradas em `app.json`. No navegador o GPS exige um contexto seguro (HTTPS ou localhost); em uma aba aberta pelo IP da rede, a geolocalização pode ser bloqueada pelo browser.

### Privacidade

A posição só é solicitada por ação explícita, é mantida na memória durante o uso da tela e não é gravada no CSV/JSON nem enviada a um servidor do projeto.


## Visualização limpa de rotas

Ao calcular uma rota, o mapa oculta automaticamente os demais marcadores, mantendo apenas a linha do caminho, os marcadores de partida e destino e a localização GPS quando usada. Para voltar a visualizar todos os pontos, ative **Mostrar outros pontos** no resumo da rota ou nas opções do mapa. Ao limpar a rota, os pontos voltam à visualização normal. O cálculo do Dijkstra e o arquivo GraFHO não são alterados.
