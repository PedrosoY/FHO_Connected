import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Place, places } from '../data/places';
import { colors } from './Screen';

export function CampusMap({ onSelect, selectedId }: { onSelect: (p: Place) => void; selectedId?: string }) {
  return <View style={s.map} accessibilityLabel="Distribuição geográfica dos pontos levantados no campus">
    {places.map(p => {
      const active = selectedId === p.id;
      const access = p.category === 'Acesso';
      return <Pressable
        key={p.id}
        accessibilityRole="button"
        accessibilityLabel={`Selecionar ${p.name}`}
        onPress={() => onSelect(p)}
        style={[s.pin, {
          left: `${p.x}%`, top: `${p.y}%`,
          width: active ? 20 : access ? 17 : 11,
          height: active ? 20 : access ? 17 : 11,
          borderRadius: active ? 10 : 9,
          backgroundColor: active ? '#f6a623' : access ? '#d1552b' : colors.green,
          zIndex: active ? 2 : 1,
        }]}
      />;
    })}
    <Text style={s.caption}>116 PONTOS · POSIÇÕES DO CSV · SEM ROTAS</Text>
  </View>;
}

const s = StyleSheet.create({
  map: { height: 420, borderRadius: 20, backgroundColor: '#e1eee5', borderColor: '#b3d0c0', borderWidth: 2, overflow: 'hidden', position: 'relative' },
  pin: { position: 'absolute', marginLeft: -6, marginTop: -6, borderWidth: 1, borderColor: '#fff' },
  caption: { position: 'absolute', left: 8, bottom: 7, fontSize: 9, color: '#42675a', fontWeight: '800' },
});
