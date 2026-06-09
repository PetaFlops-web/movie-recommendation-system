export function formatIMDBScore(score: number): string {
  return score ? score.toFixed(1) : 'N/A';
}

export function formatRuntime(minutes: number | null | undefined): string {
  if (!minutes) return '';
  const value = Number(minutes);
  if (!Number.isFinite(value) || value <= 0) return '';
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  if (hours > 0) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  return `${mins}m`;
}

export function formatSimilarityScore(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

export function encodeMovieTitle(title: string): string {
  return encodeURIComponent(title);
}

export function decodeMovieTitle(encoded: string): string {
  return decodeURIComponent(encoded);
}

export function parseGenres(genreString: string): string[] {
  if (!genreString || genreString === 'nan') return [];
  return genreString.split(',').map((g) => g.trim()).filter(Boolean);
}

export function getScoreColor(score: number): string {
  if (score >= 8) return '#00A9FF';
  if (score >= 7) return '#89CFF3';
  if (score >= 6) return '#A0E9FF';
  return '#CDF5FD';
}