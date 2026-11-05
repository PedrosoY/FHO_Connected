import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { findPlace } from '../../data/places';
import { Screen, styles, colors } from '../../components/Screen';
export default function LocalDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const place = findPlace(id);
  if (!place) return <Screen title="Local não encontrado"><Text style={styles.description}>Ponto ausente na base de exemplo.</Text></Screen>;
  return <Screen eyebrow={place.category.toUpperCase()} title={place.name}>
    <Text style={styles.description}>{place.description}</Text>
    <Text style={[styles.description, { marginVertical: 16 }]}>Latitude: {place.latitude.toFixed(7)}\nLongitude: {place.longitude.toFixed(7)}\n\nCoordenada importada do CSV. Ainda não há informações de conexão com outros pontos.</Text>
    <Pressable style={styles.button} onPress={() => router.push('/mapa')}><Text style={styles.buttonText}>Ver no mapa</Text></Pressable>
    <Pressable style={[styles.button, { backgroundColor: colors.ink }]} onPress={() => router.push('/locais')}><Text style={styles.buttonText}>Voltar à lista</Text></Pressable>
  </Screen>;
}
