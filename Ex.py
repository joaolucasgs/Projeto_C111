import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns


high_pop = pd.read_csv('high_popularity_spotify_data.csv')
low_pop = pd.read_csv('low_popularity_spotify_data.csv')


high_pop['popularity_level'] = 'high'
low_pop['popularity_level'] = 'low'


data = pd.concat([high_pop, low_pop], ignore_index=True)


numeric_cols = ['energy', 'tempo', 'danceability', 'loudness', 'liveness', 'valence', 'speechiness', 'track_popularity', 'instrumentalness', 'duration_ms', 'acousticness']
for col in numeric_cols:
    data[col] = pd.to_numeric(data[col], errors='coerce')

# Pergunta 1: Diferença média nas características de áudio entre alta e baixa popularidade
print("Pergunta 1: Diferença média nas características de áudio (energia, dança, valência) entre músicas de alta e baixa popularidade")
features = ['energy', 'danceability', 'valence']
means = data.groupby('popularity_level')[features].mean()
print(means)
means.plot(kind='bar', figsize=(10,6))
plt.title('Média de Características de Áudio por Nível de Popularidade')
plt.ylabel('Média')
plt.show()

# Pergunta 2: Gêneros mais prevalentes em alta vs baixa popularidade
print("\nPergunta 2: Gêneros mais prevalentes em músicas de alta popularidade versus baixa")
genre_counts = data.groupby(['popularity_level', 'playlist_genre']).size().unstack().fillna(0)
print(genre_counts)
genre_counts.plot(kind='bar', stacked=True, figsize=(12,8))
plt.title('Contagem de Gêneros por Nível de Popularidade')
plt.ylabel('Contagem')
plt.show()

# Pergunta 3: Correlação entre popularidade e características como energia ou dança
print("\nPergunta 3: Correlação entre popularidade e características como energia ou dança")
correlations = data[['track_popularity', 'energy', 'danceability']].corr()
print(correlations)
sns.heatmap(correlations, annot=True, cmap='coolwarm', figsize=(8,6))
plt.title('Correlação entre Popularidade e Características')
plt.show()

# Pergunta 4: Artistas mais frequentes em alta popularidade
print("\nPergunta 4: Artistas que aparecem mais em listas de alta popularidade")
top_artists_high = high_pop['track_artist'].value_counts().head(10)
print(top_artists_high)
top_artists_high.plot(kind='bar', figsize=(10,6))
plt.title('Top 10 Artistas em Alta Popularidade')
plt.ylabel('Contagem')
plt.show()

# Pergunta 5: Como a data de lançamento afeta a popularidade
print("\nPergunta 5: Relação entre ano de lançamento e popularidade")
data['release_year'] = pd.to_datetime(data['track_album_release_date'], errors='coerce').dt.year
year_pop = data.groupby('release_year')['track_popularity'].mean()
print(year_pop.tail(10))  # Últimos 10 anos
year_pop.plot(figsize=(10,6))
plt.title('Média de Popularidade por Ano de Lançamento')
plt.ylabel('Popularidade Média')
plt.show()

# Pergunta 6: Diferenças na duração das músicas
print("\nPergunta 6: Diferenças na duração média das músicas entre alta e baixa popularidade")
duration_means = data.groupby('popularity_level')['duration_ms'].mean() / 1000  # em segundos
print(duration_means)
duration_means.plot(kind='bar', figsize=(8,6))
plt.title('Duração Média das Músicas (segundos)')
plt.ylabel('Duração (s)')
plt.show()

# Pergunta 7: Distribuição de valência
print("\nPergunta 7: Distribuição de valência (positividade) em alta vs baixa popularidade")
sns.boxplot(x='popularity_level', y='valence', data=data)
plt.title('Distribuição de Valência por Nível de Popularidade')
plt.show()

# Pergunta 8: Relação entre loudness e popularidade
print("\nPergunta 8: Relação entre loudness e popularidade")
sns.scatterplot(x='loudness', y='track_popularity', data=data)
plt.title('Loudness vs Popularidade')
plt.show()

# Pergunta 9: Speechiness em diferentes gêneros
print("\nPergunta 9: Níveis de speechiness em diferentes gêneros")
speech_genre = data.groupby('playlist_genre')['speechiness'].mean().sort_values()
print(speech_genre)
speech_genre.plot(kind='bar', figsize=(12,6))
plt.title('Speechiness Médio por Gênero')
plt.ylabel('Speechiness')
plt.show()

# Pergunta 10: Preferência por modo maior ou menor
print("\nPergunta 10: Preferência por modo maior (1) ou menor (0) em músicas populares")
mode_pop = data.groupby(['popularity_level', 'mode']).size().unstack().fillna(0)
print(mode_pop)
mode_pop.plot(kind='bar', figsize=(8,6))
plt.title('Contagem de Modo por Nível de Popularidade')
plt.ylabel('Contagem')
plt.show()