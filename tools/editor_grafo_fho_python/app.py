import json
import math
from pathlib import Path

import folium
import pandas as pd
import streamlit as st
from streamlit_folium import st_folium

st.set_page_config(page_title="Editor de Grafos FHO", page_icon="🗺️", layout="wide")

BASE_DIR = Path(__file__).parent
DEFAULT_CSV = BASE_DIR / "pontos.csv"
DEFAULT_GRAPH = BASE_DIR / "grafo-fho.json"


def parse_points(dataframe):
    """Converte cada linha válida em um nó com ID interno único.

    A coluna `nome` do CSV é preservada como `source_id`, mas não é usada
    como ID do grafo porque o arquivo de origem contém IDs repetidos.
    """
    points = []
    for _, row in dataframe.reset_index(drop=True).iterrows():
        wkt = str(row.get("WKT", ""))
        match = __import__("re").search(
            r"POINT\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)", wkt, flags=__import__("re").I
        )
        if not match:
            continue
        try:
            source_id = int(row["nome"])
        except (ValueError, TypeError, KeyError):
            continue
        node_id = len(points)  # ID único baseado na ordem das linhas válidas
        points.append({
            "id": node_id,
            "source_id": source_id,
            "name": str(node_id),
            "description": str(row.get("descrição", row.get("descricao", "")))
                if pd.notna(row.get("descrição", row.get("descricao", ""))) else "",
            "lat": float(match.group(2)),
            "lng": float(match.group(1)),
        })
    return points


def empty_adjacency(points):
    return {str(p["id"]): [] for p in points}


def distance_m(a, b):
    radius = 6371000
    lat1, lat2 = math.radians(a["lat"]), math.radians(b["lat"])
    dlat = lat2 - lat1
    dlng = math.radians(b["lng"] - a["lng"])
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(h))


def weighted_adjacency(points, adjacency):
    """Monta a lista de adjacência com o peso (distância em metros) de cada aresta."""
    by_id = {p["id"]: p for p in points}
    result = {}
    for node_id, neighbors in adjacency.items():
        a = by_id[int(node_id)]
        result[node_id] = [
            {
                "node": neighbor,
                "weight_m": round(distance_m(a, by_id[neighbor]), 2),
            }
            for neighbor in sorted(neighbors)
        ]
    return result


def parse_graph_json(payload):
    """Abre um grafo exportado anteriormente sem apagar as ligações."""
    nodes = payload.get("nodes", [])
    raw = payload.get("adjacency", {})
    if not isinstance(nodes, list) or not nodes:
        raise ValueError("O JSON não contém nós.")
    ids = [int(p["id"]) for p in nodes]
    if len(ids) != len(set(ids)):
        raise ValueError("IDs internos duplicados no JSON.")
    if set(raw) != {str(i) for i in ids}:
        raise ValueError("As chaves da adjacência não correspondem aos IDs dos nós.")
    result = {str(i): [int(v["node"]) for v in raw[str(i)]] for i in ids}
    for a, neighbors in result.items():
        for b in neighbors:
            if b == int(a) or b not in ids or int(a) not in result[str(b)]:
                raise ValueError(f"Conexão inválida/assimétrica: {a} ↔ {b}")
    return nodes, result


def add_edge(a, b):
    if a == b:
        st.warning("Não é possível conectar um ponto a ele mesmo.")
        return
    neighbors_a = st.session_state.adjacency[str(a)]
    if b in neighbors_a:
        st.info(f"A conexão {a} ↔ {b} já existe.")
        return
    st.session_state.history.append(json.loads(json.dumps(st.session_state.adjacency)))
    st.session_state.adjacency[str(a)].append(b)
    st.session_state.adjacency[str(b)].append(a)
    st.session_state.adjacency[str(a)].sort()
    st.session_state.adjacency[str(b)].sort()
    st.session_state.selected = None
    st.session_state.map_key += 1
    st.success(f"Conexão criada: {a} ↔ {b}")


def build_map(points, adjacency, selected, center=None, zoom=None):
    if center is None:
        center = [sum(p["lat"] for p in points) / len(points), sum(p["lng"] for p in points) / len(points)]
    m = folium.Map(location=center, zoom_start=zoom or 17, control_scale=True, tiles="OpenStreetMap")

    by_id = {p["id"]: p for p in points}

    # Arestas são desenhadas uma única vez, apesar de constarem nos dois nós.
    for source, neighbors in adjacency.items():
        a_id = int(source)
        if a_id not in by_id:
            continue
        for b_id in neighbors:
            if a_id < b_id and b_id in by_id:
                a, b = by_id[a_id], by_id[b_id]
                distance = distance_m(a, b)
                folium.PolyLine(
                    [(a["lat"], a["lng"]), (b["lat"], b["lng"])],
                    color="#16a36a", weight=4, opacity=0.9,
                    tooltip=f"{a_id} ↔ {b_id} · {distance:.2f} m"
                ).add_to(m)

    for p in points:
        is_selected = p["id"] == selected
        degree = len(adjacency.get(str(p["id"]), []))
        color = "#f59e0b" if is_selected else ("#16a36a" if degree else "#2563eb")
        label = f'Nó {p["id"]} (CSV {p["source_id"]}) — {p["description"]}' if p["description"] else f'Nó {p["id"]} (CSV {p["source_id"]})'
        folium.CircleMarker(
            location=[p["lat"], p["lng"]],
            radius=9 if is_selected else 6,
            color="white",
            weight=2,
            fill=True,
            fill_color=color,
            fill_opacity=1,
            tooltip=label,
            popup=folium.Popup(f"<b>{label}</b><br>Vizinhos: {degree}", max_width=250),
        ).add_to(m)

    return m


# Estado da aplicação
for key, default in {
    "points": [],
    "adjacency": {},
    "selected": None,
    "history": [],
    "map_key": 0,
    "last_click": None,
    "loaded": False,
    "notice": "",
    "last_csv_import": None,
    "last_json_import": None,
}.items():
    if key not in st.session_state:
        st.session_state[key] = default


st.title("Editor de Grafos — FHO")
st.caption("Construa a rede de caminhos do campus conectando os pontos diretamente no mapa.")

with st.sidebar:
    st.header("Dados dos pontos")
    uploaded_graph = st.file_uploader("Importar grafo existente (JSON)", type=["json"])
    if uploaded_graph is not None:
        try:
            data = uploaded_graph.getvalue()
            import hashlib
            signature = hashlib.sha256(data).hexdigest()
            if signature != st.session_state.last_json_import:
                pts, adj = parse_graph_json(json.loads(data.decode("utf-8-sig")))
                st.session_state.points = pts
                st.session_state.adjacency = adj
                st.session_state.selected = None
                st.session_state.history = []
                st.session_state.loaded = True
                st.session_state.map_key += 1
                st.session_state.last_json_import = signature
                st.success(f"Grafo carregado com {len(pts)} pontos e {sum(len(v) for v in adj.values()) // 2} arestas.")
        except Exception as exc:
            st.error(f"Não foi possível importar o grafo: {exc}")

    uploaded = st.file_uploader("Importar outro CSV (reinicia as conexões)", type=["csv"])
    if uploaded is not None:
        try:
            data_bytes = uploaded.getvalue()
            import hashlib
            signature = hashlib.sha256(data_bytes).hexdigest()
            if signature == st.session_state.last_csv_import:
                new_points = []  # já processado nesta sessão
            else:
                import io
                new_points = parse_points(pd.read_csv(io.BytesIO(data_bytes)))
            if new_points:
                st.session_state.last_csv_import = signature
                st.session_state.points = new_points
                st.session_state.adjacency = empty_adjacency(new_points)
                st.session_state.selected = None
                st.session_state.history = []
                st.session_state.loaded = True
                st.session_state.map_key += 1
                st.success(f"{len(new_points)} pontos importados.")
            elif signature != st.session_state.last_csv_import:
                st.error("Não encontrei pontos válidos. O CSV precisa ter as colunas nome e WKT.")
        except Exception as exc:
            st.error(f"Erro ao importar CSV: {exc}")

    if not st.session_state.loaded and DEFAULT_GRAPH.exists():
        try:
            pts, adj = parse_graph_json(json.loads(DEFAULT_GRAPH.read_text(encoding="utf-8-sig")))
            st.session_state.points = pts
            st.session_state.adjacency = adj
            st.session_state.loaded = True
        except Exception as exc:
            st.error(f"Não foi possível carregar o grafo inicial: {exc}")
    if not st.session_state.loaded and DEFAULT_CSV.exists():
        try:
            st.session_state.points = parse_points(pd.read_csv(DEFAULT_CSV))
            st.session_state.adjacency = empty_adjacency(st.session_state.points)
            st.session_state.loaded = True
        except Exception as exc:
            st.error(f"Não foi possível carregar pontos.csv: {exc}")

    points = st.session_state.points
    adjacency = st.session_state.adjacency

    st.divider()
    st.header("Resumo")
    edge_count = sum(len(v) for v in adjacency.values()) // 2
    isolated = sum(1 for v in adjacency.values() if not v)
    c1, c2 = st.columns(2)
    c1.metric("Pontos", len(points))
    c2.metric("Conexões", edge_count)
    st.metric("Pontos isolados", isolated)

    st.divider()
    st.header("Ações")
    col1, col2 = st.columns(2)
    with col1:
        if st.button("↶ Desfazer", use_container_width=True, disabled=not st.session_state.history):
            st.session_state.adjacency = st.session_state.history.pop()
            st.session_state.selected = None
            st.session_state.map_key += 1
            st.rerun()
    with col2:
        if st.button("Limpar", use_container_width=True, disabled=edge_count == 0):
            if st.session_state.get("confirm_clear", False):
                st.session_state.history.append(json.loads(json.dumps(adjacency)))
                st.session_state.adjacency = empty_adjacency(points)
                st.session_state.selected = None
                st.session_state.confirm_clear = False
                st.session_state.map_key += 1
                st.rerun()
            else:
                st.session_state.confirm_clear = True
                st.warning("Clique em Limpar novamente para confirmar.")

    if st.button("Exportar JSON", type="primary", use_container_width=True, disabled=not points):
        payload = {
            "directed": False,
            "weight_unit": "meters",
            "weight_method": "haversine_straight_line",
            "nodes": points,
            "adjacency": weighted_adjacency(points, adjacency),
        }
        st.download_button(
            "Baixar grafo-fho.json",
            data=json.dumps(payload, ensure_ascii=False, indent=2),
            file_name="grafo-fho.json",
            mime="application/json",
            use_container_width=True,
        )

if not st.session_state.points:
    st.warning("Nenhum ponto carregado. Coloque pontos.csv na mesma pasta do app.py ou importe um CSV pela barra lateral.")
    st.stop()

points = st.session_state.points
adjacency = st.session_state.adjacency
by_id = {p["id"]: p for p in points}

st.info(
    "Como conectar: clique em um ponto no mapa para selecioná-lo; depois clique em outro ponto. "
    "A ligação será criada nos dois sentidos."
)

left, right = st.columns([2.2, 1], gap="large")
with left:
    st.subheader("Mapa do campus")
    all_lats = [p["lat"] for p in points]
    all_lngs = [p["lng"] for p in points]
    center = [sum(all_lats) / len(all_lats), sum(all_lngs) / len(all_lngs)]
    fmap = build_map(points, adjacency, st.session_state.selected, center=center)
    map_data = st_folium(
        fmap,
        key=f"fho_map_{st.session_state.map_key}",
        height=650,
        use_container_width=True,
        returned_objects=["last_object_clicked", "last_object_clicked_tooltip", "center", "zoom"],
    )

    clicked = map_data.get("last_object_clicked") if map_data else None
    if clicked and clicked.get("lat") is not None and clicked.get("lng") is not None:
        click_key = (round(clicked["lat"], 7), round(clicked["lng"], 7))
        if click_key != st.session_state.last_click:
            st.session_state.last_click = click_key
            clicked_point = min(
                points,
                key=lambda p: (p["lat"] - clicked["lat"]) ** 2 + (p["lng"] - clicked["lng"]) ** 2
            )
            if distance_m(clicked_point, {"lat": clicked["lat"], "lng": clicked["lng"]}) < 35:
                if st.session_state.selected is None:
                    st.session_state.selected = clicked_point["id"]
                    st.rerun()
                elif st.session_state.selected == clicked_point["id"]:
                    st.session_state.selected = None
                    st.rerun()
                else:
                    add_edge(st.session_state.selected, clicked_point["id"])
                    st.rerun()

with right:
    st.subheader("Edição do grafo")
    selected = st.session_state.selected
    if selected is None:
        st.info("Nenhum ponto selecionado. Clique em um marcador no mapa.")
    else:
        point = by_id[selected]
        st.markdown(f"### Nó {selected}")
        st.write(point["description"] or "Sem descrição")
        st.caption(f'Latitude: {point["lat"]:.7f} · Longitude: {point["lng"]:.7f}')
        st.warning("Agora clique em outro marcador para criar uma conexão.")
        if st.button("Cancelar seleção", use_container_width=True):
            st.session_state.selected = None
            st.session_state.map_key += 1
            st.rerun()

    st.divider()
    st.markdown("### Lista de adjacência")
    selected_filter = st.checkbox("Mostrar somente nós conectados", value=False)
    rows = []
    for node_id in sorted(adjacency, key=int):
        neighbors = sorted(adjacency[node_id])
        if selected_filter and not neighbors:
            continue
        neighbor_labels = [
            f"{neighbor} ({distance_m(by_id[int(node_id)], by_id[neighbor]):.2f} m)"
            for neighbor in neighbors
        ]
        rows.append({"Nó": int(node_id), "Vizinhos e distâncias": ", ".join(neighbor_labels) if neighbors else "—", "Grau": len(neighbors)})
    st.dataframe(pd.DataFrame(rows), use_container_width=True, height=390, hide_index=True)

    if selected is not None:
        st.markdown(f"**Conexões do nó {selected}**")
        neighbors = sorted(adjacency[str(selected)])
        if neighbors:
            for neighbor in neighbors:
                c1, c2 = st.columns([4, 1])
                distance = distance_m(by_id[selected], by_id[neighbor])
                c1.write(f"↔ {neighbor} — {by_id[neighbor]['description'] or 'Sem descrição'} · **{distance:.2f} m**")
                if c2.button("×", key=f"remove_{selected}_{neighbor}", help="Remover conexão"):
                    st.session_state.history.append(json.loads(json.dumps(adjacency)))
                    st.session_state.adjacency[str(selected)].remove(neighbor)
                    st.session_state.adjacency[str(neighbor)].remove(selected)
                    st.session_state.map_key += 1
                    st.rerun()
        else:
            st.caption("Este ponto ainda não possui conexões.")

st.caption("As distâncias são calculadas automaticamente pela fórmula de Haversine (linha reta entre coordenadas), em metros. Elas não representam necessariamente o comprimento real de calçadas ou corredores. O mapa-base é fornecido pelo OpenStreetMap e requer conexão com a internet; os dados do grafo são processados localmente.")
