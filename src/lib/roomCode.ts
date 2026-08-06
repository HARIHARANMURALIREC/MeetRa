export function generateRoomCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz'
  const segment = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${segment(3)}-${segment(4)}-${segment(3)}`
}

export function normalizeRoomCode(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, '-')
}
