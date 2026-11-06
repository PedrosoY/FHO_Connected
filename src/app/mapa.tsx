import { useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CampusMap } from '../components/CampusMap';
import { shortestPath } from '../data/graph';
import { MAX_CONNECTOR_METERS, MAX_GPS_ACCURACY_METERS, nearestGraphNode, type GpsOrigin } from '../data/geolocation';
import { destinations, findPlace, placeLabel, places, type Place } from '../data/places';

type SelectionMode = 'destination' | 'origin';
const BLUE = '#1769e0';
const DARK = '#1c293b';

export default function Mapa() {
  const params = useLocalSearchParams<{ focus?: string; origin?: string; destination?: string }>();
  const [selected, setSelected] = useState<Place | null>(findPlace(params.focus) ?? null);
  const [originId, setOriginId] = useState<number | null>(findPlace(params.origin)?.id ?? null);
  const [gpsOrigin, setGpsOrigin] = useState<GpsOrigin | null>(null);
  const [useGpsAsOrigin, setUseGpsAsOrigin] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [destinationId, setDestinationId] = useState<number | null>(findPlace(params.destination)?.id ?? null);
  const [mode, setMode] = useState<SelectionMode>('destination');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [showPassages, setShowPassages] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [focusId, setFocusId] = useState<number | null>(findPlace(params.focus)?.id ?? null);

  useEffect(() => {
    const focus = findPlace(params.focus);
    const origin = findPlace(params.origin);
    const destination = findPlace(params.destination);
    if (focus) { setSelected(focus); setFocusId(focus.id); }
    if (origin) { setOriginId(origin.id); setUseGpsAsOrigin(false); }
    if (destination) { setDestinationId(destination.id); setSelected(destination); setFocusId(destination.id); }
  }, [params.focus, params.origin, params.destination]);

  const origin = findPlace(originId);
  const destination = findPlace(destinationId);
  const activeStartId = useGpsAsOrigin ? gpsOrigin?.nearestNodeId ?? null : originId;
  const graphRoute = useMemo(() => activeStartId !== null && destinationId !== null
    ? shortestPath(activeStartId, destinationId) : null, [activeStartId, destinationId]);
  // O conector GPS -> nó mais próximo é uma aresta virtual (não altera o JSON original).
  const route = graphRoute ? {
    ...graphRoute,
    meters: graphRoute.meters + (useGpsAsOrigin && gpsOrigin ? gpsOrigin.connectorMeters : 0),
    segments: graphRoute.segments + (useGpsAsOrigin && gpsOrigin ? 1 : 0),
  } : null;
  const routeCoordinates = graphRoute ? [
    ...(useGpsAsOrigin && gpsOrigin ? [{ latitude: gpsOrigin.latitude, longitude: gpsOrigin.longitude }] : []),
    ...graphRoute.ids.map(id => findPlace(id)!).filter(Boolean)
      .map(p => ({ latitude: p.latitude, longitude: p.longitude })),
  ] : [];
  const minutes = route ? Math.max(1, Math.round(route.meters / 75)) : null;
  const hasOrigin = useGpsAsOrigin && gpsOrigin !== null || origin !== undefined;

  async function useCurrentPosition() {
    if (locating) return;
    setLocating(true);
    setLocationError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationError('Permissão negada. Autorize a localização nas configurações do dispositivo.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const point = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      const accuracyMeters = location.coords.accuracy;
      if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) {
        setLocationError('O dispositivo forneceu coordenadas inválidas. Tente novamente.');
        return;
      }
      if (accuracyMeters !== null && accuracyMeters > MAX_GPS_ACCURACY_METERS) {
        setLocationError(`Precisão insuficiente (±${Math.round(accuracyMeters)} m). Vá para um local aberto e tente novamente.`);
        return;
      }
      const nearest = nearestGraphNode(point);
      if (!nearest || nearest.meters > MAX_CONNECTOR_METERS) {
        setLocationError('Você está longe dos caminhos cadastrados da FHO. Aproxime-se do campus para calcular uma rota.');
        return;
      }
      setGpsOrigin({ ...point, accuracyMeters, nearestNodeId: nearest.node.id,
        connectorMeters: nearest.meters, capturedAt: Date.now() });
      setUseGpsAsOrigin(true);
      setOriginId(null);
      setFocusId(null);
      setSearchOpen(false);
      setOptionsOpen(false);
      Keyboard.dismiss();
    } catch (error) {
      setLocationError('Não foi possível obter o GPS. Ative a localização e tente novamente.');
    } finally {
      setLocating(false);
    }
  }

  const results = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('pt-BR');
    if (!q) return destinations.slice(0, 12);
    return places.filter(p => `${p.name} ${p.category} ${p.id} ponto ${p.id}`.toLocaleLowerCase('pt-BR').includes(q)).slice(0, 24);
  }, [search]);

  function choose(place: Place) {
    if (mode === 'origin') { setOriginId(place.id); setUseGpsAsOrigin(false); }
    else setDestinationId(place.id);
    setSelected(place);
    setFocusId(place.id);
    setSearch('');
    setSearchOpen(false);
    Keyboard.dismiss();
  }
  function selectOnMap(place: Place) {
    setSelected(place);
    setFocusId(place.id);
    setSearchOpen(false);
    Keyboard.dismiss();
  }
  function beginSearch(next: SelectionMode) {
    setMode(next);
    setSearch('');
    setSearchOpen(true);
  }
  function clearRoute() {
    setOriginId(null);
    setUseGpsAsOrigin(false);
    setGpsOrigin(null);
    setLocationError(null);
    setDestinationId(null);
    setSelected(null);
    setFocusId(null);
    setSearchOpen(false);
  }

  return <View style={ui.page}>
    <CampusMap selectedId={selected?.id} focusedId={focusId} onSelect={selectOnMap}
      routeIds={graphRoute?.ids ?? []} routeCoordinates={routeCoordinates} gpsOrigin={gpsOrigin}
      gpsNearestId={gpsOrigin?.nearestNodeId ?? null}
      showPassages={showPassages} showConnections={showConnections} />

    <View pointerEvents="box-none" style={ui.top}>
      <View style={ui.searchBox}>
        <Text style={ui.searchIcon}>⌕</Text>
        <Pressable style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel="Pesquisar destino"
          onPress={() => beginSearch('destination')}>
          <Text style={ui.searchPlaceholder}>{destination ? destination.name : 'Para onde você quer ir?'}</Text>
        </Pressable>
        <Pressable style={ui.roundControl} onPress={() => setOptionsOpen(!optionsOpen)} accessibilityLabel="Opções de visualização">
          <Text style={ui.optionIcon}>☷</Text>
        </Pressable>
      </View>
      {optionsOpen && <View style={ui.options}>
        <Text style={ui.optionTitle}>Visualização do mapa</Text>
        <Pressable onPress={() => setShowPassages(!showPassages)} style={ui.optionRow}>
          <Text style={ui.optionText}>{showPassages ? '☑' : '□'} Mostrar pontos de passagem</Text>
        </Pressable>
        <Pressable onPress={() => setShowConnections(!showConnections)} style={ui.optionRow}>
          <Text style={ui.optionText}>{showConnections ? '☑' : '□'} Mostrar conexões do grafo</Text>
        </Pressable>
        <Text style={ui.hint}>Os detalhes técnicos ficam ocultos para manter o mapa limpo.</Text>
      </View>}
    </View>

    {!searchOpen && <Pressable style={ui.locateFab} onPress={useCurrentPosition} disabled={locating}
      accessibilityRole="button" accessibilityLabel="Usar minha localização como partida">
      <Text style={ui.locateIcon}>{locating ? '…' : '◎'}</Text>
      <Text style={ui.locateLabel}>{locating ? 'Localizando' : 'Minha localização'}</Text>
    </Pressable>}

    {searchOpen && <View style={ui.searchOverlay}>
      <View style={ui.searchPanel}>
        <View style={ui.searchHeading}>
          <Pressable accessibilityLabel="Voltar ao mapa" onPress={() => setSearchOpen(false)}><Text style={ui.back}>‹</Text></Pressable>
          <Text style={ui.panelTitle}>{mode === 'origin' ? 'De onde você sai?' : 'Para onde você vai?'}</Text>
        </View>
        {mode === 'origin' && <Pressable style={ui.gpsSearchOption} onPress={useCurrentPosition} disabled={locating}>
          <Text style={ui.gpsSearchText}>{locating ? 'Obtendo localização...' : '◎ Usar minha localização atual'}</Text>
        </Pressable>}
        {locationError && <Text style={ui.error}>{locationError}</Text>}
        <TextInput autoFocus placeholder="Buscar bloco, portaria, cantina ou ponto..." placeholderTextColor="#88919f"
          value={search} onChangeText={setSearch} style={ui.input} accessibilityLabel="Buscar local no campus" />
        <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 350 }}>
          {results.map(p => <Pressable key={p.id} style={ui.result} onPress={() => choose(p)}>
            <Text style={ui.pin}>⌖</Text>
            <View style={{ flex: 1 }}>
              <Text style={ui.resultTitle}>{p.name}</Text>
              <Text style={ui.hint}>{p.category} · Ponto {p.id}</Text>
            </View>
          </Pressable>)}
          {results.length === 0 && <Text style={ui.hint}>Nenhum local encontrado. Tente outro nome ou número.</Text>}
        </ScrollView>
      </View>
    </View>}

    {!searchOpen && <View pointerEvents="box-none" style={ui.bottom}>
      <View style={ui.sheet}>
        <View style={ui.handle} />
        {selected && <View style={ui.selectedRow}>
          <View style={{ flex: 1 }}>
            <Text style={ui.eyebrow}>{selected.category.toUpperCase()}</Text>
            <Text style={ui.heading} numberOfLines={2}>{selected.name}</Text>
          </View>
          <Pressable onPress={() => router.push({ pathname: '/local/[id]', params: { id: String(selected.id) } })}
            accessibilityLabel="Detalhes do ponto" style={ui.infoButton}><Text style={ui.infoText}>ⓘ</Text></Pressable>
        </View>}
        <Text style={ui.sheetTitle}>Sua rota pela FHO</Text>
        <Pressable style={ui.routeField} onPress={() => beginSearch('origin')} accessibilityLabel="Selecionar ponto de partida">
          <View style={[ui.dot, { backgroundColor: '#31a25b' }]} />
          <Text numberOfLines={1} style={[ui.routeText, !hasOrigin && ui.muted]}>{useGpsAsOrigin && gpsOrigin ? 'Minha localização (GPS)' : origin ? placeLabel(origin) : 'Escolher ponto de partida'}</Text>
          <Text style={ui.chevron}>›</Text>
        </Pressable>
        <Pressable style={ui.routeField} onPress={() => beginSearch('destination')} accessibilityLabel="Selecionar destino">
          <View style={[ui.dot, { backgroundColor: '#d44949' }]} />
          <Text numberOfLines={1} style={[ui.routeText, !destination && ui.muted]}>{destination ? placeLabel(destination) : 'Escolher destino'}</Text>
          <Text style={ui.chevron}>›</Text>
        </Pressable>
        {!selected && !hasOrigin && !destination && <Text style={ui.hint}>Pesquise um local ou toque em um marcador do mapa para começar.</Text>}
        {selected && <View style={ui.quickActions}>
          <Pressable style={ui.quickButton} onPress={() => { setOriginId(selected.id); setUseGpsAsOrigin(false); setMode('destination'); }}>
            <Text style={ui.quickText}>Definir como partida</Text>
          </Pressable>
          <Pressable style={ui.quickButton} onPress={() => { setDestinationId(selected.id); setMode('origin'); }}>
            <Text style={ui.quickText}>Definir como destino</Text>
          </Pressable>
        </View>}
        {hasOrigin && destination && route ? <View style={ui.routeSummary}>
          <Text style={ui.routeDistance}>{route.meters.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} m</Text>
          <Text style={ui.routeTime}>Aproximadamente {minutes} min a pé · {route.segments} trechos</Text>
          <Text style={ui.hint}>Dijkstra + {useGpsAsOrigin ? 'ligação virtual em linha reta ao nó mais próximo' : 'arestas cadastradas'}. Não é navegação GPS em tempo real.</Text>
        </View> : hasOrigin && destination ? <Text style={ui.error}>Não há rota entre os locais selecionados.</Text> : null}
        {useGpsAsOrigin && gpsOrigin && <Text style={ui.gpsHint}>Ligação ao ponto {gpsOrigin.nearestNodeId}: {gpsOrigin.connectorMeters.toFixed(0)} m · precisão GPS ±{gpsOrigin.accuracyMeters?.toFixed(0) ?? '?'} m. Trecho virtual: confirme se a passagem é acessível.</Text>}
        {locationError && <Text style={ui.error}>{locationError}</Text>}
        <View style={ui.actionRow}>
          <Pressable style={[ui.primary, { flex: 1 }]} onPress={() => beginSearch(!hasOrigin ? 'origin' : 'destination')}>
            <Text style={ui.primaryText}>{route ? 'Alterar rota' : !hasOrigin ? 'Escolher partida' : 'Escolher destino'}</Text>
          </Pressable>
          {!useGpsAsOrigin && (origin || destination) && <Pressable onPress={() => { setOriginId(destinationId); setDestinationId(originId); }} style={ui.secondary} accessibilityLabel="Inverter origem e destino"><Text style={ui.secondaryText}>⇅</Text></Pressable>}
          {(hasOrigin || destination) && <Pressable onPress={clearRoute} style={ui.secondary} accessibilityLabel="Limpar rota"><Text style={ui.secondaryText}>×</Text></Pressable>}
        </View>
      </View>
    </View>}
  </View>;
}

const ui = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#e5ece9' },
  locateFab: { position: 'absolute', right: 14, top: 89, zIndex: 9, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 44, borderRadius: 22, elevation: 5, shadowColor: '#172b46', shadowOpacity: 0.14, shadowRadius: 8 },
  locateIcon: { color: BLUE, fontSize: 26, marginRight: 7 }, locateLabel: { color: DARK, fontWeight: '700', fontSize: 13 },
  gpsSearchOption: { padding: 14, borderRadius: 12, backgroundColor: '#eaf2ff', marginBottom: 10 },
  gpsSearchText: { color: BLUE, fontWeight: '700', fontSize: 15 },
  gpsHint: { fontSize: 11, color: '#64748b', lineHeight: 16, marginTop: 8 },
  top: { position: 'absolute', left: 14, right: 14, top: 18, zIndex: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', minHeight: 58, backgroundColor: '#fff', borderRadius: 18, paddingHorizontal: 15, elevation: 7, shadowColor: '#172b46', shadowOpacity: 0.16, shadowRadius: 14 },
  searchIcon: { fontSize: 30, color: BLUE, marginRight: 10 }, searchPlaceholder: { color: DARK, fontSize: 16, fontWeight: '600' },
  roundControl: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f4f8', alignItems: 'center', justifyContent: 'center' },
  optionIcon: { color: DARK, fontSize: 23 }, options: { marginTop: 9, padding: 16, backgroundColor: '#fff', borderRadius: 16, elevation: 5 },
  optionTitle: { fontWeight: '800', color: DARK, fontSize: 16 }, optionRow: { paddingVertical: 11 }, optionText: { color: DARK, fontSize: 15 },
  searchOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17,35,49,0.20)', zIndex: 20, paddingHorizontal: 12, paddingTop: 12 },
  searchPanel: { backgroundColor: '#fff', borderRadius: 20, padding: 16, elevation: 12 },
  searchHeading: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }, back: { fontSize: 36, color: BLUE, lineHeight: 37 }, panelTitle: { fontSize: 20, fontWeight: '800', color: DARK },
  input: { height: 48, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#eef2f6', fontSize: 15, color: DARK, marginBottom: 10 },
  result: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eef1f4', gap: 12 }, pin: { fontSize: 27, color: BLUE }, resultTitle: { fontSize: 15, fontWeight: '700', color: DARK },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 8 },
  sheet: { borderTopLeftRadius: 23, borderTopRightRadius: 23, backgroundColor: 'white', paddingHorizontal: 18, paddingTop: 9, paddingBottom: 22, elevation: 13, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 15 },
  handle: { width: 37, height: 5, borderRadius: 4, backgroundColor: '#d0d6de', alignSelf: 'center', marginBottom: 13 },
  selectedRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 12, marginBottom: 10, borderBottomColor: '#e9edf3', borderBottomWidth: 1 },
  eyebrow: { color: BLUE, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }, heading: { color: DARK, fontSize: 20, fontWeight: '800' },
  infoButton: { paddingHorizontal: 10 }, infoText: { color: BLUE, fontSize: 25 }, sheetTitle: { color: DARK, fontSize: 16, fontWeight: '800', marginBottom: 11 },
  routeField: { height: 43, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4f6f9', borderRadius: 10, marginBottom: 8, paddingHorizontal: 13, gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 }, routeText: { color: DARK, fontWeight: '600', fontSize: 14, flex: 1 }, muted: { color: '#737f8d' }, chevron: { color: '#697887', fontSize: 24 },
  hint: { color: '#707b89', fontSize: 12, lineHeight: 18, marginTop: 6 }, quickActions: { flexDirection: 'row', gap: 7, marginTop: 6, marginBottom: 8 }, quickButton: { borderColor: '#d8e4f7', borderWidth: 1, borderRadius: 20, paddingVertical: 9, paddingHorizontal: 11, flex: 1, alignItems: 'center' }, quickText: { color: BLUE, fontWeight: '700', fontSize: 12 },
  routeSummary: { marginTop: 9, padding: 12, backgroundColor: '#eaf2ff', borderRadius: 12 }, routeDistance: { color: BLUE, fontSize: 24, fontWeight: '800' }, routeTime: { color: DARK, fontSize: 13, fontWeight: '600' }, error: { color: '#b1292c', marginVertical: 9 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }, primary: { backgroundColor: BLUE, padding: 14, borderRadius: 30, alignItems: 'center' }, primaryText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  secondary: { backgroundColor: '#eff3fa', height: 47, width: 47, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }, secondaryText: { color: BLUE, fontSize: 24, fontWeight: '700' },
});
