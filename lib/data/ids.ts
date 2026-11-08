/** Identifiant local unique (« pl-lx2k9a-3f7q »), en attendant ceux du serveur. */
export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
