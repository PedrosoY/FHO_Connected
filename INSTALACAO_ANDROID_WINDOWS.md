# Instalação e correção no Android (Windows)

Abra a pasta que contém `package.json` no terminal do VS Code. Interrompa o Expo com `Ctrl+C`.

Execute, **um comando por vez**:

```powershell
npm ci
npx expo install react-native-maps
npx expo start --clear
```

Se `npm ci` falhar por divergência entre `package.json` e `package-lock.json`, use `npm install`, depois execute os outros dois comandos.

O erro `Unable to resolve "react-native-maps"` significa que o Metro não encontrou a dependência instalada. A dependência consta no `package.json` e no `package-lock.json` do ZIP. A versão é `1.29.11`, recomendada para Expo SDK 58. Não é necessário configurar chave de API para usar Google Maps no Expo Go Android.

Se persistir, verifique:

```powershell
npm ls react-native-maps
npx expo-doctor
```

Atualize o Expo Go no Android para uma versão compatível com o SDK 58, se disponível; caso não esteja, utilize uma development build compatível. O erro de `Cannot record touch end` no log Web é um aviso diferente e não explica a falha de build do Android.

## Interface responsiva

- A busca permanece abaixo da barra de status e respeita recortes/notches.
- O painel inferior limita sua altura a 63% da tela e possui rolagem.
- O botão **Detalhes / Recolher** permite exibir ou ocultar conteúdo explicativo.
- Resultados da pesquisa podem ser rolados com o teclado aberto.
- A seleção de origem/destino e a rota Dijkstra permanecem no mapa.
