const users = new Map<string, string>();

export function setUsername(address: string, username: string) {
  users.set(address.toLowerCase(), username);
}

export function getUsername(address: string): string | null {
  return users.get(address.toLowerCase()) || null;
}
