const INDONESIAN_MONTHS: Record<string, number> = {
  januari: 0,
  februari: 1,
  maret: 2,
  april: 3,
  mei: 4,
  juni: 5,
  juli: 6,
  agustus: 7,
  september: 8,
  oktober: 9,
  november: 10,
  desember: 11,
};

const ENGLISH_MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

export function parseIndonesianDate(dateStr: string): Date {
  if (!dateStr) return new Date(NaN);

  const trimmed = dateStr.trim();

  // Try ISO format first: 2026-01-19
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return new Date(
      parseInt(isoMatch[1]),
      parseInt(isoMatch[2]) - 1,
      parseInt(isoMatch[3])
    );
  }

  // Try Indonesian/English format: "25 Desember 2025" or "25 December 2025"
  const parts = trimmed.split(/\s+/);
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const monthStr = parts[1].toLowerCase();
    const year = parseInt(parts[2]);

    if (!isNaN(day) && !isNaN(year)) {
      let month = INDONESIAN_MONTHS[monthStr];
      if (month === undefined) {
        month = ENGLISH_MONTHS[monthStr];
      }
      if (month !== undefined) {
        return new Date(year, month, day);
      }
    }
  }

  // Fallback: try native Date parser
  const native = new Date(trimmed);
  return native;
}

export function formatToIndonesianDate(date: Date): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}
