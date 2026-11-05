import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { router } from 'expo-router';
import { CampusMap } from '../components/CampusMap';
import { Place } from '../data/places';
import { Screen, styles, colors } from '../components/Screen';
export default function Mapa() {
  const [selected, setSelected] = useState<Place | null>(null);
  return <Screen eyebrow="MAPA INTERATIVO" title="Explore o campus">
    <Text style={styles.description}>Pontos reais do seu levantamento geográfico, sem mapa-base. Toque em um marcador para identificá-lo. O ponto laranja está selecionado.</Text>
    <CampusMap selectedId={selected?.id} onSelect={setSelected} />
    {selected ? <Pressable onPress={() => router.push({ pathname: '/local/[id]', params: { id: selected.id } })} style={styles.card}>
      <Text style={{ color: colors.green, fontWeight: '700' }}>{selected.category}</Text><Text style={styles.cardTitle}>{selected.name}</Text>
      <Text style={styles.description}>Toque para abrir os detalhes →</Text>
    </Pressable> : <Text style={styles.description}>Selecione um dos 116 pontos. A conectividade entre eles ainda não foi definida.</Text>}
  </Screen>;
}
