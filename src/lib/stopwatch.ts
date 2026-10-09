/**
 * LIVE STOPWATCH & TICKET DURATION ENGINE
 * Calculates elapsed duration from authoritative UTC timestamps.
 * Immune to client browser timer throttling and tab sleep.
 */

/**
 * Format total seconds into HH:mm:ss (e.g. 00:14:32)
 */
export function formatStopwatchTime(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00:00';
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}

/**
 * Format total seconds into HH:mm (e.g. 00:45)
 */
export function formatHHMM(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');

  return `${hh}:${mm}`;
}

/**
 * Format seconds into human readable duration (e.g. "45m" or "1h 15m")
 */
export function formatHumanDuration(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds <= 0) return '0m';
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}

export const formatDurationHuman = formatHumanDuration;

/**
 * Compute elapsed seconds between startedAt UTC and now (or endedAt)
 */
export function computeElapsedSeconds(startedAtUtc?: string, endedAtUtc?: string): number {
  if (!startedAtUtc) return 0;
  
  const startTime = new Date(startedAtUtc).getTime();
  if (isNaN(startTime)) return 0;

  const endTime = endedAtUtc ? new Date(endedAtUtc).getTime() : Date.now();
  if (isNaN(endTime)) return 0;

  return Math.max(0, Math.floor((endTime - startTime) / 1000));
}

/**
 * Parse a string duration "HH:mm" or "HH:mm:ss" back into seconds
 */
export function parseDurationToSeconds(durationStr?: string): number {
  if (!durationStr || typeof durationStr !== 'string') return 0;
  const parts = durationStr.trim().split(':').map(Number);
  
  if (parts.length === 2) {
    // HH:mm
    return (parts[0] * 3600) + (parts[1] * 60);
  }
  if (parts.length === 3) {
    // HH:mm:ss
    return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  }
  return 0;
}
