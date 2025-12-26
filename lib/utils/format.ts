export function formatVolume(value: string | number | undefined | null): string {
  if (!value) return '-';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '-';
  
  if (num === 0) return '0';
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absNum >= 1_000_000_000) {
    return `${sign}${(absNum / 1_000_000_000).toFixed(1)}B`;
  }
  
  if (absNum >= 1_000_000) {
    return `${sign}${(absNum / 1_000_000).toFixed(1)}M`;
  }
  
  if (absNum >= 1_000) {
    return `${sign}${(absNum / 1_000).toFixed(1)}K`;
  }
  
  if (absNum < 1) {
    return `${sign}${absNum.toFixed(2)}`;
  }
  
  return `${sign}${absNum.toFixed(0)}`;
}

