export function cleanName(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .replace(/[\s_]+/g, ' ')
    .replace(/[-_*#@$%^&()+=\[\]{}<>!~`]+$/g, '')
    .trim();
}

export function cleanField(value: string): string {
  if (!value) return '';
  return value.trim().replace(/[\s_]+/g, ' ').trim();
}

export function namesMatch(a: string, b: string): boolean {
  return cleanName(a).toLowerCase() === cleanName(b).toLowerCase();
}
