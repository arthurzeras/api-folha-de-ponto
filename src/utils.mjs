/**
 * Transform an hourly formatted string to seconds.
 * Ex.: 08:00:00 -> 28800
 * @param {string} hourString
 */
export function hourStringToSeconds(hourString) {
  const [hours, minutes, seconds] = hourString.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}
