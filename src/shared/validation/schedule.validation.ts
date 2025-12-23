// src/shared/validation/schedule.validation.ts

/**
 * Validate schedule.dayOfWeek
 * @param schedule any[]
 * @returns {string|null} null nếu hợp lệ, trả về message nếu lỗi
 */
export function validateScheduleDayOfWeek(schedule: any[]): string | null {
  if (!Array.isArray(schedule)) return null;
  for (const item of schedule) {
    let isValid = false;
    if (typeof item.dayOfWeek === 'number') {
      if (item.dayOfWeek >= 2 && item.dayOfWeek <= 7) isValid = true;
    } else if (typeof item.dayOfWeek === 'string') {
      const val = item.dayOfWeek.trim().toLowerCase().normalize('NFC');
      if (val === 'cn' || val === 'chủ nhật' || val === 'chu nhat') isValid = true;
    }
    if (!isValid) {
      return 'Invalid dayOfWeek';
    }
  }
  return null;
}
