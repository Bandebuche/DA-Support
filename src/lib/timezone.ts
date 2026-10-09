/**
 * STRICT ASIA/KOLKATA (IST - UTC+5:30) TIMEZONE POLICY ENGINE
 * Persists all authoritative timestamps in ISO UTC, formats deterministically in IST.
 */

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Format UTC ISO string or timestamp into IST Date (DD/MM/YYYY)
 */
export function formatISTDate(isoString?: string | number | Date): string {
  if (!isoString) return '--/--/----';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '--/--/----';
    
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return '--/--/----';
  }
}

/**
 * Format UTC ISO string into IST Time (HH:mm:ss 24-hr)
 */
export function formatISTTime(isoString?: string | number | Date, withSeconds = true): string {
  if (!isoString) return '--:--';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '--:--';

    return new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: withSeconds ? '2-digit' : undefined,
      hour12: false,
    }).format(date);
  } catch {
    return '--:--';
  }
}

/**
 * Full IST timestamp: DD/MM/YYYY, HH:mm:ss IST
 */
export function formatISTFull(isoString?: string | number | Date): string {
  if (!isoString) return '--';
  return `${formatISTDate(isoString)} ${formatISTTime(isoString)}`;
}

/**
 * Get current real-time live clock in IST
 */
export function getCurrentISTClockString(): string {
  return formatISTTime(new Date(), true);
}

export const formatToISTDateString = formatISTDate;
export const formatToISTTimeString = formatISTTime;
export const formatToISTDateTimeString = formatISTFull;

/**
 * Determine if given UTC timestamp falls on "Today" in Asia/Kolkata
 */
export function isTodayInIST(isoString?: string): boolean {
  if (!isoString) return false;
  try {
    const targetDateStr = formatISTDate(isoString);
    const todayDateStr = formatISTDate(new Date());
    return targetDateStr === todayDateStr;
  } catch {
    return false;
  }
}

/**
 * Determine if given UTC timestamp falls on "Yesterday" in Asia/Kolkata
 */
export function isYesterdayInIST(isoString?: string): boolean {
  if (!isoString) return false;
  try {
    const targetDateStr = formatISTDate(isoString);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayDateStr = formatISTDate(yesterday);
    return targetDateStr === yesterdayDateStr;
  } catch {
    return false;
  }
}
