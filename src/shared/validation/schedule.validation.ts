
/**
 *
 * @param schedule any[]
 * @returns {string|null} 
 */
export function validateScheduleDayOfWeek(schedule: any[]): string | null {
  if (!Array.isArray(schedule)) return null;
  for (const item of schedule) {
    let isValid = false;
    if (typeof item.dayOfWeek === 'number') {
      if (item.dayOfWeek >= 2 && item.dayOfWeek <= 7) isValid = true;
    }
    if (!isValid) {
      return 'Invalid dayOfWeek';
    }
  }
  return null;
}
