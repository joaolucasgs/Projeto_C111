export interface AnalysisPayload {
  metadata: {
    generated_at: string;
    source_rows: number;
  };
  questions: {
    q1_audio_means: {
      title: string;
      levels: string[];
      series: Record<string, number[]>;
    };
    q2_genre_counts: {
      title: string;
      genres: string[];
      high: number[];
      low: number[];
    };
    q3_correlation: {
      title: string;
      labels: string[];
      matrix: number[][];
    };
    q4_top_artists_high: {
      title: string;
      artists: string[];
      counts: number[];
    };
    q5_popularity_by_year: {
      title: string;
      years: (number | null)[];
      mean_popularity: (number | null)[];
    };
    q6_duration_means: {
      title: string;
      levels: string[];
      seconds: number[];
    };
    q7_valence_distribution: {
      title: string;
      boxes: Array<{
        level: string;
        min: number | null;
        q1: number | null;
        median: number | null;
        q3: number | null;
        max: number | null;
        n: number;
      }>;
    };
    q8_loudness_popularity: {
      title: string;
      sample_size: number;
      points: Array<{ loudness: number; track_popularity: number }>;
    };
    q9_speechiness_by_genre: {
      title: string;
      genres: string[];
      speechiness: number[];
    };
    q10_mode_by_popularity: {
      title: string;
      modes: (number | null)[];
      high: number[];
      low: number[];
    };
  };
}
