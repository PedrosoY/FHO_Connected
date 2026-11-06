import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export const colors = { bg: '#f3f7f5', ink: '#153b36', green: '#13795b', muted: '#58736b', white: '#ffffff', line: '#d9e7e1' };
export function Screen({ title, eyebrow, children }: { title: string; eyebrow?: string; children: ReactNode }) {
  return <SafeAreaView style={styles.safe}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
    {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}<Text style={styles.title}>{title}</Text>{children}
  </ScrollView></SafeAreaView>;
}
export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg }, content: { padding: 22, paddingBottom: 46, gap: 16 },
  eyebrow: { color: colors.green, fontWeight: '800', letterSpacing: 1.4, fontSize: 12, marginTop: 10 },
  title: { fontSize: 30, fontWeight: '800', color: colors.ink, marginBottom: 5 },
  card: { padding: 18, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, gap: 7 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.ink },
  description: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  button: { backgroundColor: colors.green, borderRadius: 13, padding: 16, alignItems: 'center' },
  buttonText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  statValue: { fontSize: 27, fontWeight: '800', color: colors.green },
  statLabel: { fontSize: 12, fontWeight: '600', color: colors.muted },
  toggleText: { fontSize: 15, color: colors.ink, fontWeight: '600' },
  smallButton: { paddingVertical: 11, paddingHorizontal: 14, flexGrow: 1 },
  input: { backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: 13, padding: 15, fontSize: 16, color: colors.ink },
});
