export const ISO_DATE_PATTERN =
  /^20\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;

/**
 * Transform an hourly formatted string to seconds.
 * Ex.: 08:00:00 -> 28800
 * @param {string} hourString
 */
export function hourStringToSeconds(hourString) {
  const [hours, minutes, seconds] = hourString.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Transform seconds to ISO8601 duration format.
 * @param {number} seconds
 * @returns An ISO8601 duration format
 */
export function secondsToISO8601Duration(seconds) {
  const absSeconds = Math.abs(seconds);
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const remainingSeconds = absSeconds % 60;

  const durationArray = [];

  if (seconds < 0) {
    durationArray.push('-');
  }

  if (hours > 0) {
    durationArray.push(`${hours}H`);
  }

  if (minutes > 0) {
    durationArray.push(`${minutes}M`);
  }

  durationArray.push(`${remainingSeconds}S`);

  return `PT${durationArray.join('')}`;
}
