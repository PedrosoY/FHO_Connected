import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import { places } from '../data/places';
import { Screen, styles, colors } from '../components/Screen';
export default function Locais() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => places.filter(p => `${p.name} ${p.category}`.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR'))), [query]);
  return <Screen eyebrow="PESQUISA INTERATIVA" title="Locais do campus">
    <TextInput accessibilityLabel="Pesquisar locais" placeholder="Buscar por nome ou categoria..." placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} style={styles.input} />
    <Text style={styles.description}>{filtered.length} pontos encontrados · Coordenadas do levantamento</Text>
    {filtered.slice(0, 25).map(p => <Pressable key={p.id} onPress={() => router.push({ pathname: '/local/[id]', params: { id: p.id } })} style={styles.card}>
      <Text style={{ color: colors.green, fontWeight: '700', fontSize: 12 }}>{p.category.toUpperCase()}</Text>
      <Text style={styles.cardTitle}>{p.name}</Text><Text style={styles.description}>{p.description}</Text>
      <Text style={{ color: colors.green, fontWeight: '700' }}>Ver detalhes →</Text>
    </Pressable>)}
    {filtered.length > 25 ? <Text style={styles.description}>Mostrando os primeiros 25 resultados. Digite o número do ponto para refinar a busca.</Text> : null}
    {filtered.length === 0 ? <Text style={styles.description}>Nenhum local corresponde à busca.</Text> : null}
  </Screen>;
}
