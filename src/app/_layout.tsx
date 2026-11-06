import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerStyle: { backgroundColor: '#ffffff' }, headerTintColor: '#172b46', headerTitleStyle: { fontWeight: '700' } }}>
    <Stack.Screen name="index" options={{ headerShown: false }} />
    <Stack.Screen name="mapa" options={{ headerShown: false }} />
    <Stack.Screen name="locais" options={{ title: 'Todos os locais' }} />
    <Stack.Screen name="local/[id]" options={{ title: 'Detalhes do local' }} />
  </Stack>;
}
