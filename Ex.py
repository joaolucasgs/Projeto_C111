import json
import os
from datetime import datetime, timezone

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns


def json_sanitize(obj):
    """Convert numpy/pandas scalars and nested structures to JSON-serializable types."""
    if isinstance(obj, dict):
        return {str(k): json_sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [json_sanitize(v) for v in obj]
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
        return None
    if pd.isna(obj):
        return None
    return obj


high_pop = pd.read_csv("high_popularity_spotify_data.csv")
low_pop = pd.read_csv("low_popularity_spotify_data.csv")

high_pop["popularity_level"] = "high"
low_pop["popularity_level"] = "low"

data = pd.concat([high_pop, low_pop], ignore_index=True)

numeric_cols = [
    "energy",
    "tempo",
    "danceability",
    "loudness",
    "liveness",
    "valence",
    "speechiness",
    "track_popularity",
    "instrumentalness",
    "duration_ms",
    "acousticness",
]
for col in numeric_cols:
    data[col] = pd.to_numeric(data[col], errors="coerce")

results = {
    "metadata": {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_rows": int(len(data)),
    },
    "questions": {},
}


# Pergunta 1
features = ["energy", "danceability", "valence"]
means = data.groupby("popularity_level")[features].mean()
results["questions"]["q1_audio_means"] = {
    "title": "Média de energia, dançabilidade e valência por nível de popularidade",
    "levels": means.index.tolist(),
    "series": {feat: means[feat].tolist() for feat in features},
}

means.plot(kind="bar", figsize=(10, 6))
plt.title("Média de Características de Áudio por Nível de Popularidade")
plt.ylabel("Média")
plt.tight_layout()
plt.savefig("q1_audio_means.png")
plt.close()

# Pergunta 2
genre_counts = data.groupby(["popularity_level", "playlist_genre"]).size().unstack().fillna(0)
genres = genre_counts.columns.tolist()
results["questions"]["q2_genre_counts"] = {
    "title": "Contagem de faixas por gênero e nível de popularidade",
    "genres": genres,
    "high": genre_counts.loc["high"].tolist() if "high" in genre_counts.index else [],
    "low": genre_counts.loc["low"].tolist() if "low" in genre_counts.index else [],
}

genre_counts.plot(kind="bar", stacked=True, figsize=(12, 8))
plt.title("Contagem de Gêneros por Nível de Popularidade")
plt.ylabel("Contagem")
plt.tight_layout()
plt.savefig("q2_genre_counts.png")
plt.close()

# Pergunta 3
correlations = data[["track_popularity", "energy", "danceability"]].corr()
corr_labels = correlations.columns.tolist()
results["questions"]["q3_correlation"] = {
    "title": "Correlação entre popularidade, energia e dançabilidade",
    "labels": corr_labels,
    "matrix": correlations.values.tolist(),
}

plt.figure(figsize=(8, 6))
sns.heatmap(correlations, annot=True, cmap="coolwarm")
plt.title("Correlação entre Popularidade e Características")
plt.tight_layout()
plt.savefig("q3_correlation.png")
plt.close()

# Pergunta 4
top_artists_high = high_pop["track_artist"].value_counts().head(10)
results["questions"]["q4_top_artists_high"] = {
    "title": "Artistas mais frequentes em músicas de alta popularidade",
    "artists": top_artists_high.index.tolist(),
    "counts": top_artists_high.astype(int).tolist(),
}

top_artists_high.plot(kind="bar", figsize=(10, 6))
plt.title("Top 10 Artistas em Alta Popularidade")
plt.ylabel("Contagem")
plt.tight_layout()
plt.savefig("q4_top_artists.png")
plt.close()

# Pergunta 5
data["release_year"] = pd.to_datetime(data["track_album_release_date"], errors="coerce").dt.year
year_pop = data.groupby("release_year")["track_popularity"].mean()
recent_years = year_pop.tail(10)
results["questions"]["q5_popularity_by_year"] = {
    "title": "Popularidade média por ano de lançamento (últimos 10 anos com dados)",
    "years": [float(y) if pd.notna(y) else None for y in recent_years.index],
    "mean_popularity": [float(v) if pd.notna(v) else None for v in recent_years.values],
}

year_pop.plot(figsize=(10, 6))
plt.title("Média de Popularidade por Ano de Lançamento")
plt.ylabel("Popularidade Média")
plt.tight_layout()
plt.savefig("q5_year_popularity.png")
plt.close()

# Pergunta 6
duration_means_sec = data.groupby("popularity_level")["duration_ms"].mean() / 1000
results["questions"]["q6_duration_means"] = {
    "title": "Duração média das faixas (segundos) por nível de popularidade",
    "levels": duration_means_sec.index.tolist(),
    "seconds": duration_means_sec.astype(float).tolist(),
}

duration_means_sec.plot(kind="bar", figsize=(8, 6))
plt.title("Duração Média das Músicas (segundos)")
plt.ylabel("Duração (s)")
plt.tight_layout()
plt.savefig("q6_duration.png")
plt.close()

# Pergunta 7 — estatísticas para box plot no front-end
def valence_box_stats(level):
    s = data.loc[data["popularity_level"] == level, "valence"].dropna()
    if len(s) == 0:
        return {
            "min": None,
            "q1": None,
            "median": None,
            "q3": None,
            "max": None,
            "n": 0,
        }
    q = s.quantile([0, 0.25, 0.5, 0.75, 1.0])
    return {
        "min": float(q.iloc[0]),
        "q1": float(q.iloc[1]),
        "median": float(q.iloc[2]),
        "q3": float(q.iloc[3]),
        "max": float(q.iloc[4]),
        "n": int(len(s)),
    }


results["questions"]["q7_valence_distribution"] = {
    "title": "Distribuição de valência por nível de popularidade",
    "boxes": [
        {"level": "high", **valence_box_stats("high")},
        {"level": "low", **valence_box_stats("low")},
    ],
}

sns.boxplot(x="popularity_level", y="valence", data=data)
plt.title("Distribuição de Valência por Nível de Popularidade")
plt.tight_layout()
plt.savefig("q7_valence.png")
plt.close()

# Pergunta 8 — amostra para dispersão
scatter_df = data[["loudness", "track_popularity"]].dropna()
max_pts = 3000
if len(scatter_df) > max_pts:
    scatter_df = scatter_df.sample(max_pts, random_state=42)
results["questions"]["q8_loudness_popularity"] = {
    "title": "Relação entre loudness e popularidade",
    "sample_size": int(len(scatter_df)),
    "points": [
        {"loudness": float(r["loudness"]), "track_popularity": float(r["track_popularity"])}
        for _, r in scatter_df.iterrows()
    ],
}

sns.scatterplot(x="loudness", y="track_popularity", data=scatter_df)
plt.title("Loudness vs Popularidade")
plt.tight_layout()
plt.savefig("q8_loudness.png")
plt.close()

# Pergunta 9
speech_genre = data.groupby("playlist_genre")["speechiness"].mean().sort_values()
results["questions"]["q9_speechiness_by_genre"] = {
    "title": "Speechiness médio por gênero da playlist",
    "genres": speech_genre.index.tolist(),
    "speechiness": speech_genre.astype(float).tolist(),
}

speech_genre.plot(kind="bar", figsize=(12, 6))
plt.title("Speechiness Médio por Gênero")
plt.ylabel("Speechiness")
plt.tight_layout()
plt.savefig("q9_speechiness.png")
plt.close()

# Pergunta 10
mode_pop = data.groupby(["popularity_level", "mode"]).size().unstack().fillna(0)
mode_cols = sorted(
    mode_pop.columns.tolist(),
    key=lambda x: float(x) if isinstance(x, (int, float, np.integer, np.floating)) else float(str(x)),
)
results["questions"]["q10_mode_by_popularity"] = {
    "title": "Contagem de modo tonal (0 = menor, 1 = maior) por popularidade",
    "modes": [float(c) if pd.notna(c) else None for c in mode_cols],
    "high": [float(mode_pop.loc["high", c]) if "high" in mode_pop.index else 0 for c in mode_cols],
    "low": [float(mode_pop.loc["low", c]) if "low" in mode_pop.index else 0 for c in mode_cols],
}

mode_pop.plot(kind="bar", figsize=(8, 6))
plt.title("Contagem de Modo por Nível de Popularidade")
plt.ylabel("Contagem")
plt.tight_layout()
plt.savefig("q10_mode.png")
plt.close()

out_path = "web/public/analysis_results.json"

os.makedirs(os.path.dirname(out_path), exist_ok=True)

with open(out_path, "w", encoding="utf-8") as f:
    json.dump(json_sanitize(results), f, ensure_ascii=False, indent=2)

print(f"Resultados JSON gravados em: {out_path}")
