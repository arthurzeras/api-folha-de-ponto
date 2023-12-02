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

  if (minutes > 0 || (hours === 0 && minutes === 0)) {
    durationArray.push(`${minutes}M`);
  }

  durationArray.push(`${remainingSeconds}S`);

  return `PT${durationArray.join('')}`;
}
