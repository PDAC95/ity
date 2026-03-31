export const AVATAR_COLORS = [
  'bg-violet-600',
  'bg-blue-600',
  'bg-emerald-600',
  'bg-orange-600',
  'bg-pink-600',
  'bg-indigo-600',
];

export function getAvatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] ?? 'bg-indigo-600';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
