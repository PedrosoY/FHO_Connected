# FHO Connected — Mapa Universitário FHO

MVP acadêmico feito com React Native, Expo SDK 58, TypeScript e Expo Router.

## Funcionalidades implementadas

- Tela inicial com acesso à pesquisa e ao mapa.
- Lista com **busca interativa** por número ou categoria.
- Distribuição geográfica dos **116 pontos do CSV**, com marcadores clicáveis.
- Tela de detalhes e navegação entre telas.

**Atenção:** as coordenadas vieram do levantamento `Mapa FHO- Caminhos FHO.csv`, mas a visualização não tem mapa-base. Os números identificam pontos de passagem, não prédios. O CSV não informa conexões entre pontos; portanto, não há rotas calculadas nem localização GPS nesta versão. Os rótulos 103, 104, 105 e 106 se repetem; cada registro possui um ID interno único.

## Execução

Instale o Node.js compatível com Expo SDK 58. No terminal, na pasta do projeto:

```bash
npm install
npx expo start
```

Pressione `w` para abrir no navegador ou utilize um ambiente Expo compatível no dispositivo. Verifique os tipos com `npx tsc --noEmit`.

## Organização do código

```text
src/
  app/              # telas e navegação do Expo Router
    index.tsx       # início
    locais.tsx      # busca
    mapa.tsx        # mapa
    local/[id].tsx  # detalhes
    _layout.tsx     # pilha de navegação
  components/       # Screen e CampusMap
  data/places.ts    # normalização para o mapa
  data/waypoints.ts # 116 coordenadas do CSV
```

## Demonstração em sala

Abra **Buscar um local**, digite `Portaria K`, toque no resultado e selecione **Ver no mapa**. Toque em outro marcador e abra seus detalhes.

## Próximas etapas

1. Identificar os locais de destino (biblioteca, salas, secretaria) e associá-los a pontos de passagem.
2. Adicionar um mapa-base ou planta validada do campus.
3. Registrar quais pontos se conectam e calcular caminhos na rede.
4. Testar a interface em dispositivos Android/iOS.
