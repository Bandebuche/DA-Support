/**
 * Digital Azadi Support - Time & SLA Duration Calculation Engine
 * Indian Standard Time (IST / Asia/Kolkata - UTC+5:30)
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TimeCalculator = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  /**
   * Get current time in Indian Standard Time (IST)
   * @returns {Date} Current Date object adjusted for IST
   */
  function getISTDate() {
    // Current UTC time + 5 hours 30 minutes
    const now = new Date();
    // Use Intl API when available for exact Asia/Kolkata timezone
    try {
      const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      return new Date(istString);
    } catch (e) {
      // Fallback manual offset: UTC + 5h30m
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      return new Date(utc + (5.5 * 3600000));
    }
  }

  /**
   * Formats a date into DD/MM/YYYY in IST
   * @param {Date} [date]
   * @returns {string} e.g. "09/10/2026"
   */
  function formatISTDate(date) {
    const d = date || getISTDate();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Formats a date into HH:mm:ss (24-hour) in IST
   * @param {Date} [date]
   * @returns {string} e.g. "15:30:45"
   */
  function formatISTTime(date) {
    const d = date || getISTDate();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Formats full timestamp in IST
   * @param {Date} [date]
   * @returns {string} e.g. "09/10/2026 15:30:45"
   */
  function formatISTTimestamp(date) {
    const d = date || getISTDate();
    return `${formatISTDate(d)} ${formatISTTime(d)}`;
  }

  /**
   * Parses arbitrary time string into total seconds from start of day
   * Handles:
   *  - "14:30:45" (24h with seconds)
   *  - "14:30" (24h without seconds)
   *  - "1:30" or "01:30"
   *  - "02:30 PM", "2:30 pm", "11:15 AM" (12h format)
   * @param {string} timeStr 
   * @returns {number|null} Total seconds (0 - 86399) or null if invalid
   */
  function parseTimeToSeconds(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const cleanStr = timeStr.trim();
    if (!cleanStr) return null;

    // Check for 12-hour AM/PM format
    const ampmMatch = cleanStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const minutes = parseInt(ampmMatch[2], 10);
      const seconds = ampmMatch[3] ? parseInt(ampmMatch[3], 10) : 0;
      const period = ampmMatch[4].toUpperCase();

      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60 && seconds >= 0 && seconds < 60) {
        return (hours * 3600) + (minutes * 60) + seconds;
      }
      return null;
    }

    // Check for standard 24-hour format: HH:mm:ss or HH:mm
    const stdMatch = cleanStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (stdMatch) {
      const hours = parseInt(stdMatch[1], 10);
      const minutes = parseInt(stdMatch[2], 10);
      const seconds = stdMatch[3] ? parseInt(stdMatch[3], 10) : 0;

      if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60 && seconds >= 0 && seconds < 60) {
        return (hours * 3600) + (minutes * 60) + seconds;
      }
    }

    return null;
  }

  /**
   * Calculates duration between start time and end time
   * Handles cross-hour and cross-midnight scenarios.
   * 
   * @param {string} startTime - e.g. "14:30:00", "14:30", "11:45 PM"
   * @param {string} endTime - e.g. "15:15:30", "15:15", "00:15 AM"
   * @returns {{
   *   formatted: string, // "HH:mm" (e.g. "00:45", "01:20")
   *   formattedWithSec: string, // "HH:mm:ss"
   *   minutes: number,   // Total duration in minutes (rounded)
   *   totalSeconds: number,
   *   isValid: boolean
   * }}
   */
  function calculateDuration(startTime, endTime) {
    const invalidResult = {
      formatted: "--:--",
      formattedWithSec: "--:--:--",
      minutes: 0,
      totalSeconds: 0,
      isValid: false
    };

    if (!startTime || !endTime) return invalidResult;

    const startSec = parseTimeToSeconds(startTime);
    const endSec = parseTimeToSeconds(endTime);

    if (startSec === null || endSec === null) return invalidResult;

    let diffSec = endSec - startSec;

    // Cross-midnight handling: if end is less than start, add 24 hours (86400 seconds)
    if (diffSec < 0) {
      diffSec += 86400;
    }

    const hours = Math.floor(diffSec / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    const seconds = diffSec % 60;

    const formattedHHMM = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    const formattedHHMMSS = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const totalMinutes = Math.round(diffSec / 60);

    return {
      formatted: formattedHHMM,
      formattedWithSec: formattedHHMMSS,
      minutes: totalMinutes,
      totalSeconds: diffSec,
      isValid: true
    };
  }

  /**
   * Calculates duration from start time until NOW (IST)
   * @param {string} startTime 
   * @returns {Object} Same as calculateDuration
   */
  function calculateRunningDuration(startTime) {
    const nowTime = formatISTTime();
    return calculateDuration(startTime, nowTime);
  }

  /**
   * Generates a unique Ticket ID in the format DA-YYYY-XXXX
   * e.g. DA-2026-8492 or DA-2026-K7M2
   */
  function generateTicketId() {
    const year = getISTDate().getFullYear();
    const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `DA-${year}-${code}`;
  }

  /**
   * Computes human-readable duration label (e.g. "45 mins" or "1 hr 15 mins")
   * @param {number|string} minutesOrHHMM 
   * @returns {string}
   */
  function formatHumanDuration(minutesOrHHMM) {
    let minutes = 0;
    if (typeof minutesOrHHMM === 'string' && minutesOrHHMM.includes(':')) {
      const parts = minutesOrHHMM.split(':');
      minutes = (parseInt(parts[0], 10) * 60) + parseInt(parts[1], 10);
    } else {
      minutes = parseInt(minutesOrHHMM, 10) || 0;
    }

    if (minutes <= 0) return "0 mins";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hrs === 0) return `${mins} mins`;
    if (mins === 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
    return `${hrs} hr${hrs > 1 ? 's' : ''} ${mins} min${mins > 1 ? 's' : ''}`;
  }

  return {
    getISTDate,
    formatISTDate,
    formatISTTime,
    formatISTTimestamp,
    parseTimeToSeconds,
    calculateDuration,
    calculateRunningDuration,
    generateTicketId,
    formatHumanDuration
  };
}));
