import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AnalysisPayload } from "@/types/analysis";
import { Activity, BarChart3, PieChart } from "lucide-react";

const chartMuted = "hsl(240 4% 46%)";
const chartPrimary = "hsl(262 83% 58%)";
const chartAccent = "hsl(173 58% 42%)";
const chartWarm = "hsl(32 95% 52%)";

function formatLevel(level: string) {
  return level === "high" ? "Alta popularidade" : level === "low" ? "Baixa popularidade" : level;
}

function CorrelationHeatmap({
  labels,
  matrix,
}: {
  labels: string[];
  matrix: number[][];
}) {
  const short = (s: string) =>
    s === "track_popularity"
      ? "Popularidade"
      : s === "energy"
        ? "Energia"
        : s === "danceability"
          ? "Dançabilidade"
          : s;

  const cellColor = (v: number) => {
    const t = (v + 1) / 2;
    const r = Math.round(110 + (1 - t) * 130);
    const g = Math.round(70 + Math.abs(v) * 140);
    const b = Math.round(210 - (1 - t) * 90);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-secondary/30 p-3">
      <table className="w-full min-w-[280px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="p-2 text-left font-normal text-muted-foreground" />
            {labels.map((l) => (
              <th key={l} className="p-2 text-center text-xs font-medium text-muted-foreground">
                {short(l)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={labels[i]}>
              <td className="p-2 text-xs font-medium text-muted-foreground">{short(labels[i])}</td>
              {row.map((v, j) => (
                <td key={`${i}-${j}`} className="p-1.5">
                  <div
                    className="rounded-md px-1 py-3 text-center font-mono text-[11px] font-semibold tabular-nums text-white shadow-sm"
                    style={{ backgroundColor: cellColor(v) }}
                  >
                    {v.toFixed(3)}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ValenceBoxPlot({
  boxes,
}: {
  boxes: AnalysisPayload["questions"]["q7_valence_distribution"]["boxes"];
}) {
  const width = 360;
  const height = 260;
  const pad = { t: 28, r: 18, b: 52, l: 46 };
  const iw = width - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const yBottom = pad.t + ih;

  const scaleY = (v: number) => yBottom - v * ih;

  return (
    <svg width={width} height={height} role="img" aria-label="Distribuição de valência">
      <text x={pad.l} y={18} className="fill-muted-foreground text-xs">
        Valência (0 = mais melancólico, 1 = mais positivo)
      </text>
      {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
        <g key={tick}>
          <line
            x1={pad.l}
            x2={width - pad.r}
            y1={scaleY(tick)}
            y2={scaleY(tick)}
            className="stroke-border"
            strokeDasharray="5 5"
          />
          <text
            x={pad.l - 10}
            y={scaleY(tick)}
            dy={4}
            textAnchor="end"
            className="fill-muted-foreground text-[10px]"
          >
            {tick}
          </text>
        </g>
      ))}
      {boxes.map((b, idx) => {
        if (
          b.min == null ||
          b.q1 == null ||
          b.median == null ||
          b.q3 == null ||
          b.max == null
        ) {
          return null;
        }
        const cx = pad.l + ((idx + 0.5) / boxes.length) * iw;
        const bw = Math.min(58, iw / boxes.length - 14);
        const xLeft = cx - bw / 2;
        const yMin = scaleY(b.min);
        const yMaxLine = scaleY(b.max);
        const yQ1 = scaleY(b.q1);
        const yQ3 = scaleY(b.q3);
        const yMed = scaleY(b.median);
        const qTop = Math.min(yQ1, yQ3);
        const qBot = Math.max(yQ1, yQ3);
        const label = formatLevel(b.level);
        return (
          <g key={b.level}>
            <line x1={cx} x2={cx} y1={yMin} y2={yMaxLine} stroke={chartPrimary} strokeWidth={2} />
            <line
              x1={cx - bw / 4}
              x2={cx + bw / 4}
              y1={yMin}
              y2={yMin}
              stroke={chartPrimary}
              strokeWidth={2}
            />
            <line
              x1={cx - bw / 4}
              x2={cx + bw / 4}
              y1={yMaxLine}
              y2={yMaxLine}
              stroke={chartPrimary}
              strokeWidth={2}
            />
            <rect
              x={xLeft}
              y={qTop}
              width={bw}
              height={Math.max(qBot - qTop, 1)}
              rx={5}
              fill={`${chartPrimary}33`}
              stroke={chartPrimary}
              strokeWidth={2}
            />
            <line x1={xLeft} x2={xLeft + bw} y1={yMed} y2={yMed} stroke={chartAccent} strokeWidth={3} />
            <text x={cx} y={height - 22} textAnchor="middle" className="fill-foreground text-xs font-medium">
              {label}
            </text>
            <text x={cx} y={height - 6} textAnchor="middle" className="fill-muted-foreground text-[10px]">
              n = {b.n.toLocaleString("pt-BR")}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function App() {
  const [payload, setPayload] = useState<AnalysisPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/analysis_results.json")
      .then((res) => {
        if (!res.ok) throw new Error(`Não foi possível carregar analysis_results.json (${res.status}).`);
        return res.json();
      })
      .then(setPayload)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const q1ChartData = useMemo(() => {
    if (!payload) return [];
    const { levels, series } = payload.questions.q1_audio_means;
    return levels.map((level, i) => ({
      nivel: formatLevel(level),
      Energia: series.energy[i],
      Dançabilidade: series.danceability[i],
      Valência: series.valence[i],
    }));
  }, [payload]);

  const q2TopGenres = useMemo(() => {
    if (!payload) return [];
    const { genres, high, low } = payload.questions.q2_genre_counts;
    const rows = genres.map((g, i) => ({
      genre: g,
      Alta: high[i],
      Baixa: low[i],
      total: high[i] + low[i],
    }));
    rows.sort((a, b) => b.total - a.total);
    return rows.slice(0, 14);
  }, [payload]);

  const q4ArtistData = useMemo(() => {
    if (!payload) return [];
    const { artists, counts } = payload.questions.q4_top_artists_high;
    return artists.map((name, i) => ({ artista: name, faixas: counts[i] })).reverse();
  }, [payload]);

  const q5LineData = useMemo(() => {
    if (!payload) return [];
    const { years, mean_popularity } = payload.questions.q5_popularity_by_year;
    return years.map((y, i) => ({
      ano: y != null ? String(Math.round(y)) : "",
      popularidade: mean_popularity[i],
    }));
  }, [payload]);

  const q6DurationData = useMemo(() => {
    if (!payload) return [];
    const { levels, seconds } = payload.questions.q6_duration_means;
    return levels.map((level, i) => ({
      nivel: formatLevel(level),
      segundos: seconds[i],
    }));
  }, [payload]);

  const q9SpeechData = useMemo(() => {
    if (!payload) return [];
    const { genres, speechiness } = payload.questions.q9_speechiness_by_genre;
    return genres.map((g, i) => ({ genero: g, speechiness: speechiness[i] }));
  }, [payload]);

  const q10StackData = useMemo(() => {
    if (!payload) return [];
    const { modes, high, low } = payload.questions.q10_mode_by_popularity;
    const idx0 = modes.findIndex((m) => m === 0);
    const idx1 = modes.findIndex((m) => m === 1);
    const menorHigh = idx0 >= 0 ? high[idx0] : 0;
    const maiorHigh = idx1 >= 0 ? high[idx1] : 0;
    const menorLow = idx0 >= 0 ? low[idx0] : 0;
    const maiorLow = idx1 >= 0 ? low[idx1] : 0;
    return [
      { nivel: "Alta popularidade", Menor: menorHigh, Maior: maiorHigh },
      { nivel: "Baixa popularidade", Menor: menorLow, Maior: maiorLow },
    ];
  }, [payload]);

  const scatterData = payload?.questions.q8_loudness_popularity.points ?? [];

  const tooltipStyles = {
    contentStyle: {
      borderRadius: "10px",
      border: "1px solid hsl(var(--border))",
      background: "hsl(var(--card))",
      color: "hsl(var(--card-foreground))",
    },
    labelStyle: { fontWeight: 600 },
  };

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <Card className="max-w-lg border-destructive/40">
          <CardHeader>
            <CardTitle>Falha ao carregar dados</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Execute <code className="rounded bg-muted px-1 py-0.5">python Ex.py</code> na raiz do projeto para gerar{" "}
            <code className="rounded bg-muted px-1 py-0.5">web/public/analysis_results.json</code>, depois recarregue
            esta página.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <Activity className="h-10 w-10 animate-pulse text-primary" aria-hidden />
        <p className="text-muted-foreground">A carregar resultados da análise…</p>
      </div>
    );
  }

  const meta = payload.metadata;

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/40 via-background to-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Projeto C111</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Popularidade no Spotify</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Painel gerado a partir de <strong>{meta.source_rows.toLocaleString("pt-BR")}</strong> linhas combinadas
              (alta e baixa popularidade). Dados gerados em{" "}
              {new Date(meta.generated_at).toLocaleString("pt-BR", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              .
            </p>
          </div>
          <div className="flex gap-3 text-muted-foreground">
            <BarChart3 className="h-9 w-9 shrink-0 opacity-70" aria-hidden />
            <PieChart className="h-9 w-9 shrink-0 opacity-70" aria-hidden />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{payload.questions.q1_audio_means.title}</CardTitle>
            <CardDescription>
              Barras agrupadas — comparação direta entre faixas de alta e baixa popularidade nas playlists.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={q1ChartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke={chartMuted} vertical={false} />
                <XAxis dataKey="nivel" tick={{ fill: chartMuted, fontSize: 12 }} axisLine={{ stroke: chartMuted }} />
                <YAxis
                  domain={[0, 1]}
                  tick={{ fill: chartMuted, fontSize: 12 }}
                  axisLine={{ stroke: chartMuted }}
                  tickFormatter={(v) => v.toFixed(2)}
                />
                <Tooltip formatter={(v: number) => v.toFixed(3)} {...tooltipStyles} />
                <Legend />
                <Bar dataKey="Energia" fill={chartPrimary} radius={[6, 6, 0, 0]} />
                <Bar dataKey="Dançabilidade" fill={chartAccent} radius={[6, 6, 0, 0]} />
                <Bar dataKey="Valência" fill={chartWarm} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{payload.questions.q2_genre_counts.title}</CardTitle>
            <CardDescription>
              Top 14 gêneros por volume total de faixas — contagens separadas para alta vs baixa popularidade.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={q2TopGenres} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke={chartMuted} horizontal={false} />
                <XAxis type="number" tick={{ fill: chartMuted, fontSize: 11 }} axisLine={{ stroke: chartMuted }} />
                <YAxis
                  type="category"
                  dataKey="genre"
                  width={112}
                  tick={{ fill: chartMuted, fontSize: 11 }}
                  axisLine={{ stroke: chartMuted }}
                />
                <Tooltip formatter={(v: number) => Math.round(v)} {...tooltipStyles} />
                <Legend />
                <Bar dataKey="Alta" stackId="a" fill={chartPrimary} radius={[0, 4, 4, 0]} />
                <Bar dataKey="Baixa" stackId="a" fill={chartMuted} radius={[4, 0, 0, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{payload.questions.q3_correlation.title}</CardTitle>
            <CardDescription>
              Matriz de correlação de Pearson — valores próximos de 1 ou −1 indicam associação mais forte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CorrelationHeatmap
              labels={payload.questions.q3_correlation.labels}
              matrix={payload.questions.q3_correlation.matrix}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{payload.questions.q4_top_artists_high.title}</CardTitle>
            <CardDescription>Top 10 artistas mais frequentes nas faixas classificadas como alta popularidade.</CardDescription>
          </CardHeader>
          <CardContent className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={q4ArtistData} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke={chartMuted} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: chartMuted, fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="artista"
                  width={150}
                  tick={{ fill: chartMuted, fontSize: 11 }}
                  axisLine={{ stroke: chartMuted }}
                />
                <Tooltip formatter={(v: number) => `${v} faixas`} {...tooltipStyles} />
                <Bar dataKey="faixas" fill={chartAccent} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{payload.questions.q5_popularity_by_year.title}</CardTitle>
            <CardDescription>Média de popularidade das faixas por ano de lançamento do álbum (últimos anos com dados).</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={q5LineData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke={chartMuted} />
                <XAxis dataKey="ano" tick={{ fill: chartMuted, fontSize: 11 }} axisLine={{ stroke: chartMuted }} />
                <YAxis tick={{ fill: chartMuted, fontSize: 11 }} axisLine={{ stroke: chartMuted }} domain={[40, "auto"]} />
                <Tooltip formatter={(v: number) => v.toFixed(2)} {...tooltipStyles} />
                <Legend />
                <Line type="monotone" dataKey="popularidade" stroke={chartPrimary} strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{payload.questions.q6_duration_means.title}</CardTitle>
            <CardDescription>Duração média por nível de popularidade (segundos).</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={q6DurationData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke={chartMuted} vertical={false} />
                <XAxis dataKey="nivel" tick={{ fill: chartMuted, fontSize: 12 }} />
                <YAxis tick={{ fill: chartMuted, fontSize: 12 }} label={{ value: "s", position: "insideLeft" }} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)} s`} {...tooltipStyles} />
                <Bar dataKey="segundos" fill={chartWarm} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{payload.questions.q7_valence_distribution.title}</CardTitle>
            <CardDescription>
              Diagrama em caixa (mediana, quartis e extremos) sintetizando a distribuição de valência por grupo.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center overflow-x-auto">
            <ValenceBoxPlot boxes={payload.questions.q7_valence_distribution.boxes} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{payload.questions.q8_loudness_popularity.title}</CardTitle>
            <CardDescription>
              Amostra de {payload.questions.q8_loudness_popularity.sample_size.toLocaleString("pt-BR")} pontos —
              loudness (dB) vs popularidade da faixa.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke={chartMuted} />
                <XAxis
                  type="number"
                  dataKey="loudness"
                  name="Loudness"
                  tick={{ fill: chartMuted, fontSize: 11 }}
                  axisLine={{ stroke: chartMuted }}
                />
                <YAxis
                  type="number"
                  dataKey="track_popularity"
                  name="Popularidade"
                  tick={{ fill: chartMuted, fontSize: 11 }}
                  axisLine={{ stroke: chartMuted }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "4 4" }}
                  formatter={(value: number, name: string) => [
                    name === "track_popularity" ? value.toFixed(1) : value.toFixed(2),
                    name === "track_popularity" ? "Popularidade" : "Loudness",
                  ]}
                  {...tooltipStyles}
                />
                <Scatter data={scatterData} fill={chartPrimary} fillOpacity={0.55} />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{payload.questions.q9_speechiness_by_genre.title}</CardTitle>
            <CardDescription>Gêneros ordenados por speechiness médio (presença de fala na mistura).</CardDescription>
          </CardHeader>
          <CardContent className="h-[480px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={q9SpeechData} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke={chartMuted} horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, "auto"]}
                  tick={{ fill: chartMuted, fontSize: 11 }}
                  axisLine={{ stroke: chartMuted }}
                />
                <YAxis dataKey="genero" type="category" width={108} tick={{ fill: chartMuted, fontSize: 11 }} />
                <Tooltip formatter={(v: number) => v.toFixed(4)} {...tooltipStyles} />
                <Bar dataKey="speechiness" fill={chartAccent} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{payload.questions.q10_mode_by_popularity.title}</CardTitle>
            <CardDescription>
              Barras empilhadas — proporção de faixas em modo menor (0) vs modo maior (1) por nível de popularidade.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={q10StackData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke={chartMuted} vertical={false} />
                <XAxis dataKey="nivel" tick={{ fill: chartMuted, fontSize: 12 }} />
                <YAxis tick={{ fill: chartMuted, fontSize: 11 }} />
                <Tooltip formatter={(v: number) => Math.round(v)} {...tooltipStyles} />
                <Legend />
                <Bar dataKey="Menor" stackId="m" fill={chartMuted} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Maior" stackId="m" fill={chartPrimary} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
