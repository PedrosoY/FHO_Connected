import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { destinations, placeLabel, places } from '../data/places';
import { Screen, styles, colors } from '../components/Screen';

export default function Locais() {
  const [query, setQuery] = useState('');
  const [includePaths, setIncludePaths] = useState(false);
  const filtered = useMemo(() => {
    const input = query.trim().toLocaleLowerCase('pt-BR');
    const pool = input || includePaths ? places : destinations;
    return pool.filter(p => !input || `${p.id} ${p.name} ${p.category} ${p.description} ponto ${p.id}`.toLocaleLowerCase('pt-BR').includes(input));
  }, [query, includePaths]);

  return <Screen eyebrow="LOCALIZAR NO CAMPUS" title="Buscar pontos e locais">
    <TextInput accessibilityLabel="Pesquisar local ou número do ponto" placeholder="Bloco C, Portaria I, Ponto 42..."
      placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} style={styles.input} />
    <Pressable onPress={() => setIncludePaths(!includePaths)} style={[styles.card, { flexDirection: 'row', alignItems: 'center', padding: 13 }]}
      accessibilityRole="checkbox" accessibilityState={{ checked: includePaths }}>
      <Text style={{ fontSize: 20, color: colors.green }}>{includePaths ? '☑' : '□'}</Text>
      <Text style={{ color: colors.ink, fontWeight: '600' }}>Mostrar também pontos de passagem</Text>
    </Pressable>
    <Text style={styles.description}>{filtered.length} resultado(s). Selecione um local para ver detalhes ou iniciar uma rota.</Text>
    <View style={{ gap: 10 }}>
      {filtered.slice(0, 80).map(p => <Pressable key={p.id}
        onPress={() => router.push({ pathname: '/local/[id]', params: { id: String(p.id) } })}
        style={styles.card} accessibilityLabel={`Abrir ${placeLabel(p)}`}>
        <Text style={{ color: colors.green, fontWeight: '800', fontSize: 11 }}>{p.category.toLocaleUpperCase('pt-BR')} · NÓ {p.id}</Text>
        <Text style={styles.cardTitle}>{p.name}</Text>
        <Text style={{ color: colors.green, fontWeight: '700' }}>Detalhes e rotas →</Text>
      </Pressable>)}
      {filtered.length === 0 ? <Text style={styles.description}>Nenhum ponto encontrado. Tente o nome do bloco ou o número do nó.</Text> : null}
      {filtered.length > 80 ? <Text style={styles.description}>Mostrando os primeiros 80 resultados. Refine a busca para encontrar um ponto.</Text> : null}
    </View>
  </Screen>;
}
