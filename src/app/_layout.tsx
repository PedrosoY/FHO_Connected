import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack screenOptions={{ headerStyle: { backgroundColor: '#153b36' }, headerTintColor: '#ffffff' }}>
    <Stack.Screen name="index" options={{ title: 'FHO Connected' }} />
    <Stack.Screen name="locais" options={{ title: 'Locais' }} />
    <Stack.Screen name="mapa" options={{ title: 'Mapa' }} />
    <Stack.Screen name="local/[id]" options={{ title: 'Detalhes' }} />
  </Stack>;
}
