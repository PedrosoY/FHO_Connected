# Editor de Grafos FHO — dados integrados ao aplicativo

Aplicação local em Python/Streamlit para criar, revisar e exportar conexões entre pontos geográficos do campus.

**Nesta versão, o editor abre automaticamente `grafo-fho.json` com as conexões já existentes (118 nós e 140 arestas)**. O CSV original é mantido como alternativa, mas não apaga o grafo ao iniciar o editor.

## Executar

Requisitos: Python 3.10+ e internet para o mapa OpenStreetMap.

```powershell
python -m pip install -r requirements.txt
python -m streamlit run app.py
```

No navegador, acesse `http://localhost:8501` se ele não abrir automaticamente.

## Funcionamento

1. Veja as conexões existentes no mapa e a lista de adjacência.
2. Selecione dois pontos consecutivamente para criar uma conexão bidirecional.
3. Para excluir, selecione um ponto e use o controle ao lado da conexão na lista.
4. Use **Desfazer** para reverter a última edição, se necessário.
5. Exporte o `grafo-fho.json` quando terminar.
6. Para importar um JSON exportado anteriormente, use **Importar grafo existente (JSON)**. O novo CSV reinicia as conexões e exige confirmação da origem dos dados.

O JSON contém `nodes` com IDs internos únicos e `adjacency` com peso `weight_m`, calculado por Haversine. A coluna `source_id` do CSV NÃO é identificador único. A distância de um segmento é aproximada em linha reta, não necessariamente o trajeto pedonal exato.

## Sincronizar com o aplicativo React Native

Na pasta raiz (aquela que contém `package.json`), rode:

```bash
npm run sync:graph -- "CAMINHO/DO/grafo-fho.json"
npm run check:graph
```

Isso atualiza `src/data/grafo-fho.json` e a cópia deste editor. Reinicie o aplicativo para importar as alterações.
