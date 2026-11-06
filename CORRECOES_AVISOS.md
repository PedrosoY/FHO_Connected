# Correções de avisos e auditoria de dependências — FHO Connected

## O que foi corrigido no código

- `src/components/Screen.tsx` deixou de importar `SafeAreaView` do `react-native` e agora usa `react-native-safe-area-context`, já listado no `package.json`.
- O grafo e o Dijkstra foram preservados. Validação: 118 nós conectados, 140 arestas, testes de rotas aprovados.

## Procedimento recomendado (PowerShell, na pasta do projeto)

1. Faça backup ou commit antes de alterar as dependências.
2. Encerre o Expo (`Ctrl+C`).
3. Atualize o Expo dentro do SDK 58 e alinhe as versões das bibliotecas:

```powershell
npm install expo@~58.0.23
npx expo install --fix
npx expo install --check
npx expo-doctor
```

4. Gere o relatório detalhado das vulnerabilidades:

```powershell
npm audit
npm audit --omit=dev
npm audit --json | Out-File -Encoding utf8 audit-report.json
```

   O número informado pelo npm não revela sozinho quais bibliotecas são afetadas. Verifique `Severity`, `Path`, `Fix available` e se o pacote está somente em ferramentas de desenvolvimento ou no runtime.

5. Após salvar as versões atuais (Git), tente somente as correções sem atualizações major forçadas:

```powershell
npm audit fix
npm audit
npx expo install --check
npx expo-doctor
```

6. Se restarem riscos, **não** execute `npm audit fix --force` indiscriminadamente. Analise o `npm audit` e atualize cada cadeia de dependências de maneira compatível com o Expo.

7. Teste e regenere o Metro:

```powershell
npm run check:graph
node scripts/test-routes.mjs
npx expo start --clear
```

## Mensagens informativas

- `47 packages are looking for funding`: não é erro; npm informa opções de patrocínio.
- `warning: Bundler cache is empty`: normal após `expo start --clear`.
- `6 other packages may need updating`: o comando `npx expo install --check` pode mostrar que está tudo atualizado; os avisos emitidos ao iniciar o Metro podem refletir o snapshot disponível naquele momento.
- `SafeAreaView deprecated`: substituído no código de aplicação; se o aviso continuar, capture o stack trace para verificar se vem de biblioteca externa.

## Limitação da análise

Neste ambiente o endpoint de auditoria do registry.npmjs.org não respondeu. Não é possível afirmar que todas as vulnerabilidades foram corrigidas sem executar `npm audit` em uma máquina com acesso ao registro e inspecionar o relatório.
