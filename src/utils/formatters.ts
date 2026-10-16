export function formatMediaType(format?: string | null): string {
  if (!format) return 'TV';
  switch (format.toUpperCase()) {
    case 'TV':
      return 'TV';
    case 'TV_SHORT':
      return 'TV Short';
    case 'MOVIE':
      return 'Movie';
    case 'SPECIAL':
      return 'Special';
    case 'OVA':
      return 'OVA';
    case 'ONA':
      return 'ONA';
    case 'MUSIC':
      return 'Music';
    default:
      return format.replace(/_/g, ' ');
  }
}

export function formatEpisodeCount(episodes?: number | null, status?: string | null): string {
  if (typeof episodes === 'number' && episodes > 0) {
    return `${episodes} EPS`;
  }
  if (!status) return 'TBA';
  switch (status.toUpperCase()) {
    case 'NOT_YET_RELEASED':
      return 'UPCOMING';
    case 'RELEASING':
      return 'AIRING';
    case 'FINISHED':
      return 'FINISHED';
    case 'CANCELLED':
      return 'CANCELLED';
    case 'HIATUS':
      return 'HIATUS';
    default:
      return status.replace(/_/g, ' ');
  }
}
