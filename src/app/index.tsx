import { Redirect } from 'expo-router';

// O mapa é a tela inicial. O usuário não precisa passar por um menu.
export default function Index() {
  return <Redirect href="/mapa" />;
}
