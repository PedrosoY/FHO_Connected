import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Screen, styles, colors } from '../components/Screen';

export default function Index() {
  return <Screen eyebrow="FHO CONNECTED · MVP" title="Seu campus, mais perto.">
    <Text style={styles.description}>Encontre pontos de referência e explore um mapa inicial do campus FHO em Araras.</Text>
    <View style={[styles.card, { marginTop: 16, paddingVertical: 30 }]}>
      <Text style={{ fontSize: 42, textAlign: 'center' }}>📍</Text>
      <Text style={[styles.cardTitle, { textAlign: 'center', fontSize: 22 }]}>Mapa Universitário FHO</Text>
      <Text style={[styles.description, { textAlign: 'center' }]}>116 pontos do levantamento de caminhos da FHO.</Text>
    </View>
    <Pressable style={styles.button} onPress={() => router.push('/locais')}><Text style={styles.buttonText}>Buscar um local</Text></Pressable>
    <Pressable style={[styles.button, { backgroundColor: colors.ink }]} onPress={() => router.push('/mapa')}><Text style={styles.buttonText}>Explorar mapa</Text></Pressable>
    <Text style={styles.description}>Os marcadores usam coordenadas do CSV. Ainda falta identificar as conexões entre pontos para calcular rotas.</Text>
  </Screen>;
}
