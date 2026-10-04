export function getCategoryIcon(category: string) {
  return category;
}

export function formatClickCount(count: number): string {
  if (count === 0) return 'No support clicks yet';
  if (count === 1) return '1 person clicked Support';
  return `${count} people clicked Support`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function getSupportMethodSummary(methods: { method_type: string }[]): string {
  if (methods.length === 0) return 'No support methods';
  if (methods.length <= 2) {
    return methods.map((m) => m.method_type).join(', ');
  }
  return `${methods[0].method_type}, ${methods[1].method_type} +${methods.length - 2}`;
}
