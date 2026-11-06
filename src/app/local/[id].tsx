import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { getNeighbors } from '../../data/graph';
import { findPlace, placeLabel } from '../../data/places';
import { Screen, styles, colors } from '../../components/Screen';

export default function LocalDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const place = findPlace(id);
  if (!place) return <Screen title="Ponto não encontrado"><Text style={styles.description}>Este identificador não está no grafo importado.</Text></Screen>;
  const neighbors = getNeighbors(place.id);
  return <Screen eyebrow={`${place.category.toLocaleUpperCase('pt-BR')} · NÓ ${place.id}`} title={place.name}>
    <View style={styles.card}>
      <Text style={styles.description}>{place.description}</Text>
      <Text style={styles.description}>Latitude: {place.latitude.toFixed(7)}{'\n'}Longitude: {place.longitude.toFixed(7)}</Text>
      <Text style={styles.description}>Conexões diretas: {neighbors.length}</Text>
    </View>
    <Pressable style={styles.button} onPress={() => router.push({ pathname: '/mapa', params: { focus: String(place.id) } })}>
      <Text style={styles.buttonText}>Localizar no mapa</Text>
    </Pressable>
    <Pressable style={[styles.button, { backgroundColor: colors.ink }]} onPress={() => router.push({ pathname: '/mapa', params: { origin: String(place.id) } })}>
      <Text style={styles.buttonText}>Iniciar rota daqui</Text>
    </Pressable>
    <Pressable style={[styles.button, { backgroundColor: '#567266' }]} onPress={() => router.push({ pathname: '/mapa', params: { destination: String(place.id) } })}>
      <Text style={styles.buttonText}>Definir como destino</Text>
    </Pressable>
    <Text style={styles.cardTitle}>Pontos conectados</Text>
    {neighbors.map(n => {
      const adjacent = findPlace(n.node);
      if (!adjacent) return null;
      return <Pressable key={n.node} style={styles.card} onPress={() => router.push({ pathname: '/local/[id]', params: { id: String(n.node) } })}>
        <Text style={{ color: colors.ink, fontWeight: '700' }}>{placeLabel(adjacent)}</Text>
        <Text style={styles.description}>Distância estimada do trecho: {n.weight_m.toFixed(2)} m</Text>
      </Pressable>;
    })}
    <Pressable style={[styles.button, { backgroundColor: colors.ink }]} onPress={() => router.push('/locais')}>
      <Text style={styles.buttonText}>Voltar à pesquisa</Text>
    </Pressable>
  </Screen>;
}
